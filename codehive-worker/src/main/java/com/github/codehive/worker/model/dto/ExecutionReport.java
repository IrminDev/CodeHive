package com.github.codehive.worker.model.dto;

import java.util.ArrayList;
import java.util.UUID;

import com.github.codehive.worker.model.enums.ExecutionStatus;
import java.util.List;

public class ExecutionReport {
    private UUID executionId;
    private ExecutionStatus overallStatus;
    private List<TestCaseResult> testCaseResults;
    private int totalTests;
    private int passedTests;
    private int failedTests;
    private Long totalExecutionTimeMs;
    private Long maxExecutionTimeMs;
    private Long maxMemoryUsedMb;
    private String compilationError;

    public ExecutionReport() {
        this.testCaseResults = new ArrayList<>();
    }

    public ExecutionReport(UUID executionId) {
        this.executionId = executionId;
        this.testCaseResults = new ArrayList<>();
    }

    public void addTestCaseResult(TestCaseResult result) {
        this.testCaseResults.add(result);
        updateStatistics(result);
    }

    public void recordSessionPeakMemory(Long memoryUsedMb) {
        if (memoryUsedMb != null && memoryUsedMb > 0
                && (this.maxMemoryUsedMb == null || memoryUsedMb > this.maxMemoryUsedMb)) {
            this.maxMemoryUsedMb = memoryUsedMb;
        }
    }

    private void updateStatistics(TestCaseResult result) {
        this.totalTests = testCaseResults.size();
        
        if (result.getStatus() == ExecutionStatus.AC) {
            this.passedTests++;
        } else {
            this.failedTests++;
        }

        // Update timing stats
        if (result.getExecutionTimeMs() != null) {
            if (this.totalExecutionTimeMs == null) {
                this.totalExecutionTimeMs = 0L;
            }
            this.totalExecutionTimeMs += result.getExecutionTimeMs();
            
            if (this.maxExecutionTimeMs == null || result.getExecutionTimeMs() > this.maxExecutionTimeMs) {
                this.maxExecutionTimeMs = result.getExecutionTimeMs();
            }
        }

        // Update memory stats
        if (result.getMemoryUsedMb() != null) {
            if (this.maxMemoryUsedMb == null || result.getMemoryUsedMb() > this.maxMemoryUsedMb) {
                this.maxMemoryUsedMb = result.getMemoryUsedMb();
            }
        }
    }

    public void determineOverallStatus() {
        if (this.compilationError != null) {
            this.overallStatus = ExecutionStatus.CE;
            return;
        }

        if (testCaseResults.isEmpty()) {
            this.overallStatus = ExecutionStatus.AC;
            return;
        }

        // Check if all tests passed
        boolean allPassed = testCaseResults.stream()
                .allMatch(result -> result.getStatus() == ExecutionStatus.AC);
        
        if (allPassed) {
            this.overallStatus = ExecutionStatus.AC;
            return;
        }

        // Determine the most severe failure
        if (testCaseResults.stream().anyMatch(r -> r.getStatus() == ExecutionStatus.CE)) {
            this.overallStatus = ExecutionStatus.CE;
        } else if (testCaseResults.stream().anyMatch(r -> r.getStatus() == ExecutionStatus.TLE)) {
            this.overallStatus = ExecutionStatus.TLE;
        } else if (testCaseResults.stream().anyMatch(r -> r.getStatus() == ExecutionStatus.MLE)) {
            this.overallStatus = ExecutionStatus.MLE;
        } else if (testCaseResults.stream().anyMatch(r -> r.getStatus() == ExecutionStatus.OLE)) {
            this.overallStatus = ExecutionStatus.OLE;
        } else if (testCaseResults.stream().anyMatch(r -> r.getStatus() == ExecutionStatus.RTE)) {
            this.overallStatus = ExecutionStatus.RTE;
        } else {
            this.overallStatus = ExecutionStatus.WA;
        }
    }

    // Getters and setters
    public UUID getExecutionId() {
        return executionId;
    }

    public void setExecutionId(UUID executionId) {
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

    public Long getMaxMemoryUsedMb() {
        return maxMemoryUsedMb;
    }

    public void setMaxMemoryUsedMb(Long maxMemoryUsedMb) {
        this.maxMemoryUsedMb = maxMemoryUsedMb;
    }

    public String getCompilationError() {
        return compilationError;
    }

    public void setCompilationError(String compilationError) {
        this.compilationError = compilationError;
    }
}
