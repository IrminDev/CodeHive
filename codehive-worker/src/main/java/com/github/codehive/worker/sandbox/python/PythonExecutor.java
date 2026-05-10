package com.github.codehive.worker.sandbox.python;

import com.github.codehive.worker.model.dto.ExecutionResult;
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
import com.github.dockerjava.api.model.Statistics;
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
import java.util.concurrent.*;

@Component("PYTHON")
public class PythonExecutor implements LanguageExecutor {
    private static final Logger logger = LoggerFactory.getLogger(PythonExecutor.class);
    private final DockerClient dockerClient;
    private static final String PYTHON_IMAGE = "python:3.11-slim";
    private static final long DEFAULT_TIME_LIMIT_MS = 5000L;
    private static final long DEFAULT_MEMORY_LIMIT_MB = 256L;
    private static final int OUTPUT_LIMIT_BYTES = 4 * 1024 * 1024;
    private static final long PIDS_LIMIT = 64L;

    private static final String SECCOMP_PROFILE;
    static {
        String profile = null;
        try (InputStream is = PythonExecutor.class.getResourceAsStream("/seccomp/sandbox-profile.json")) {
            if (is != null) profile = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            // Runs without seccomp if profile fails to load
        }
        SECCOMP_PROFILE = profile;
    }

    public PythonExecutor(DockerClient dockerClient) {
        this.dockerClient = dockerClient;
        ensureImageExists();
    }

    private void ensureImageExists() {
        try {
            dockerClient.inspectImageCmd(PYTHON_IMAGE).exec();
            logger.info("Docker image {} is available", PYTHON_IMAGE);
        } catch (Exception e) {
            logger.info("Pulling Docker image {}...", PYTHON_IMAGE);
            try {
                dockerClient.pullImageCmd(PYTHON_IMAGE).start().awaitCompletion();
                logger.info("Successfully pulled image {}", PYTHON_IMAGE);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                logger.error("Image pull interrupted", ex);
            }
        }
    }

    @Override
    public ExecutionResult execute(InputStream sourceCode, InputStream testInput, Long timeLimitMs, Long memoryLimitMb) throws Exception {
        timeLimitMs = timeLimitMs != null ? timeLimitMs : DEFAULT_TIME_LIMIT_MS;
        memoryLimitMb = memoryLimitMb != null ? memoryLimitMb : DEFAULT_MEMORY_LIMIT_MB;

        Path tempDir = Files.createTempDirectory("python-exec-");
        Path sourceFile = tempDir.resolve("main.py");
        Path inputFile = tempDir.resolve("input.txt");

        try {
            Files.setPosixFilePermissions(tempDir, PosixFilePermissions.fromString("rwxrwxrwx"));

            byte[] sourceBytes = sourceCode.readNBytes(512 * 1024);
            Files.write(sourceFile, sourceBytes);
            Files.setPosixFilePermissions(sourceFile, PosixFilePermissions.fromString("r--r--r--"));

            if (testInput != null) {
                byte[] inputBytes = testInput.readNBytes(64 * 1024 * 1024);
                Files.write(inputFile, inputBytes);
                Files.setPosixFilePermissions(inputFile, PosixFilePermissions.fromString("r--r--r--"));
            }

            return executeCode(tempDir, inputFile, timeLimitMs, memoryLimitMb);

        } finally {
            deleteDirectory(tempDir);
        }
    }

