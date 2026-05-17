package com.github.codehive.worker.sandbox.java;

import com.github.codehive.worker.model.dto.ExecutionResult;
import com.github.codehive.worker.sandbox.ContainerSession;
import com.github.codehive.worker.sandbox.LanguageExecutor;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.WaitContainerResultCallback;
import com.github.dockerjava.api.model.Bind;
import com.github.dockerjava.api.model.Capability;
import com.github.dockerjava.api.model.Frame;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.api.model.Mount;
import com.github.dockerjava.api.model.MountType;
import com.github.dockerjava.api.model.StreamType;
import com.github.dockerjava.api.model.TmpfsOptions;
import com.github.dockerjava.api.model.Ulimit;
import com.github.dockerjava.api.model.Volume;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

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
import java.util.concurrent.TimeUnit;

@Component("JAVA")
public class JavaExecutor implements LanguageExecutor {
    private static final Logger logger = LoggerFactory.getLogger(JavaExecutor.class);
    private final DockerClient dockerClient;
    private static final String JAVA_IMAGE = "eclipse-temurin:21-jdk-ubi10-minimal";
    private static final long DEFAULT_TIME_LIMIT_MS = 5000L;
    private static final long DEFAULT_MEMORY_LIMIT_MB = 256L;
    private static final int OUTPUT_LIMIT_BYTES = 4 * 1024 * 1024;
    private static final int COMPILE_STDERR_LIMIT_BYTES = 256 * 1024;
    private static final long PIDS_LIMIT = 64L;

    private static final String SECCOMP_PROFILE;
    static {
        String profile = null;
        try (InputStream is = JavaExecutor.class.getResourceAsStream("/seccomp/sandbox-profile.json")) {
            if (is != null) profile = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            // Runs without seccomp if profile fails to load
        }
        SECCOMP_PROFILE = profile;
    }

    public JavaExecutor(DockerClient dockerClient) {
        this.dockerClient = dockerClient;
        ensureImageExists();
    }

    private void ensureImageExists() {
        try {
            dockerClient.inspectImageCmd(JAVA_IMAGE).exec();
            logger.info("Docker image {} is available", JAVA_IMAGE);
        } catch (Exception e) {
            logger.info("Pulling Docker image {}...", JAVA_IMAGE);
            try {
                dockerClient.pullImageCmd(JAVA_IMAGE).start().awaitCompletion();
                logger.info("Successfully pulled image {}", JAVA_IMAGE);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                logger.error("Image pull interrupted", ex);
            }
        }
    }

    @Override
    public ContainerSession prepare(InputStream sourceCode, Long timeLimitMs, Long memoryLimitMb) throws Exception {
        timeLimitMs = timeLimitMs != null ? timeLimitMs : DEFAULT_TIME_LIMIT_MS;
        memoryLimitMb = memoryLimitMb != null ? memoryLimitMb : DEFAULT_MEMORY_LIMIT_MB;

        Path tempDir = Files.createTempDirectory("java-exec-");
        Files.setPosixFilePermissions(tempDir, PosixFilePermissions.fromString("rwxrwxrwx"));

        Path sourceFile = tempDir.resolve("Main.java");
        byte[] sourceBytes = sourceCode.readNBytes(512 * 1024);
        Files.write(sourceFile, sourceBytes);
        Files.setPosixFilePermissions(sourceFile, PosixFilePermissions.fromString("r--r--r--"));

        // Compile first
        ExecutionResult compileResult = compile(tempDir);
        if (compileResult != null) {
            deleteDirectory(tempDir);
            return ContainerSession.compilationError(compileResult.getCompilationError());
        }

        // Start long-running execution container
        HostConfig hostConfig = HostConfig.newHostConfig()
                .withBinds(new Bind(tempDir.toString(), new Volume("/workspace")))
                .withMemory(memoryLimitMb * 1024 * 1024L)
                .withMemorySwap(memoryLimitMb * 1024 * 1024L)
                .withCpuQuota(100000L)
                .withNetworkMode("none")
                .withPidsLimit(PIDS_LIMIT)
                .withCapDrop(Capability.ALL)
                .withReadonlyRootfs(true)
                .withMounts(List.of(
                    new Mount().withType(MountType.TMPFS).withTarget("/tmp")
                        .withTmpfsOptions(new TmpfsOptions().withSizeBytes(32L * 1024 * 1024).withMode(01777)),
                    new Mount().withType(MountType.TMPFS).withTarget("/run")
                        .withTmpfsOptions(new TmpfsOptions().withSizeBytes(8L * 1024 * 1024).withMode(0755))
                ))
                .withUlimits(new Ulimit[]{new Ulimit("fsize", 33554432L, 33554432L)})
                .withSecurityOpts(buildSecurityOpts());

        CreateContainerResponse container = dockerClient.createContainerCmd(JAVA_IMAGE)
                .withHostConfig(hostConfig)
                .withWorkingDir("/workspace")
                .withUser("nobody")
                .withCmd("sh", "-c", "sleep infinity")
                .exec();

        String containerId = container.getId();
        dockerClient.startContainerCmd(containerId).exec();

        return new ContainerSession(containerId, tempDir, timeLimitMs, memoryLimitMb);
    }

