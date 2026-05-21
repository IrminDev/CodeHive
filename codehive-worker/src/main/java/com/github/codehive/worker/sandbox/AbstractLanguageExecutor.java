package com.github.codehive.worker.sandbox;

import static com.github.codehive.worker.sandbox.SandboxConstants.*;

import com.github.codehive.worker.model.dto.ExecutionResult;
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
import com.github.dockerjava.api.model.TmpfsOptions;
import com.github.dockerjava.api.model.Ulimit;
import com.github.dockerjava.api.model.Volume;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

public abstract class AbstractLanguageExecutor implements LanguageExecutor {

    protected final Logger logger = LoggerFactory.getLogger(getClass());
    protected final DockerClient dockerClient;

    protected abstract String dockerImage();

    /** PID limit for containers (64 for JVM languages, 32 for native). */
    protected abstract long pidsLimit();

    protected String[] compileCommand() {
        return null;
    }

    protected AbstractLanguageExecutor(DockerClient dockerClient) {
        this.dockerClient = dockerClient;
        ensureImageExists();
    }

    /**
     * Pull the Docker image if it is not already available locally.
     */
    protected void ensureImageExists() {
        String image = dockerImage();
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

    /**
     * Build a hardened HostConfig for execution containers.
     */
    protected HostConfig buildRunHostConfig(Path tempDir, long memoryLimitMb) {
        return HostConfig.newHostConfig()
                .withBinds(new Bind(tempDir.toString(), new Volume("/workspace")))
                .withMemory(memoryLimitMb * 1024 * 1024)
                .withMemorySwap(memoryLimitMb * 1024 * 1024)
                .withCpuQuota(CPU_QUOTA)
                .withNetworkMode("none")
                .withPidsLimit(pidsLimit())
                .withCapDrop(Capability.ALL)
                .withReadonlyRootfs(true)
                .withMounts(List.of(
                        new Mount().withType(MountType.TMPFS).withTarget("/tmp")
                                .withTmpfsOptions(new TmpfsOptions().withSizeBytes(RUN_TMPFS_BYTES).withMode(01777)),
                        new Mount().withType(MountType.TMPFS).withTarget("/run")
                                .withTmpfsOptions(
                                        new TmpfsOptions().withSizeBytes(RUN_TMPFS_RUN_BYTES).withMode(0755))))
                .withUlimits(new Ulimit[] { new Ulimit("fsize", RUN_ULIMIT_FSIZE, RUN_ULIMIT_FSIZE) })
                .withSecurityOpts(buildSecurityOpts());
    }

    /**
     * Build a hardened HostConfig for compilation containers.
     */
    protected HostConfig buildCompileHostConfig(Path workDir) {
        return HostConfig.newHostConfig()
                .withBinds(new Bind(workDir.toString(), new Volume("/workspace")))
                .withMemory(COMPILE_MEMORY_BYTES)
                .withMemorySwap(COMPILE_MEMORY_BYTES)
                .withCpuQuota(CPU_QUOTA)
                .withNetworkMode("none")
                .withPidsLimit(pidsLimit())
                .withCapDrop(Capability.ALL)
                .withReadonlyRootfs(true)
                .withMounts(List.of(
                        new Mount().withType(MountType.TMPFS).withTarget("/tmp")
                                .withTmpfsOptions(
                                        new TmpfsOptions().withSizeBytes(COMPILE_TMPFS_BYTES).withMode(01777)),
                        new Mount().withType(MountType.TMPFS).withTarget("/run")
                                .withTmpfsOptions(
                                        new TmpfsOptions().withSizeBytes(RUN_TMPFS_RUN_BYTES).withMode(0755))))
                .withUlimits(new Ulimit[] { new Ulimit("fsize", COMPILE_ULIMIT_FSIZE, COMPILE_ULIMIT_FSIZE) })
                .withSecurityOpts(buildSecurityOpts());
    }

    /**
     * Run the compilation step inside a short-lived container.
     * Uses {@link #dockerImage()} and {@link #compileCommand()} to determine
     * the image and command. Returns {@code null} on success, or an
     * {@code ExecutionResult} with the compilation error on failure.
     * If {@link #compileCommand()} returns {@code null}, compilation is skipped.
     */
    protected ExecutionResult compile(Path workDir) {
        String[] cmd = compileCommand();
        if (cmd == null) {
            return null;
        }
        String containerId = null;
        try {
            CreateContainerResponse container = dockerClient.createContainerCmd(dockerImage())
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
    protected String getContainerLogsCompile(String containerId) {
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

    /**
     * Destroy the execution container and delete the host temp directory.
     */
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

    /**
     * Remove the host-side input file and clear /tmp inside the container
     * between consecutive test-case runs.
     */
    protected void cleanupBetweenRuns(ContainerSession session) {
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

    /**
     * Build the security options list.
     */
    protected List<String> buildSecurityOpts() {
        List<String> opts = new ArrayList<>();
        opts.add("no-new-privileges:true");
        if (SECCOMP_PROFILE != null) {
            opts.add("seccomp=" + SECCOMP_PROFILE);
        }
        return opts;
    }

    /**
     * Recursively delete a directory, verifying each path stays within the
     * base directory to prevent symlink-based path traversal.
     */
    protected void deleteDirectory(Path directory) {
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
