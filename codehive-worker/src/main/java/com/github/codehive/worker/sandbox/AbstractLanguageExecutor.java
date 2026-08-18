package com.github.codehive.worker.sandbox;

import static com.github.codehive.worker.sandbox.SandboxConstants.*;

import com.github.codehive.worker.model.dto.ExecutionResult;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.WaitContainerResultCallback;
import com.github.dockerjava.api.model.AccessMode;
import com.github.dockerjava.api.model.Bind;
import com.github.dockerjava.api.model.Capability;
import com.github.dockerjava.api.model.Frame;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.api.model.StreamType;
import com.github.dockerjava.api.model.Ulimit;
import com.github.dockerjava.api.model.Volume;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

public abstract class AbstractLanguageExecutor implements LanguageExecutor {

    protected final Logger logger = LoggerFactory.getLogger(getClass());
    protected final DockerClient dockerClient;

    /**
     * Docker image used for the execution container (e.g.
     * "irmindev/java-exec:latest").
     */
    protected abstract String execImage();

    /** PID limit for containers (64 for JVM/interpreted, 32 for native). */
    protected abstract long pidsLimit();

    /** Source file name written into /workspace (e.g. "Main.java", "main.py"). */
    protected abstract String sourceFileName();

    /** Temp directory prefix for {@link Files#createTempDirectory}. */
    protected abstract String tempDirPrefix();

    /**
     * Shell command fragment to execute the program (e.g. "java Main", "python
     * main.py").
     */
    protected abstract String runCommand();

    // ── Optional hooks (override when needed) ────────────────────────────

    /**
     * Docker image used for compilation (e.g.
     * "eclipse-temurin:21-jdk-ubi10-minimal").
     * Return {@code null} for interpreted languages that skip compilation.
     */
    protected String compileImage() {
        return null;
    }

    /**
     * Compile command to execute inside the container (e.g. {"javac",
     * "Main.java"}).
     * Return {@code null} for interpreted languages that skip compilation.
     */
    protected String[] compileCommand() {
        return null;
    }

    /** Environment variables for the run container (default: none). */
    protected String[] containerEnv() {
        return null;
    }

    /**
     * Classify a non-zero exit code that is not TLE (124) or MLE (137).
     * Return {@code null} to fall through to the default runtime-error verdict.
     */
    protected ExecutionResult classifyNonZeroExit(long exitCode, String stdout, String stderr, long executionTime) {
        return null;
    }

    // ── Constructor ──────────────────────────────────────────────────────

    protected AbstractLanguageExecutor(DockerClient dockerClient) {
        this.dockerClient = dockerClient;
        ensureImageExists();
    }

    /**
     * Pull all required Docker images if they are not already available locally.
     */
    private void ensureImageExists() {
        List<String> images = new ArrayList<>();
        if (compileImage() != null) {
            images.add(compileImage());
        }
        images.add(execImage());

        for (String image : images) {
            try {
                dockerClient.inspectImageCmd(image).exec();
                logger.info("Docker image {} is available", image);
            } catch (Exception e) {
                logger.info("Pulling Docker image {}...", image);
                try {
                    dockerClient.pullImageCmd(image).start().awaitCompletion();
                    logger.info("Successfully pulled image {}", image);
                } catch (InterruptedException ex) {
                    Thread.currentThread().interrupt();
                    logger.error("Image pull interrupted", ex);
                }
            }
        }
    }

    // ── HostConfig builders ──────────────────────────────────────────────

    /**
     * Build a hardened HostConfig for execution containers.
     * Workspace is mounted read-only since the binary is already compiled.
     */
    private HostConfig buildRunHostConfig(Path tempDir, long memoryLimitMb) {
        return HostConfig.newHostConfig()
                .withBinds(new Bind(tempDir.toString(), new Volume("/workspace"), AccessMode.ro))
                .withMemory(memoryLimitMb * 1024 * 1024L)
                .withMemorySwap(memoryLimitMb * 1024 * 1024L)
                .withCpuQuota(CPU_QUOTA)
                .withNetworkMode("none")
                .withPidsLimit(pidsLimit())
                .withCapDrop(Capability.ALL)
                .withReadonlyRootfs(true)
                .withTmpFs(Map.of(
                        "/tmp", RUN_TMPFS_TMP,
                        "/run", RUN_TMPFS_RUN))
                .withUlimits(new Ulimit[] {
                        new Ulimit("fsize", RUN_ULIMIT_FSIZE, RUN_ULIMIT_FSIZE),
                        new Ulimit("nofile", RUN_ULIMIT_NOFILE, RUN_ULIMIT_NOFILE) })
                .withSecurityOpts(buildSecurityOpts());
    }