    @Override
    public ExecutionResult runTestCase(ContainerSession session, InputStream testInput) throws Exception {
        Path inputFile = session.getTempDir().resolve("input.txt");

        if (testInput != null) {
            byte[] inputBytes = testInput.readNBytes(64 * 1024 * 1024);
            Files.write(inputFile, inputBytes);
            Files.setPosixFilePermissions(inputFile, PosixFilePermissions.fromString("r--r--r--"));
        } else {
            Files.deleteIfExists(inputFile);
        }

        boolean hasInput = Files.exists(inputFile);
        double timeLimitSec = session.getTimeLimitMs() / 1000.0;
        String timeoutCmd = String.format("timeout --kill-after=2s %.3fs java Main", timeLimitSec);
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
        int[] sharedBytes = {0};
        boolean[] truncated = {false};

        long startTime = System.currentTimeMillis();

        dockerClient.execStartCmd(execId)
                .exec(new ResultCallback.Adapter<Frame>() {
                    @Override
                    public void onNext(Frame frame) {
                        byte[] payload = frame.getPayload();
                        if (payload == null) return;
                        synchronized (sharedBytes) {
                            int remaining = OUTPUT_LIMIT_BYTES - sharedBytes[0];
                            if (remaining <= 0) { truncated[0] = true; return; }
                            int toWrite = Math.min(payload.length, remaining);
                            try {
                                if (frame.getStreamType() == StreamType.STDOUT) {
                                    stdoutBaos.write(payload, 0, toWrite);
                                } else {
                                    stderrBaos.write(payload, 0, toWrite);
                                }
                            } catch (Exception ignored) {}
                            sharedBytes[0] += toWrite;
                            if (toWrite < payload.length) truncated[0] = true;
                        }
                    }
                })
                .awaitCompletion(session.getTimeLimitMs() + 5000, TimeUnit.MILLISECONDS);

        long executionTime = System.currentTimeMillis() - startTime;

        Long exitCode = dockerClient.inspectExecCmd(execId).exec().getExitCodeLong();
        if (exitCode == null) exitCode = -1L;

        String stdout = stdoutBaos.toString(StandardCharsets.UTF_8);
        String stderr = stderrBaos.toString(StandardCharsets.UTF_8);

        cleanupBetweenRuns(session);

        if (exitCode == 124L) {
            return ExecutionResult.timeLimitExceeded(session.getTimeLimitMs());
        }
        if (exitCode == 137L) {
            return ExecutionResult.memoryLimitExceeded(session.getMemoryLimitMb() * 1024L);
        }
        if (truncated[0]) {
            return ExecutionResult.outputLimitExceeded(
                stdout + "\n[Output truncated: exceeded 4 MB limit]", executionTime);
        }
        if (exitCode != 0) {
            return ExecutionResult.runtimeError(stderr, exitCode.intValue(), executionTime);
        }
        return ExecutionResult.success(stdout, executionTime, 0L);
    }

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
                    .exec(new ResultCallback.Adapter<Frame>() {})
                    .awaitCompletion(3, TimeUnit.SECONDS);
        } catch (Exception e) {
            logger.warn("Failed to clean /tmp between runs", e);
        }
    }

    private ExecutionResult compile(Path workDir) {
        String containerId = null;
        try {
            HostConfig hostConfig = HostConfig.newHostConfig()
                    .withBinds(new Bind(workDir.toString(), new Volume("/workspace")))
                    .withMemory(512 * 1024 * 1024L)
                    .withNetworkMode("none")
                    .withPidsLimit(PIDS_LIMIT)
                    .withCapDrop(Capability.ALL)
                    .withReadonlyRootfs(true)
                    .withMounts(List.of(
                        new Mount().withType(MountType.TMPFS).withTarget("/tmp")
                            .withTmpfsOptions(new TmpfsOptions().withSizeBytes(64L * 1024 * 1024).withMode(01777)),
                        new Mount().withType(MountType.TMPFS).withTarget("/run")
                            .withTmpfsOptions(new TmpfsOptions().withSizeBytes(8L * 1024 * 1024).withMode(0755))
                    ))
                    .withUlimits(new Ulimit[]{new Ulimit("fsize", 67108864L, 67108864L)})
                    .withSecurityOpts(buildSecurityOpts());

            CreateContainerResponse container = dockerClient.createContainerCmd(JAVA_IMAGE)
                    .withHostConfig(hostConfig)
                    .withWorkingDir("/workspace")
                    .withUser("nobody")
                    .withCmd("javac", "Main.java")
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

    private String getContainerLogsCompile(String containerId) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        int[] bytesWritten = {0};
        try {
            dockerClient.logContainerCmd(containerId)
                .withStdOut(false)
                .withStdErr(true)
                .exec(new ResultCallback.Adapter<Frame>() {
                    @Override
                    public void onNext(Frame frame) {
                        byte[] payload = frame.getPayload();
                        if (payload == null) return;
                        int remaining = COMPILE_STDERR_LIMIT_BYTES - bytesWritten[0];
                        if (remaining <= 0) return;
                        int toWrite = Math.min(payload.length, remaining);
                        try { baos.write(payload, 0, toWrite); } catch (Exception ignored) {}
                        bytesWritten[0] += toWrite;
                    }
                }).awaitCompletion(5, TimeUnit.SECONDS);
        } catch (Exception e) {
            logger.error("Failed to get compile logs", e);
        }
        return baos.toString(StandardCharsets.UTF_8);
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
                        if (file.toRealPath().startsWith(realBase)) Files.deleteIfExists(file);
                    } catch (Exception e) {
                        logger.warn("Failed to delete: {}", file, e);
                    }
                    return FileVisitResult.CONTINUE;
                }
                @Override
                public FileVisitResult postVisitDirectory(Path dir, IOException exc) {
                    try { Files.deleteIfExists(dir); } catch (Exception e) { logger.warn("Failed to delete dir: {}", dir, e); }
                    return FileVisitResult.CONTINUE;
                }
            });
        } catch (Exception e) {
            logger.warn("Failed to delete directory: {}", directory, e);
        }
    }
}
