package com.github.codehive.worker.model.dto;

import com.github.codehive.worker.model.enums.ExecutionStatus;

public class TestCaseResult {
    private int testCaseNumber;
    private ExecutionStatus status;
    private Long executionTimeMs;
    private Long memoryUsedMb;
    private String feedback;

    public TestCaseResult() {
    }

    public TestCaseResult(int testCaseNumber, ExecutionStatus status, 
                         Long executionTimeMs, Long memoryUsedMb) {
        this.testCaseNumber = testCaseNumber;
        this.status = status;
        this.executionTimeMs = executionTimeMs;
        this.memoryUsedMb = memoryUsedMb;
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
}
