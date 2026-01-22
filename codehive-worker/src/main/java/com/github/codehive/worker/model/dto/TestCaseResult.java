package com.github.codehive.worker.model.dto;

import com.github.codehive.worker.model.enums.ExecutionStatus;

public class TestCaseResult {
    private int testCaseNumber;
    private ExecutionStatus status;
    private String output;
    private String expectedOutput;
    private String errorOutput;
    private Long executionTimeMs;
    private Long memoryUsedKb;
    private String feedback;

    public TestCaseResult() {
    }

    public TestCaseResult(int testCaseNumber, ExecutionStatus status, String output, 
                         String expectedOutput, Long executionTimeMs, Long memoryUsedKb) {
        this.testCaseNumber = testCaseNumber;
        this.status = status;
        this.output = output;
        this.expectedOutput = expectedOutput;
        this.executionTimeMs = executionTimeMs;
        this.memoryUsedKb = memoryUsedKb;
    }

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

    public String getOutput() {
        return output;
    }

    public void setOutput(String output) {
        this.output = output;
    }

    public String getExpectedOutput() {
        return expectedOutput;
    }

    public void setExpectedOutput(String expectedOutput) {
        this.expectedOutput = expectedOutput;
    }

    public String getErrorOutput() {
        return errorOutput;
    }

    public void setErrorOutput(String errorOutput) {
        this.errorOutput = errorOutput;
    }

    public Long getExecutionTimeMs() {
        return executionTimeMs;
    }

    public void setExecutionTimeMs(Long executionTimeMs) {
        this.executionTimeMs = executionTimeMs;
    }

    public Long getMemoryUsedKb() {
        return memoryUsedKb;
    }

    public void setMemoryUsedKb(Long memoryUsedKb) {
        this.memoryUsedKb = memoryUsedKb;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
}