    /**
     * Build a hardened HostConfig for compilation containers.
     * Workspace is mounted read-write so the compiler can write output files.
     */
    private HostConfig buildCompileHostConfig(Path workDir) {
        return HostConfig.newHostConfig()
                .withBinds(new Bind(workDir.toString(), new Volume("/workspace")))
                .withMemory(COMPILE_MEMORY_BYTES)
                .withMemorySwap(COMPILE_MEMORY_BYTES)
                .withCpuQuota(CPU_QUOTA)
                .withNetworkMode("none")
                .withPidsLimit(pidsLimit())
                .withCapDrop(Capability.ALL)
                .withReadonlyRootfs(true)
                .withTmpFs(Map.of(
                        "/tmp", COMPILE_TMPFS_TMP,
                        "/run", COMPILE_TMPFS_RUN))
                .withUlimits(new Ulimit[] {
                        new Ulimit("fsize", COMPILE_ULIMIT_FSIZE, COMPILE_ULIMIT_FSIZE),
                        new Ulimit("nofile", COMPILE_ULIMIT_NOFILE, COMPILE_ULIMIT_NOFILE) })
                .withSecurityOpts(buildSecurityOpts());
    }

    // ── Compilation lifecycle ────────────────────────────────────────────

    /**
     * Run the compilation step inside a short-lived container.
     * Uses {@link #compileImage()} and {@link #compileCommand()} to determine
     * the image and command. Returns {@code null} on success, or an
     * {@code ExecutionResult} with the compilation error on failure.
     * If {@link #compileCommand()} returns {@code null}, compilation is skipped.
     */
    private ExecutionResult compile(Path workDir) {
        String[] cmd = compileCommand();
        if (cmd == null) {
            return null;
        }
        String containerId = null;
        try {
            CreateContainerResponse container = dockerClient.createContainerCmd(compileImage())
                    .withHostConfig(buildCompileHostConfig(workDir))
                    .withWorkingDir("/workspace")
                    .withUser("nobody")
                    .withCmd(cmd)
                    .exec();

            containerId = container.getId();
            dockerClient.startContainerCmd(containerId).exec();

            int exitCode = dockerClient.waitContainerCmd(containerId)
                    .exec(new WaitContainerResultCallback())
                    .awaitStatusCode(30, TimeUnit.SECONDS);

            if (exitCode != 0) {
                String stderr = getContainerLogsCompile(containerId);
                return ExecutionResult.compilationError(stderr);
            }

            return null;
        } catch (Exception e) {
            logger.error("Compilation error", e);
            return ExecutionResult.compilationError("Compilation failed: " + e.getMessage());
        } finally {
            if (containerId != null) {
                try {
                    dockerClient.removeContainerCmd(containerId).withForce(true).exec();
                } catch (Exception e) {
                    logger.warn("Failed to remove compile container", e);
                }
            }
        }
    }

