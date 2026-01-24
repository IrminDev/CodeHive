package com.github.codehive.model.dto.queue;

import com.github.codehive.model.enums.ExecutionStatus;

import java.util.ArrayList;
import java.util.List;

public class ExecutionReport {
    private Long executionId;
    private ExecutionStatus overallStatus;
    private List<TestCaseResult> testCaseResults;
    private int totalTests;
    private int passedTests;
    private int failedTests;
    private Long totalExecutionTimeMs;
    private Long maxExecutionTimeMs;
    private Long maxMemoryUsedKb;
    private String compilationError;

    public ExecutionReport() {
        this.testCaseResults = new ArrayList<>();
    }

    public ExecutionReport(Long executionId) {
        this.executionId = executionId;
        this.testCaseResults = new ArrayList<>();
    }

    public Long getExecutionId() {
        return executionId;
    }

    public void setExecutionId(Long executionId) {
        this.executionId = executionId;
    }

    public ExecutionStatus getOverallStatus() {
        return overallStatus;
    }

    public void setOverallStatus(ExecutionStatus overallStatus) {
        this.overallStatus = overallStatus;
    }

    public List<TestCaseResult> getTestCaseResults() {
        return testCaseResults;
    }

    public void setTestCaseResults(List<TestCaseResult> testCaseResults) {
        this.testCaseResults = testCaseResults;
    }

    public int getTotalTests() {
        return totalTests;
    }

    public void setTotalTests(int totalTests) {
        this.totalTests = totalTests;
    }

    public int getPassedTests() {
        return passedTests;
    }

    public void setPassedTests(int passedTests) {
        this.passedTests = passedTests;
    }

    public int getFailedTests() {
        return failedTests;
    }

    public void setFailedTests(int failedTests) {
        this.failedTests = failedTests;
    }

    public Long getTotalExecutionTimeMs() {
        return totalExecutionTimeMs;
    }

    public void setTotalExecutionTimeMs(Long totalExecutionTimeMs) {
        this.totalExecutionTimeMs = totalExecutionTimeMs;
    }

    public Long getMaxExecutionTimeMs() {
        return maxExecutionTimeMs;
    }

    public void setMaxExecutionTimeMs(Long maxExecutionTimeMs) {
        this.maxExecutionTimeMs = maxExecutionTimeMs;
    }

    public Long getMaxMemoryUsedKb() {
        return maxMemoryUsedKb;
    }

    public void setMaxMemoryUsedKb(Long maxMemoryUsedKb) {
        this.maxMemoryUsedKb = maxMemoryUsedKb;
    }

    public String getCompilationError() {
        return compilationError;
    }

    public void setCompilationError(String compilationError) {
        this.compilationError = compilationError;
    }
}
