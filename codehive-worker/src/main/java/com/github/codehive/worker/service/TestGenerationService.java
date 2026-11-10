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
import com.github.codehive.worker.sandbox.SandboxConstants;
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
                        "Reference solution could not compile (CE). Check the compiler diagnostics below."
                                + diagnosticSuffix(session.getCompilationError()));
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
                                referenceFailure(result, session, generated + 1, job.getTestCases().size()));
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
                                    "Reference output changed on test case " + (generated + 1)
                                            + " of " + job.getTestCases().size()
                                            + ". The candidate reference solution produced output that does not match "
                                            + "the existing expected output under the assignment comparator. "
                                            + "Check the reference changes or update the test suite if this change is intentional.");
                        }
                    }

                    objectStorageService.upload(tc.getOutputPath(), result.getOutput() != null ? result.getOutput() : "");
                    generated++;

                    logger.info("[WORKFLOW] Output generated for testCaseId={}, outputPath={}",
                            tc.getTestCaseId(), tc.getOutputPath());

                } catch (Exception e) {
                    logger.error("[WORKFLOW] Error generating output for testCaseId={}", tc.getTestCaseId(), e);
                    return result(job, false, generated,
                            "Could not process test case " + (generated + 1) + " of " + job.getTestCases().size()
                                    + ". Output generation did not complete." + diagnosticSuffix(e.getMessage()));
                }
            }

            logger.info("[WORKFLOW] Test output generation complete - assignmentId={}, generated={}",
                    job.getAssignmentId(), generated);
            return result(job, true, generated, null);

        } catch (Exception e) {
            logger.error("[WORKFLOW] Failed to prepare reference session - assignmentId={}",
                    job.getAssignmentId(), e);
            return result(job, false, 0,
                    "Could not prepare the reference solution for validation." + diagnosticSuffix(e.getMessage()));
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

    private String referenceFailure(ExecutionResult result, ContainerSession session, int position, int total) {
        String reason = switch (result.getStatus()) {
            case RTE -> "Runtime error (RTE). Check input parsing, array bounds, and unhandled exceptions.";
            case TLE -> "Time limit exceeded (TLE). The per-test limit is " + session.getTimeLimitMs()
                    + " ms. Check for infinite loops or an algorithm that is too slow for this input.";
            case MLE -> "Memory limit exceeded (MLE). The sandbox limit is " + session.getMemoryLimitMb()
                    + " MiB. Check large allocations and unbounded memory growth.";
            case OLE -> "Output limit exceeded (OLE). Combined standard output and standard error exceeded "
                    + (SandboxConstants.OUTPUT_LIMIT_BYTES / (1024 * 1024))
                    + " MiB. Check excessive printing or a loop that repeatedly writes output.";
            case CE -> "Compilation error (CE). Check the compiler diagnostics below.";
            default -> "Reference execution did not succeed (" + result.getStatus() + ").";
        };
        StringBuilder message = new StringBuilder("Reference solution failed on test case ")
                .append(position).append(" of ").append(total).append(": ").append(reason);
        if (result.getExitCode() != null && result.getExitCode() >= 0) {
            message.append("\nProcess exit code: ").append(result.getExitCode()).append('.');
        }
        if (result.getExecutionTimeMs() != null) {
            message.append("\nExecution time: ").append(result.getExecutionTimeMs()).append(" ms.");
        }
        if (result.getMemoryUsedMb() != null) {
            message.append("\nObserved memory: ").append(result.getMemoryUsedMb()).append(" MiB.");
        }
        String diagnostic = result.getCompilationError();
        if (diagnostic == null || diagnostic.isBlank()) diagnostic = result.getErrorOutput();
        return message + diagnosticSuffix(diagnostic);
    }

    private String diagnosticSuffix(String diagnostic) {
        String sanitized = diagnostic == null ? "" : diagnostic
                .replaceAll("\\u001B\\[[;?0-9]*[ -/]*[@-~]", "")
                .replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "")
                .strip();
        if (sanitized.isBlank()) return "\nNo compiler or runtime diagnostic output was captured.";
        int limit = 8 * 1024;
        if (sanitized.length() > limit) {
            String marker = "\n[Diagnostic truncated]";
            sanitized = sanitized.substring(0, limit - marker.length()) + marker;
        }
        return "\nDiagnostics:\n" + sanitized;
    }
}