    /**
     * Retrieve stderr logs from the compilation container, capped at
     * {@link SandboxConstants#COMPILE_STDERR_LIMIT_BYTES}.
     */
    private String getContainerLogsCompile(String containerId) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        int[] bytesWritten = { 0 };
        try {
            dockerClient.logContainerCmd(containerId)
                    .withStdOut(false)
                    .withStdErr(true)
                    .exec(new ResultCallback.Adapter<Frame>() {
                        @Override
                        public void onNext(Frame frame) {
                            byte[] payload = frame.getPayload();
                            if (payload == null)
                                return;
                            int remaining = COMPILE_STDERR_LIMIT_BYTES - bytesWritten[0];
                            if (remaining <= 0)
                                return;
                            int toWrite = Math.min(payload.length, remaining);
                            try {
                                baos.write(payload, 0, toWrite);
                            } catch (Exception ignored) {
                            }
                            bytesWritten[0] += toWrite;
                        }
                    }).awaitCompletion(5, TimeUnit.SECONDS);
        } catch (Exception e) {
            logger.error("Failed to get compile logs", e);
        }
        return baos.toString(StandardCharsets.UTF_8);
    }

    // ── prepare() — Template Method ──────────────────────────────────────

    @Override
    public ContainerSession prepare(InputStream sourceCode, Long timeLimitMs, Long memoryLimitMb) throws Exception {
        timeLimitMs = timeLimitMs != null ? timeLimitMs : DEFAULT_TIME_LIMIT_MS;
        memoryLimitMb = memoryLimitMb != null ? memoryLimitMb : DEFAULT_MEMORY_LIMIT_MB;

        // Clamp to hard bounds so a malformed/oversized job cannot exhaust the host.
        timeLimitMs = clamp(timeLimitMs, MIN_TIME_LIMIT_MS, MAX_TIME_LIMIT_MS);
        memoryLimitMb = clamp(memoryLimitMb, MIN_MEMORY_LIMIT_MB, MAX_MEMORY_LIMIT_MB);

        Path tempDir = Files.createTempDirectory(tempDirPrefix());
        Files.setPosixFilePermissions(tempDir, PosixFilePermissions.fromString("rwxrwxrwx"));

        Path sourceFile = tempDir.resolve(sourceFileName());
        byte[] sourceBytes = sourceCode.readNBytes(SOURCE_SIZE_LIMIT_BYTES);
        Files.write(sourceFile, sourceBytes);
        Files.setPosixFilePermissions(sourceFile, PosixFilePermissions.fromString("r--r--r--"));

        ExecutionResult compileResult = compile(tempDir);
        if (compileResult != null) {
            deleteDirectory(tempDir);
            return ContainerSession.compilationError(compileResult.getCompilationError());
        }

        var containerCmd = dockerClient.createContainerCmd(execImage())
                .withHostConfig(buildRunHostConfig(tempDir, memoryLimitMb))
                .withWorkingDir("/workspace")
                .withUser("nobody")
                .withCmd("sh", "-c", "sleep infinity");

        String[] env = containerEnv();
        if (env != null) {
            containerCmd.withEnv(env);
        }

        CreateContainerResponse container = containerCmd.exec();
        String containerId = container.getId();
        dockerClient.startContainerCmd(containerId).exec();

        return new ContainerSession(containerId, tempDir, timeLimitMs, memoryLimitMb);
    }

    // ── runTestCase() — Template Method ──────────────────────────────────

    @Override
    public ExecutionResult runTestCase(ContainerSession session, InputStream testInput) throws Exception {
        Path inputFile = session.getTempDir().resolve("input.txt");

        if (testInput != null) {
            byte[] inputBytes = testInput.readNBytes(INPUT_SIZE_LIMIT_BYTES);
            Files.write(inputFile, inputBytes);
            Files.setPosixFilePermissions(inputFile, PosixFilePermissions.fromString("r--r--r--"));
        } else {
            Files.deleteIfExists(inputFile);
        }

        boolean hasInput = Files.exists(inputFile);
        double timeLimitSec = session.getTimeLimitMs() / 1000.0;
        String timeoutCmd = String.format("timeout --kill-after=2s %.3fs %s", timeLimitSec, runCommand());
        String cmd = hasInput ? timeoutCmd + " < input.txt" : timeoutCmd;

        String execId = dockerClient.execCreateCmd(session.getContainerId())
                .withAttachStdout(true)
                .withAttachStderr(true)
                .withWorkingDir("/workspace")
                .withUser("nobody")
                .withCmd("sh", "-c", cmd)
                .exec()
                .getId();

        ByteArrayOutputStream stdoutBaos = new ByteArrayOutputStream();
        ByteArrayOutputStream stderrBaos = new ByteArrayOutputStream();
        int[] sharedBytes = { 0 };
        boolean[] truncated = { false };

        long startTime = System.currentTimeMillis();

        dockerClient.execStartCmd(execId)
                .exec(new ResultCallback.Adapter<Frame>() {
                    @Override
                    public void onNext(Frame frame) {
                        byte[] payload = frame.getPayload();
                        if (payload == null)
                            return;
                        synchronized (sharedBytes) {
                            int remaining = OUTPUT_LIMIT_BYTES - sharedBytes[0];
                            if (remaining <= 0) {
                                truncated[0] = true;
                                return;
                            }
                            int toWrite = Math.min(payload.length, remaining);
                            try {
                                if (frame.getStreamType() == StreamType.STDOUT) {
                                    stdoutBaos.write(payload, 0, toWrite);
                                } else {
                                    stderrBaos.write(payload, 0, toWrite);
                                }
                            } catch (Exception ignored) {
                            }
                            sharedBytes[0] += toWrite;
                            if (toWrite < payload.length)
                                truncated[0] = true;
                        }
                    }
                })
                .awaitCompletion(session.getTimeLimitMs() + 5000, TimeUnit.MILLISECONDS);

        long executionTime = System.currentTimeMillis() - startTime;

        Long exitCode = dockerClient.inspectExecCmd(execId).exec().getExitCodeLong();
        if (exitCode == null)
            exitCode = -1L;

        String stdout = stdoutBaos.toString(StandardCharsets.UTF_8);
        String stderr = stderrBaos.toString(StandardCharsets.UTF_8);

        cleanupBetweenRuns(session);

        if (truncated[0]) {
            return ExecutionResult.outputLimitExceeded(
                    stdout + "\n[Output truncated: exceeded 8 MB limit]", executionTime);
        }
        if (exitCode == 124L) {
            return ExecutionResult.timeLimitExceeded(session.getTimeLimitMs());
        }
        if (exitCode == 137L) {
            return ExecutionResult.memoryLimitExceeded(session.getMemoryLimitMb());
        }
        if (exitCode != 0) {
            ExecutionResult special = classifyNonZeroExit(exitCode, stdout, stderr, executionTime);
            if (special != null)
                return special;
            return ExecutionResult.runtimeError(stderr, exitCode.intValue(), executionTime);
        }
        return ExecutionResult.success(stdout, executionTime, 0L);
    }

    // ── cleanup() ────────────────────────────────────────────────────────

    @Override
    public void cleanup(ContainerSession session) {
        if (session.getContainerId() != null) {
            try {
                dockerClient.removeContainerCmd(session.getContainerId()).withForce(true).exec();
            } catch (Exception e) {
                logger.warn("Failed to remove container {}", session.getContainerId(), e);
            }
        }
        if (session.getTempDir() != null) {
            deleteDirectory(session.getTempDir());
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────

    private void cleanupBetweenRuns(ContainerSession session) {
        try {
            Files.deleteIfExists(session.getTempDir().resolve("input.txt"));
        } catch (Exception e) {
            logger.warn("Failed to delete input.txt between runs", e);
        }
        try {
            String cleanExecId = dockerClient.execCreateCmd(session.getContainerId())
                    .withCmd("sh", "-c", "rm -rf /tmp/* 2>/dev/null; true")
                    .withUser("nobody")
                    .exec()
                    .getId();
            dockerClient.execStartCmd(cleanExecId)
                    .exec(new ResultCallback.Adapter<Frame>() {
                    })
                    .awaitCompletion(3, TimeUnit.SECONDS);
        } catch (Exception e) {
            logger.warn("Failed to clean /tmp between runs", e);
        }
    }

    private List<String> buildSecurityOpts() {
        List<String> opts = new ArrayList<>();
        opts.add("no-new-privileges:true");
        if (SECCOMP_PROFILE != null) {
            opts.add("seccomp=" + SECCOMP_PROFILE);
        }
        return opts;
    }

    private void deleteDirectory(Path directory) {
        try {
            Path realBase = directory.toRealPath();
            Files.walkFileTree(directory, new SimpleFileVisitor<Path>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                    try {
                        if (file.toRealPath().startsWith(realBase))
                            Files.deleteIfExists(file);
                    } catch (Exception e) {
                        logger.warn("Failed to delete: {}", file, e);
                    }
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult postVisitDirectory(Path dir, IOException exc) {
                    try {
                        Files.deleteIfExists(dir);
                    } catch (Exception e) {
                        logger.warn("Failed to delete dir: {}", dir, e);
                    }
                    return FileVisitResult.CONTINUE;
                }
            });
        } catch (Exception e) {
            logger.warn("Failed to delete directory: {}", directory, e);
        }
    }
}
