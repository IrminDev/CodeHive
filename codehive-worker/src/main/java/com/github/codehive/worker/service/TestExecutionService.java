package com.github.codehive.worker.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.codehive.worker.model.dto.ExecutionReport;
import com.github.codehive.worker.model.dto.TestCaseResult;
import com.github.codehive.worker.model.dto.queue.ExecutionJob;
import com.github.codehive.worker.model.enums.ExecutionStatus;
import com.github.codehive.worker.model.enums.ExecutionType;
import com.github.codehive.worker.sandbox.ExecutionResult;
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
     * Execute the submission against all test cases
     */
    public ExecutionReport executeJob(ExecutionJob job) {
        ExecutionReport report = new ExecutionReport(job.getId());
        
        try {
            // Get executor
            LanguageExecutor executor = executorFactory.getExecutor(job.getLanguage());
            
            // First, test compilation with a simple run (no input)
            ExecutionResult compileTest = executor.execute(
                objectStorageService.download(job.getSource()),
                null,
                job.getTimeLimitMs(),
                job.getMemoryLimitMb()
            );
            
            if (compileTest.getStatus() == ExecutionStatus.CE) {
                report.setCompilationError(compileTest.getCompilationError());
                report.determineOverallStatus();
                return report;
            }
            
            // Execute based on execution type
            if (job.getExecutionType() == ExecutionType.DEFINITIVE) {
                executeDefinitiveTests(job, executor, report);
            } else {
                executePracticeTests(job, executor, report);
            }
            
            report.determineOverallStatus();
            
            // Upload report to MinIO
            if (job.getOutputPath() != null) {
                uploadReport(job.getOutputPath(), report);
            }
            
        } catch (Exception e) {
            logger.error("Failed to execute job: id={}", job.getId(), e);
            report.setCompilationError("Execution failed: " + e.getMessage());
            report.determineOverallStatus();
        }
        
        return report;
    }

    /**
     * Execute DEFINITIVE tests: run against stored test cases, compare with expected outputs
     */
    private void executeDefinitiveTests(ExecutionJob job, LanguageExecutor executor, ExecutionReport report) {
        logger.info("Executing DEFINITIVE tests: {} test cases", job.getNumTests());
        
        for (int i = 1; i <= job.getNumTests(); i++) {
            try {
                // Construct paths for test input and expected output
                String inputPath = job.getTestsPath() + "tc-" + i + "/tc-" + i + ".in";
                String outputPath = job.getTestsPath() + "tc-" + i + "/tc-" + i + ".out";
                
                logger.debug("Test case {}: input={}, output={}", i, inputPath, outputPath);
                
                // Download test input and expected output
                InputStream testInput = objectStorageService.download(inputPath);
                InputStream expectedOutputStream = objectStorageService.download(outputPath);
                String expectedOutput = new String(expectedOutputStream.readAllBytes(), StandardCharsets.UTF_8);
                
                // Execute with test input
                ExecutionResult result = executor.execute(
                    objectStorageService.download(job.getSource()),
                    testInput,
                    job.getTimeLimitMs(),
                    job.getMemoryLimitMb()
                );
                
                // Upload stdout and stderr to MinIO
                uploadTestCaseOutputs(job.getOutputPath(), i, result.getOutput(), result.getErrorOutput());
                
                // Create test case result (without output/errorOutput/expectedOutput)
                TestCaseResult testResult = new TestCaseResult(
                    i,
                    result.getStatus(),
                    result.getExecutionTimeMs(),
                    result.getMemoryUsedKb()
                );
                
                // Compare outputs if execution was successful
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
     * Execute PRACTICE tests: run against inline test cases, compare with reference solution
     */
    private void executePracticeTests(ExecutionJob job, LanguageExecutor executor, ExecutionReport report) {
        logger.info("Executing PRACTICE tests: {} test cases", job.getTestCases().size());
        
        // Get reference executor
        LanguageExecutor referenceExecutor = executorFactory.getExecutor(job.getReferenceLanguage());
        
        for (int i = 0; i < job.getTestCases().size(); i++) {
            try {
                String testInput = job.getTestCases().get(i);
                int testNumber = i + 1;
                
                // Execute reference solution to get expected output
                ExecutionResult referenceResult = referenceExecutor.execute(
                    objectStorageService.download(job.getReference()),
                    new ByteArrayInputStream(testInput.getBytes(StandardCharsets.UTF_8)),
                    job.getTimeLimitMs(),
                    job.getMemoryLimitMb()
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
                
                // Execute student submission
                ExecutionResult result = executor.execute(
                    objectStorageService.download(job.getSource()),
                    new ByteArrayInputStream(testInput.getBytes(StandardCharsets.UTF_8)),
                    job.getTimeLimitMs(),
                    job.getMemoryLimitMb()
                );
                
                // Upload stdout and stderr to MinIO
                uploadTestCaseOutputs(job.getOutputPath(), testNumber, result.getOutput(), result.getErrorOutput());
                
                // Create test case result (without output/errorOutput/expectedOutput)
                TestCaseResult testResult = new TestCaseResult(
                    testNumber,
                    result.getStatus(),
                    result.getExecutionTimeMs(),
                    result.getMemoryUsedKb()
                );
                
                // Compare outputs if execution was successful
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
                logger.error("Failed to execute test case {}", i + 1, e);
                TestCaseResult errorResult = new TestCaseResult();
                errorResult.setTestCaseNumber(i + 1);
                errorResult.setStatus(ExecutionStatus.RTE);
                errorResult.setFeedback("Test execution failed: " + e.getMessage());
                report.addTestCaseResult(errorResult);
            }
        }
    }

    /**
     * Upload test case stdout and stderr to MinIO
     */
    private void uploadTestCaseOutputs(String path, int testCaseNumber, String stdout, String stderr) {
        try {
            // Upload stdout
            String stdoutPath = new StringBuilder()
                .append(path)
                .append("/tc-")
                .append(testCaseNumber)
                .append("/stdout.txt")
                .toString();
            objectStorageService.upload(stdoutPath, stdout != null ? stdout : "");
            logger.debug("Uploaded stdout for test case {} to: {}", testCaseNumber, stdoutPath);
            
            // Upload stderr
            if(stderr != null && !stderr.isEmpty()) {
                String stderrPath = new StringBuilder()
                    .append(path)
                    .append("/tc-")
                    .append(testCaseNumber)
                    .append("/stderr.txt")
                    .toString();
                objectStorageService.upload(stderrPath, stderr);
                logger.debug("Uploaded stderr for test case {} to: {}", testCaseNumber, stderrPath);
            }
        } catch (Exception e) {
            logger.error("Failed to upload test case outputs for test {}", testCaseNumber, e);
        }
    }

    private String getStatusFeedback(ExecutionStatus status) {
        switch (status) {
            case TLE:
                return "Time limit exceeded";
            case MLE:
                return "Memory limit exceeded";
            case RTE:
                return "Runtime error";
            case CE:
                return "Compilation error";
            case WA:
                return "Wrong answer";
            case AC:
                return "Accepted";
            default:
                return "Unknown status";
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
