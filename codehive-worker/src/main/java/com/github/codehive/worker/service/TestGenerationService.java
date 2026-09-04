package com.github.codehive.worker.service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

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
    private final OutputComparatorService outputComparatorService;

    public TestGenerationService(LanguageExecutorFactory executorFactory,
                                  ObjectStorageService objectStorageService,
                                  OutputComparatorService outputComparatorService) {
        this.executorFactory = executorFactory;
        this.objectStorageService = objectStorageService;
        this.outputComparatorService = outputComparatorService;
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
                return result(job, false, 0,
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
                        return result(job, false, generated,
                                "Reference failed on testCaseId=" + tc.getTestCaseId()
                                        + " status=" + result.getStatus()
                                        + diagnosticSuffix(result));
                    }

                    if (tc.getBaselineOutputPath() != null) {
                        String baseline = new String(
                                objectStorageService.download(tc.getBaselineOutputPath()).readAllBytes(),
                                StandardCharsets.UTF_8);
                        OutputComparatorService.ComparisonResult comparison =
                                outputComparatorService.compareWithFeedback(
                                        baseline,
                                        result.getOutput() != null ? result.getOutput() : "",
                                        job.getComparatorType());
                        if (!comparison.matches()) {
                            return result(job, false, generated,
                                    "Reference output changed for testCaseId=" + tc.getTestCaseId());
                        }
                    }

                    objectStorageService.upload(tc.getOutputPath(), result.getOutput() != null ? result.getOutput() : "");
                    generated++;

                    logger.info("[WORKFLOW] Output generated for testCaseId={}, outputPath={}",
                            tc.getTestCaseId(), tc.getOutputPath());

                } catch (Exception e) {
                    logger.error("[WORKFLOW] Error generating output for testCaseId={}", tc.getTestCaseId(), e);
                    return result(job, false, generated,
                            "Error on testCaseId=" + tc.getTestCaseId() + ": " + e.getMessage());
                }
            }

            logger.info("[WORKFLOW] Test output generation complete - assignmentId={}, generated={}",
                    job.getAssignmentId(), generated);
            return result(job, true, generated, null);

        } catch (Exception e) {
            logger.error("[WORKFLOW] Failed to prepare reference session - assignmentId={}",
                    job.getAssignmentId(), e);
            return result(job, false, 0,
                    "Failed to prepare reference session: " + e.getMessage());
        } finally {
            if (session != null) executor.cleanup(session);
        }
    }

    private TestGenerationResult result(TestGenerationJob job, boolean success, int generated,
                                        String errorMessage) {
        TestGenerationResult result = new TestGenerationResult(
                job.getAssignmentId(), success, generated, errorMessage);
        result.setAssignmentUpdateId(job.getAssignmentUpdateId());
        result.setTestSuiteRevisionId(job.getTestSuiteRevisionId());
        result.setReferenceSolutionRevisionId(job.getReferenceSolutionRevisionId());
        return result;
    }

    private String diagnosticSuffix(ExecutionResult result) {
        String diagnostic = result.getCompilationError() != null
                ? result.getCompilationError()
                : result.getErrorOutput();
        if (diagnostic == null || diagnostic.isBlank()) return "";
        String sanitized = diagnostic
                .replace("\u0000", "")
                .replaceAll("\\u001B\\[[;?0-9]*[ -/]*[@-~]", "")
                .strip();
        int limit = 8 * 1024;
        if (sanitized.length() > limit) {
            sanitized = sanitized.substring(0, limit - 32) + "\n[Diagnostic truncated]";
        }
        return "\n" + sanitized;
    }
}
