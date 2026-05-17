package com.github.codehive.worker.sandbox;

import com.github.codehive.worker.model.dto.ExecutionResult;
import java.io.InputStream;

public interface LanguageExecutor {
    /**
     * Prepare a long-running container session for executing a submission.
     * For compiled languages, this also performs compilation.
     *
     * @param sourceCode   The source code input stream from MinIO
     * @param timeLimitMs  Time limit in milliseconds per test case
     * @param memoryLimitMb Memory limit in megabytes
     * @return ContainerSession — either a live session or a CE session (check isCompilationFailed())
     */
    ContainerSession prepare(InputStream sourceCode, Long timeLimitMs, Long memoryLimitMb) throws Exception;

    /**
     * Run a single test case inside the already-prepared container.
     * Cleans up between runs automatically.
     *
     * @param session   The session returned by prepare()
     * @param testInput The test input stream (may be null for no-input runs)
     * @return ExecutionResult for this test case
     */
    ExecutionResult runTestCase(ContainerSession session, InputStream testInput) throws Exception;

    /**
     * Destroy the container and delete the temp directory.
     * Safe to call even if session.getContainerId() is null.
     *
     * @param session The session to clean up
     */
    void cleanup(ContainerSession session);
}
