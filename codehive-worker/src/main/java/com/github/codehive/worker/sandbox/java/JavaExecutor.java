package com.github.codehive.worker.sandbox.java;

import com.github.codehive.worker.model.dto.ExecutionResult;
import com.github.codehive.worker.sandbox.LanguageExecutor;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback.Adapter;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.WaitContainerResultCallback;
import com.github.dockerjava.api.model.Bind;
import com.github.dockerjava.api.model.Frame;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.api.model.Volume;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.concurrent.*;

@Component("JAVA")
public class JavaExecutor implements LanguageExecutor {
    private static final Logger logger = LoggerFactory.getLogger(JavaExecutor.class);
    private final DockerClient dockerClient;
    private static final String JAVA_IMAGE = "eclipse-temurin:21-jdk-ubi10-minimal";
    private static final long DEFAULT_TIME_LIMIT_MS = 5000L;
    private static final long DEFAULT_MEMORY_LIMIT_MB = 256L;

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
    public ExecutionResult execute(InputStream sourceCode, InputStream testInput, Long timeLimitMs, Long memoryLimitMb) throws Exception {
        timeLimitMs = timeLimitMs != null ? timeLimitMs : DEFAULT_TIME_LIMIT_MS;
        memoryLimitMb = memoryLimitMb != null ? memoryLimitMb : DEFAULT_MEMORY_LIMIT_MB;

        Path tempDir = Files.createTempDirectory("java-exec-");
        Path sourceFile = tempDir.resolve("Main.java");
        Path inputFile = tempDir.resolve("input.txt");

        try {
            // Save source code
            Files.copy(sourceCode, sourceFile, StandardCopyOption.REPLACE_EXISTING);

            // Save test input if provided
            if (testInput != null) {
                Files.copy(testInput, inputFile, StandardCopyOption.REPLACE_EXISTING);
            }

            // Compile
            ExecutionResult compileResult = compile(tempDir);
            if (compileResult != null) {
                return compileResult; // Compilation error
            }

            // Execute
            return executeCode(tempDir, inputFile, timeLimitMs, memoryLimitMb);

        } finally {
            // Cleanup temp directory
            deleteDirectory(tempDir);
        }
    }

    private ExecutionResult compile(Path workDir) {
        String containerId = null;
        try {
            // Create container for compilation
            HostConfig hostConfig = HostConfig.newHostConfig()
                    .withBinds(new Bind(workDir.toString(), new Volume("/workspace")))
                    .withMemory(512 * 1024 * 1024L) // 512MB for compilation
                    .withNetworkMode("none");

            CreateContainerResponse container = dockerClient.createContainerCmd(JAVA_IMAGE)
                    .withHostConfig(hostConfig)
                    .withWorkingDir("/workspace")
                    .withCmd("javac", "Main.java")
                    .exec();

            containerId = container.getId();
            dockerClient.startContainerCmd(containerId).exec();

            // Wait for compilation
            int exitCode = dockerClient.waitContainerCmd(containerId)
                    .exec(new WaitContainerResultCallback())
                    .awaitStatusCode(30, TimeUnit.SECONDS);

            if (exitCode != 0) {
                String stderr = getContainerLogs(containerId, true);
                return ExecutionResult.compilationError(stderr);
            }

            return null; // Success
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

    private ExecutionResult executeCode(Path workDir, Path inputFile, long timeLimitMs, long memoryLimitMb) {
        String containerId = null;
        long startTime = System.currentTimeMillis();

        try {
            HostConfig hostConfig = HostConfig.newHostConfig()
                    .withBinds(new Bind(workDir.toString(), new Volume("/workspace")))
                    .withMemory(memoryLimitMb * 1024 * 1024L)
                    .withMemorySwap(memoryLimitMb * 1024 * 1024L) // Disable swap
                    .withCpuQuota(100000L) // 1 CPU
                    .withNetworkMode("none");

            String[] cmd;
            if (Files.exists(inputFile) && Files.size(inputFile) > 0) {
                cmd = new String[]{"sh", "-c", "java Main < input.txt"};
            } else {
                cmd = new String[]{"java", "Main"};
            }

            CreateContainerResponse container = dockerClient.createContainerCmd(JAVA_IMAGE)
                    .withHostConfig(hostConfig)
                    .withWorkingDir("/workspace")
                    .withCmd(cmd)
                    .exec();

            containerId = container.getId();
            final String finalContainerId = containerId;
            dockerClient.startContainerCmd(containerId).exec();

            // Wait with timeout
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

            // Check for memory limit (best effort - Docker kills container if exceeded)
            if (exitCode == 137) { // SIGKILL - often means OOM
                return ExecutionResult.memoryLimitExceeded(memoryLimitMb * 1024L);
            }

            String stdout = getContainerLogs(containerId, false);
            String stderr = getContainerLogs(containerId, true);

            if (exitCode != 0) {
                return ExecutionResult.runtimeError(stderr, exitCode, executionTime);
            }
            
            return ExecutionResult.success(stdout, executionTime, 0L);

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

    private String getContainerLogs(String containerId, boolean stderr) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            dockerClient.logContainerCmd(containerId)
                    .withStdOut(!stderr)
                    .withStdErr(stderr)
                    .exec(new Adapter<Frame>() {
                        @Override
                        public void onNext(Frame frame) {
                            try {
                                outputStream.write(frame.getPayload());
                            } catch (Exception e) {
                                logger.error("Error reading frame", e);
                            }
                        }
                    })
                    .awaitCompletion(5, TimeUnit.SECONDS);

            return outputStream.toString(StandardCharsets.UTF_8);
        } catch (Exception e) {
            logger.error("Failed to get container logs", e);
            return "";
        }
    }

    private void deleteDirectory(Path directory) {
        try {
            Files.walk(directory)
                    .sorted((a, b) -> -a.compareTo(b))
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (Exception e) {
                            logger.warn("Failed to delete: " + path, e);
                        }
                    });
        } catch (Exception e) {
            logger.warn("Failed to delete directory: " + directory, e);
        }
    }
}
