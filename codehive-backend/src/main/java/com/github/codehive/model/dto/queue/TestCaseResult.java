package com.github.codehive.model.dto.queue;

import java.util.UUID;

import com.github.codehive.model.enums.ExecutionStatus;

public class TestCaseResult {
    private UUID testCaseId;
    private int testCaseNumber;
    private ExecutionStatus status;
    private Long executionTimeMs;
    private Long memoryUsedMb;
    private String feedback;
    private String expectedOutput;
    private String actualOutput;

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
        this.expectedOutput = expectedOutput;
    }

    public String getActualOutput() {
        return actualOutput;
    }

    public void setActualOutput(String actualOutput) {
        this.actualOutput = actualOutput;
    }
}
