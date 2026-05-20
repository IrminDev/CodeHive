package com.github.codehive.worker.sandbox;

import static com.github.codehive.worker.sandbox.SandboxConstants.*;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Frame;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
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
