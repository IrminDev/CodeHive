package com.github.codehive.worker.model.dto;

import java.util.UUID;

import com.github.codehive.worker.model.enums.ExecutionStatus;

public class TestCaseResult {
    private static final int MAX_PERSISTED_DIAGNOSTIC_CHARS = 8 * 1024;
    private static final String TRUNCATION_SUFFIX = "\n[Output truncated for artifact retention]";
    private UUID testCaseId;
    private int testCaseNumber;
    private ExecutionStatus status;
    private Long executionTimeMs;
    private Long memoryUsedMb;
    private String feedback;
    private String expectedOutput; // only set for PRACTICE WA
    private String actualOutput;   // only set for PRACTICE WA

    public TestCaseResult() {
    }

    public TestCaseResult(int testCaseNumber, ExecutionStatus status, 
                         Long executionTimeMs, Long memoryUsedMb) {
        this.testCaseNumber = testCaseNumber;
        this.status = status;
        this.executionTimeMs = executionTimeMs;
        this.memoryUsedMb = memoryUsedMb;
    }

    public UUID getTestCaseId() { return testCaseId; }
    public void setTestCaseId(UUID testCaseId) { this.testCaseId = testCaseId; }

    // Getters and setters
    public int getTestCaseNumber() {
        return testCaseNumber;
    }

    public void setTestCaseNumber(int testCaseNumber) {
        this.testCaseNumber = testCaseNumber;
    }

    public ExecutionStatus getStatus() {
        return status;
    }

    public void setStatus(ExecutionStatus status) {
        this.status = status;
    }

    public Long getExecutionTimeMs() {
        return executionTimeMs;
    }

    public void setExecutionTimeMs(Long executionTimeMs) {
        this.executionTimeMs = executionTimeMs;
    }

    public Long getMemoryUsedMb() {
        return memoryUsedMb;
    }

    public void setMemoryUsedMb(Long memoryUsedMb) {
        this.memoryUsedMb = memoryUsedMb;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public String getExpectedOutput() {
        return expectedOutput;
    }

    public void setExpectedOutput(String expectedOutput) {
        this.expectedOutput = truncateDiagnostic(expectedOutput);
    }

    public String getActualOutput() {
        return actualOutput;
    }

    public void setActualOutput(String actualOutput) {
        this.actualOutput = truncateDiagnostic(actualOutput);
    }

    private String truncateDiagnostic(String output) {
        if (output == null || output.length() <= MAX_PERSISTED_DIAGNOSTIC_CHARS) return output;
        int end = MAX_PERSISTED_DIAGNOSTIC_CHARS - TRUNCATION_SUFFIX.length();
        return output.substring(0, end) + TRUNCATION_SUFFIX;
    }
}
