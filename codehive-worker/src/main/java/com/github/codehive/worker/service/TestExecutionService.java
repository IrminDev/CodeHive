package com.github.codehive.worker.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.codehive.worker.model.dto.ExecutionReport;
import com.github.codehive.worker.model.dto.ExecutionResult;
import com.github.codehive.worker.model.dto.TestCaseResult;
import com.github.codehive.worker.model.dto.queue.ExecutionJob;
import com.github.codehive.worker.model.enums.ExecutionStatus;
import com.github.codehive.worker.model.enums.ExecutionType;
import com.github.codehive.worker.sandbox.ContainerSession;
import com.github.codehive.worker.sandbox.LanguageExecutor;
import com.github.codehive.worker.sandbox.factory.LanguageExecutorFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Service
public class TestExecutionService {
    private static final Logger logger = LoggerFactory.getLogger(TestExecutionService.class);

    private final LanguageExecutorFactory executorFactory;
    private final ObjectStorageService objectStorageService;
    private final OutputComparatorService outputComparatorService;
    private final ObjectMapper objectMapper;

    public TestExecutionService(LanguageExecutorFactory executorFactory,
                               ObjectStorageService objectStorageService,
                               OutputComparatorService outputComparatorService) {
        this.executorFactory = executorFactory;
        this.objectStorageService = objectStorageService;
        this.outputComparatorService = outputComparatorService;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Execute the submission against all test cases using a single container session.
     */
    public ExecutionReport executeJob(ExecutionJob job) {
        ExecutionReport report = new ExecutionReport(job.getId());
        LanguageExecutor executor = executorFactory.getExecutor(job.getLanguage());
        ContainerSession session = null;
        try {
            session = executor.prepare(
                objectStorageService.download(job.getSource()),
                job.getTimeLimitMs(),
                job.getMemoryLimitMb()
            );
            if (session.isCompilationFailed()) {
                report.setCompilationError(session.getCompilationError());
                report.determineOverallStatus();
                return report;
            }
            if (job.getExecutionType() == ExecutionType.DEFINITIVE) {
                executeDefinitiveTests(job, executor, session, report);
            } else {
                executePracticeTests(job, executor, session, report);
            }
            report.determineOverallStatus();
            if (job.getOutputPath() != null) {
                uploadReport(job.getOutputPath(), report);
            }
        } catch (Exception e) {
            logger.error("Failed to execute job: id={}", job.getId(), e);
            report.setCompilationError("Execution failed: " + e.getMessage());
            report.determineOverallStatus();
        } finally {
            if (session != null) executor.cleanup(session);
        }
        return report;
    }

    /**
     * Execute DEFINITIVE tests: run against stored test cases, compare with expected outputs.
     */
    private void executeDefinitiveTests(ExecutionJob job, LanguageExecutor executor,
                                        ContainerSession session, ExecutionReport report) {
        int numTests = Math.min(job.getNumTests() != null ? job.getNumTests() : 0,
                com.github.codehive.worker.sandbox.SandboxConstants.MAX_TEST_CASES);
        if (job.getNumTests() != null && job.getNumTests() > numTests) {
            logger.warn("numTests {} exceeds cap {}; truncating", job.getNumTests(), numTests);
        }
        logger.info("Executing DEFINITIVE tests: {} test cases", numTests);

        for (int i = 1; i <= numTests; i++) {
            try {
                String inputPath = job.getTestsPath() + "tc-" + i + "/tc-" + i + ".in";
                String outputPath = job.getTestsPath() + "tc-" + i + "/tc-" + i + ".out";

                logger.debug("Test case {}: input={}, output={}", i, inputPath, outputPath);

                InputStream testInput = objectStorageService.download(inputPath);
                InputStream expectedOutputStream = objectStorageService.download(outputPath);
                String expectedOutput = new String(expectedOutputStream.readAllBytes(), StandardCharsets.UTF_8);

                ExecutionResult result = executor.runTestCase(session, testInput);

                uploadTestCaseOutputs(job.getOutputPath(), i, result.getOutput(), result.getErrorOutput());

                TestCaseResult testResult = new TestCaseResult(
                    i,
                    result.getStatus(),
                    result.getExecutionTimeMs(),
                    result.getMemoryUsedMb()
                );

                if (result.getStatus() == ExecutionStatus.AC) {
                    OutputComparatorService.ComparisonResult comparison =
                        outputComparatorService.compareWithFeedback(
                            expectedOutput,
                            result.getOutput(),
                            job.getComparatorType()
                        );
                    if (!comparison.matches()) {
                        testResult.setStatus(ExecutionStatus.WA);
                        testResult.setFeedback(comparison.getFeedback());
                    } else {
                        testResult.setFeedback("Passed");
                    }
                } else {
                    testResult.setFeedback(getStatusFeedback(result.getStatus()));
                }

                report.addTestCaseResult(testResult);

            } catch (Exception e) {
                logger.error("Failed to execute test case {}", i, e);
                TestCaseResult errorResult = new TestCaseResult();
                errorResult.setTestCaseNumber(i);
                errorResult.setStatus(ExecutionStatus.RTE);
                errorResult.setFeedback("Test execution failed: " + e.getMessage());
                report.addTestCaseResult(errorResult);
            }
        }
    }

    /**
     * Execute PRACTICE tests: run against inline test cases, compare with reference solution.
     * Both student and reference solution share a single container session each.
     */
    private void executePracticeTests(ExecutionJob job, LanguageExecutor executor,
                                      ContainerSession studentSession, ExecutionReport report) {
        int numTestCases = Math.min(job.getTestCases().size(),
                com.github.codehive.worker.sandbox.SandboxConstants.MAX_TEST_CASES);
        if (job.getTestCases().size() > numTestCases) {
            logger.warn("testCases {} exceeds cap {}; truncating", job.getTestCases().size(), numTestCases);
        }
        logger.info("Executing PRACTICE tests: {} test cases", numTestCases);

        LanguageExecutor referenceExecutor = executorFactory.getExecutor(job.getReferenceLanguage());
        ContainerSession referenceSession = null;
        try {
            try {
                referenceSession = referenceExecutor.prepare(
                    objectStorageService.download(job.getReference()),
                    job.getTimeLimitMs(),
                    job.getMemoryLimitMb()
                );
            } catch (Exception e) {
                logger.error("Failed to prepare reference session", e);
                return;
            }

            if (referenceSession.isCompilationFailed()) {
                logger.error("Reference solution compilation failed: {}", referenceSession.getCompilationError());
                return;
            }

            for (int i = 0; i < numTestCases; i++) {
                try {
                    String testInput = job.getTestCases().get(i);
                    int testNumber = i + 1;

                    // Run reference solution to get expected output
                    ExecutionResult referenceResult = referenceExecutor.runTestCase(
                        referenceSession,
                        new ByteArrayInputStream(testInput.getBytes(StandardCharsets.UTF_8))
                    );

                    if (referenceResult.getStatus() != ExecutionStatus.AC) {
                        logger.error("Reference solution failed on test case {}: {}", testNumber, referenceResult.getStatus());
                        TestCaseResult errorResult = new TestCaseResult();
                        errorResult.setTestCaseNumber(testNumber);
                        errorResult.setStatus(ExecutionStatus.RTE);
                        errorResult.setFeedback("Reference solution failed");
                        report.addTestCaseResult(errorResult);
                        continue;
                    }

                    String expectedOutput = referenceResult.getOutput();

                    // Run student submission
                    ExecutionResult result = executor.runTestCase(
                        studentSession,
                        new ByteArrayInputStream(testInput.getBytes(StandardCharsets.UTF_8))
                    );

                    uploadTestCaseOutputs(job.getOutputPath(), testNumber, result.getOutput(), result.getErrorOutput());

                    TestCaseResult testResult = new TestCaseResult(
                        testNumber,
                        result.getStatus(),
                        result.getExecutionTimeMs(),
                        result.getMemoryUsedMb()
                    );

                    if (result.getStatus() == ExecutionStatus.AC) {
                        OutputComparatorService.ComparisonResult comparison =
                            outputComparatorService.compareWithFeedback(
                                expectedOutput,
                                result.getOutput(),
                                job.getComparatorType()
                            );
                        if (!comparison.matches()) {
                            testResult.setStatus(ExecutionStatus.WA);
                            testResult.setFeedback(comparison.getFeedback());
                            testResult.setExpectedOutput(expectedOutput);
                            testResult.setActualOutput(result.getOutput());
                        } else {
                            testResult.setFeedback("Passed");
                        }
                    } else {
                        testResult.setFeedback(getStatusFeedback(result.getStatus()));
                    }

                    report.addTestCaseResult(testResult);

                } catch (Exception e) {
                    logger.error("Failed to execute test case {}", i + 1, e);
                    TestCaseResult errorResult = new TestCaseResult();
                    errorResult.setTestCaseNumber(i + 1);
                    errorResult.setStatus(ExecutionStatus.RTE);
                    errorResult.setFeedback("Test execution failed: " + e.getMessage());
                    report.addTestCaseResult(errorResult);
                }
            }
        } finally {
            if (referenceSession != null) referenceExecutor.cleanup(referenceSession);
        }
    }

    /**
     * Upload test case stdout and stderr to MinIO.
     */
    private void uploadTestCaseOutputs(String path, int testCaseNumber, String stdout, String stderr) {
        try {
            String stdoutPath = path + "/tc-" + testCaseNumber + "/stdout.txt";
            objectStorageService.upload(stdoutPath, stdout != null ? stdout : "");
            logger.debug("Uploaded stdout for test case {} to: {}", testCaseNumber, stdoutPath);

            if (stderr != null && !stderr.isEmpty()) {
                String stderrPath = path + "/tc-" + testCaseNumber + "/stderr.txt";
                objectStorageService.upload(stderrPath, stderr);
                logger.debug("Uploaded stderr for test case {} to: {}", testCaseNumber, stderrPath);
            }
        } catch (Exception e) {
            logger.error("Failed to upload test case outputs for test {}", testCaseNumber, e);
        }
    }

    private String getStatusFeedback(ExecutionStatus status) {
        switch (status) {
            case TLE: return "Time limit exceeded";
            case MLE: return "Memory limit exceeded";
            case OLE: return "Output limit exceeded";
            case RTE: return "Runtime error";
            case CE:  return "Compilation error";
            case WA:  return "Wrong answer";
            case AC:  return "Accepted";
            default:  return "Unknown status";
        }
    }

    private void uploadReport(String outputPath, ExecutionReport report) {
        try {
            String jsonReport = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(report);
            String outputPathFinal = outputPath + "report.json";
            objectStorageService.upload(outputPathFinal, jsonReport);
            logger.info("Uploaded execution report to: {}", outputPathFinal);
        } catch (Exception e) {
            logger.error("Failed to upload execution report", e);
        }
    }
}
