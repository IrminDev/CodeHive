package com.github.codehive.worker.service;

import java.io.InputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.github.codehive.worker.model.dto.ExecutionResult;
import com.github.codehive.worker.model.dto.queue.TestCaseInfo;
import com.github.codehive.worker.model.dto.queue.TestGenerationJob;
import com.github.codehive.worker.model.dto.queue.TestGenerationResult;
import com.github.codehive.worker.model.enums.ExecutionStatus;
import com.github.codehive.worker.sandbox.ContainerSession;
import com.github.codehive.worker.sandbox.LanguageExecutor;
import com.github.codehive.worker.sandbox.factory.LanguageExecutorFactory;

@Service
public class TestGenerationService {
    private static final Logger logger = LoggerFactory.getLogger(TestGenerationService.class);

    private final LanguageExecutorFactory executorFactory;
    private final ObjectStorageService objectStorageService;

    public TestGenerationService(LanguageExecutorFactory executorFactory,
                                  ObjectStorageService objectStorageService) {
        this.executorFactory = executorFactory;
        this.objectStorageService = objectStorageService;
    }

    public TestGenerationResult generateOutputs(TestGenerationJob job) {
        logger.info("[WORKFLOW] Starting test output generation - assignmentId={}, testCases={}",
                job.getAssignmentId(), job.getTestCases().size());

        LanguageExecutor executor = executorFactory.getExecutor(job.getReferenceLanguage());
        ContainerSession session = null;
        try {
            session = executor.prepare(
                objectStorageService.download(job.getReferenceSolutionPath()),
                job.getTimeLimitMs(),
                job.getMemoryLimitMb()
            );
            if (session.isCompilationFailed()) {
                logger.error("[WORKFLOW] Reference solution compilation failed - assignmentId={}",
                        job.getAssignmentId());
                return new TestGenerationResult(job.getAssignmentId(), false, 0,
                        "Reference solution compilation error: " + session.getCompilationError());
            }

            int generated = 0;
            for (TestCaseInfo tc : job.getTestCases()) {
                try {
                    InputStream inputStream = objectStorageService.download(tc.getInputPath());
                    ExecutionResult result = executor.runTestCase(session, inputStream);

                    if (result.getStatus() != ExecutionStatus.AC) {
                        logger.error("[WORKFLOW] Reference solution failed on testCaseId={}, status={}",
                                tc.getTestCaseId(), result.getStatus());
                        return new TestGenerationResult(job.getAssignmentId(), false, generated,
                                "Reference failed on testCaseId=" + tc.getTestCaseId()
                                        + " status=" + result.getStatus());
                    }

                    objectStorageService.upload(tc.getOutputPath(), result.getOutput() != null ? result.getOutput() : "");
                    generated++;

                    logger.info("[WORKFLOW] Output generated for testCaseId={}, outputPath={}",
                            tc.getTestCaseId(), tc.getOutputPath());

                } catch (Exception e) {
                    logger.error("[WORKFLOW] Error generating output for testCaseId={}", tc.getTestCaseId(), e);
                    return new TestGenerationResult(job.getAssignmentId(), false, generated,
                            "Error on testCaseId=" + tc.getTestCaseId() + ": " + e.getMessage());
                }
            }

            logger.info("[WORKFLOW] Test output generation complete - assignmentId={}, generated={}",
                    job.getAssignmentId(), generated);
            return new TestGenerationResult(job.getAssignmentId(), true, generated, null);

        } catch (Exception e) {
            logger.error("[WORKFLOW] Failed to prepare reference session - assignmentId={}",
                    job.getAssignmentId(), e);
            return new TestGenerationResult(job.getAssignmentId(), false, 0,
                    "Failed to prepare reference session: " + e.getMessage());
        } finally {
            if (session != null) executor.cleanup(session);
        }
    }
}
