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

        LanguageExecutor executor;
        try {
            executor = executorFactory.getExecutor(job.getReferenceLanguage());
        } catch (Exception e) {
            logger.error("[WORKFLOW] Unsupported reference language: {}", job.getReferenceLanguage(), e);
            return new TestGenerationResult(job.getAssignmentId(), false, 0,
                    "Unsupported language: " + job.getReferenceLanguage());
        }

        // Verify the reference solution compiles before running all test cases
        try {
            InputStream refSource = objectStorageService.download(job.getReferenceSolutionPath());
            ExecutionResult compileCheck = executor.execute(refSource, null,
                    job.getTimeLimitMs(), job.getMemoryLimitMb());
            if (compileCheck.getStatus() == ExecutionStatus.CE) {
                logger.error("[WORKFLOW] Reference solution compilation failed - assignmentId={}",
                        job.getAssignmentId());
                return new TestGenerationResult(job.getAssignmentId(), false, 0,
                        "Reference solution compilation error: " + compileCheck.getCompilationError());
            }
        } catch (Exception e) {
            logger.error("[WORKFLOW] Failed to compile-check reference solution - assignmentId={}",
                    job.getAssignmentId(), e);
            return new TestGenerationResult(job.getAssignmentId(), false, 0,
                    "Failed to verify reference solution: " + e.getMessage());
        }

        int generated = 0;
        for (TestCaseInfo tc : job.getTestCases()) {
            try {
                InputStream refSource = objectStorageService.download(job.getReferenceSolutionPath());
                InputStream inputStream = objectStorageService.download(tc.getInputPath());

                ExecutionResult result = executor.execute(refSource, inputStream,
                        job.getTimeLimitMs(), job.getMemoryLimitMb());

                if (result.getStatus() != ExecutionStatus.AC) {
                    logger.error("[WORKFLOW] Reference solution failed on testCaseId={}, status={}",
                            tc.getTestCaseId(), result.getStatus());
                    return new TestGenerationResult(job.getAssignmentId(), false, generated,
                            "Reference solution failed on testCaseId=" + tc.getTestCaseId()
                                    + " with status=" + result.getStatus());
                }

                String output = result.getOutput() != null ? result.getOutput() : "";
                objectStorageService.upload(tc.getOutputPath(), output);
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
    }
}
