package com.github.codehive.worker.sandbox;

import java.nio.file.Path;

public class ContainerSession {
    private final String containerId;   // null if compilation failed
    private final Path tempDir;         // may be null if CE session has no dir
    private final long timeLimitMs;
    private final long memoryLimitMb;
    private final String compilationError; // non-null if CE

    public ContainerSession(String containerId, Path tempDir, long timeLimitMs, long memoryLimitMb) {
        this.containerId = containerId;
        this.tempDir = tempDir;
        this.timeLimitMs = timeLimitMs;
        this.memoryLimitMb = memoryLimitMb;
        this.compilationError = null;
    }

    public static ContainerSession compilationError(String error) {
        return new ContainerSession(null, null, 0L, 0L, error);
    }

    private ContainerSession(String containerId, Path tempDir, long timeLimitMs, long memoryLimitMb, String compilationError) {
        this.containerId = containerId;
        this.tempDir = tempDir;
        this.timeLimitMs = timeLimitMs;
        this.memoryLimitMb = memoryLimitMb;
        this.compilationError = compilationError;
    }

    public boolean isCompilationFailed() { return compilationError != null; }
    public String getCompilationError() { return compilationError; }
    public String getContainerId() { return containerId; }
    public Path getTempDir() { return tempDir; }
    public long getTimeLimitMs() { return timeLimitMs; }
    public long getMemoryLimitMb() { return memoryLimitMb; }
}