    private ExecutionResult executeCode(Path workDir, Path inputFile, long timeLimitMs, long memoryLimitMb) {
        String containerId = null;
        long startTime = System.currentTimeMillis();

        try {
            HostConfig hostConfig = HostConfig.newHostConfig()
                    .withBinds(new Bind(workDir.toString(), new Volume("/workspace")))
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

            String[] cmd;
            if (Files.exists(inputFile) && Files.size(inputFile) > 0) {
                cmd = new String[]{"sh", "-c", "python main.py < input.txt"};
            } else {
                cmd = new String[]{"python", "main.py"};
            }

            CreateContainerResponse container = dockerClient.createContainerCmd(PYTHON_IMAGE)
                    .withHostConfig(hostConfig)
                    .withWorkingDir("/workspace")
                    .withUser("nobody")
                    .withEnv("PYTHONDONTWRITEBYTECODE=1")
                    .withCmd(cmd)
                    .exec();

            containerId = container.getId();
            final String finalContainerId = containerId;
            dockerClient.startContainerCmd(containerId).exec();

            ExecutorService executor = Executors.newSingleThreadExecutor();
            Future<Integer> future = executor.submit(() ->
                dockerClient.waitContainerCmd(finalContainerId)
                    .exec(new WaitContainerResultCallback())
                    .awaitStatusCode()
            );

            Integer exitCode;
            try {
                exitCode = future.get(timeLimitMs + 1000, TimeUnit.MILLISECONDS);
            } catch (TimeoutException e) {
                future.cancel(true);
                executor.shutdownNow();
                return ExecutionResult.timeLimitExceeded(timeLimitMs);
            } finally {
                executor.shutdown();
            }

            long executionTime = System.currentTimeMillis() - startTime;

            if (exitCode == 137) {
                return ExecutionResult.memoryLimitExceeded(memoryLimitMb * 1024L);
            }

            int[] sharedBytes = {0};
            LogResult stdoutResult = getContainerLogsLimited(containerId, false, sharedBytes);
            LogResult stderrResult = getContainerLogsLimited(containerId, true, sharedBytes);

            if (stdoutResult.truncated() || stderrResult.truncated()) {
                return ExecutionResult.outputLimitExceeded(
                    stdoutResult.content() + "\n[Output truncated: exceeded 4 MB limit]", executionTime);
            }

            if (exitCode != 0 && stderrResult.content().contains("SyntaxError")) {
                return ExecutionResult.compilationError(stderrResult.content());
            }

            if (exitCode != 0) {
                return ExecutionResult.runtimeError(stderrResult.content(), exitCode, executionTime);
            }

            Long memoryUsed = getContainerPeakMemory(containerId);
            return ExecutionResult.success(stdoutResult.content(), executionTime, memoryUsed);

        } catch (Exception e) {
            logger.error("Execution error", e);
            return ExecutionResult.runtimeError(e.getMessage(), -1, System.currentTimeMillis() - startTime);
        } finally {
            if (containerId != null) {
                try {
                    dockerClient.removeContainerCmd(containerId).withForce(true).exec();
                } catch (Exception e) {
                    logger.warn("Failed to remove execution container", e);
                }
            }
        }
    }

    private record LogResult(String content, boolean truncated) {}

    private LogResult getContainerLogsLimited(String containerId, boolean useStderr, int[] sharedBytes) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        boolean[] truncated = {false};
        try {
            dockerClient.logContainerCmd(containerId)
                .withStdOut(!useStderr)
                .withStdErr(useStderr)
                .exec(new ResultCallback.Adapter<Frame>() {
                    @Override
                    public void onNext(Frame frame) {
                        byte[] payload = frame.getPayload();
                        if (payload == null) return;
                        synchronized (sharedBytes) {
                            int remaining = OUTPUT_LIMIT_BYTES - sharedBytes[0];
                            if (remaining <= 0) { truncated[0] = true; return; }
                            int toWrite = Math.min(payload.length, remaining);
                            try { baos.write(payload, 0, toWrite); } catch (Exception ignored) {}
                            sharedBytes[0] += toWrite;
                            if (toWrite < payload.length) truncated[0] = true;
                        }
                    }
                }).awaitCompletion(5, TimeUnit.SECONDS);
        } catch (Exception e) {
            logger.error("Failed to get container logs", e);
        }
        return new LogResult(baos.toString(StandardCharsets.UTF_8), truncated[0]);
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

    private Long getContainerPeakMemory(String containerId) {
        try {
            final CountDownLatch latch = new CountDownLatch(1);
            final Statistics[] statsHolder = new Statistics[1];

            dockerClient.statsCmd(containerId)
                .withNoStream(true)
                .exec(new ResultCallback.Adapter<Statistics>() {
                    @Override
                    public void onNext(Statistics stats) {
                        statsHolder[0] = stats;
                    }
                    @Override
                    public void onComplete() {
                        latch.countDown();
                        super.onComplete();
                    }
                    @Override
                    public void onError(Throwable throwable) {
                        latch.countDown();
                        super.onError(throwable);
                    }
                });

            latch.await(5, TimeUnit.SECONDS);
            Statistics stats = statsHolder[0];

            if (stats != null && stats.getMemoryStats() != null) {
                Long maxUsage = stats.getMemoryStats().getMaxUsage();
                return maxUsage != null ? maxUsage / (1024 * 1024) : 0L;
            }
        } catch (Exception e) {
            logger.warn("Failed to get memory stats for container {}", containerId, e);
        }
        return 0L;
    }
}
