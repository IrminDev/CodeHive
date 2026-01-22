package com.github.codehive.worker.sandbox;

import java.io.InputStream;

public interface LanguageExecutor {
    /**
     * Execute code with given constraints
     * @param sourceCode The source code input stream from MinIO
     * @param testInput The test input stream from MinIO (can be null)
     * @param timeLimitMs Time limit in milliseconds
     * @param memoryLimitMb Memory limit in megabytes
     * @return ExecutionResult with verdict and execution details
     */
    ExecutionResult execute(InputStream sourceCode, InputStream testInput, Long timeLimitMs, Long memoryLimitMb) throws Exception;
}
