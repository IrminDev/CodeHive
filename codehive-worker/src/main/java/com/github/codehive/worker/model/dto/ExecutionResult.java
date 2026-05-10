package com.github.codehive.worker.model.dto;

import com.github.codehive.worker.model.enums.ExecutionStatus;

public class ExecutionResult {
    private ExecutionStatus status; // TLE, MLE, RTE, CE, WA, AC
    private String output;
    private String errorOutput;
    private Long executionTimeMs;
    private Long memoryUsedMb;
    private Integer exitCode;
    private String compilationError;

    public ExecutionResult() {
    }

    public ExecutionResult(ExecutionStatus status, String output, String errorOutput, 
                          Long executionTimeMs, Long memoryUsedMb, Integer exitCode) {
        this.status = status;
        this.output = output;
        this.errorOutput = errorOutput;
        this.executionTimeMs = executionTimeMs;
        this.memoryUsedMb = memoryUsedMb;
        this.exitCode = exitCode;
    }

    // Factory methods for different verdicts
    public static ExecutionResult compilationError(String error) {
        ExecutionResult result = new ExecutionResult();
        result.status = ExecutionStatus.CE;
        result.compilationError = error;
        return result;
    }

    public static ExecutionResult runtimeError(String errorOutput, Integer exitCode, Long executionTime) {
        ExecutionResult result = new ExecutionResult();
        result.status = ExecutionStatus.RTE;
        result.errorOutput = errorOutput;
        result.exitCode = exitCode;
        result.executionTimeMs = executionTime;
        return result;
    }

    public static ExecutionResult timeLimitExceeded(Long timeLimit) {
        ExecutionResult result = new ExecutionResult();
        result.status = ExecutionStatus.TLE;
        result.executionTimeMs = timeLimit;
        return result;
    }

    public static ExecutionResult memoryLimitExceeded(Long memoryUsed) {
        ExecutionResult result = new ExecutionResult();
        result.status = ExecutionStatus.MLE;
        result.memoryUsedMb = memoryUsed;
        return result;
    }

    public static ExecutionResult outputLimitExceeded(String truncatedOutput, Long executionTimeMs) {
        ExecutionResult result = new ExecutionResult();
        result.status = ExecutionStatus.OLE;
        result.output = truncatedOutput;
        result.executionTimeMs = executionTimeMs;
        return result;
    }

    public static ExecutionResult success(String output, Long executionTime, Long memoryUsed) {
        ExecutionResult result = new ExecutionResult();
        result.status = ExecutionStatus.AC;
        result.output = output;
        result.executionTimeMs = executionTime;
        result.memoryUsedMb = memoryUsed;
        result.exitCode = 0;
        return result;
    }

    // Getters and setters
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

    public Long getMemoryUsedMb() {
        return memoryUsedMb;
    }

    public void setMemoryUsedMb(Long memoryUsedMb) {
        this.memoryUsedMb = memoryUsedMb;
    }

    public Integer getExitCode() {
        return exitCode;
    }

    public void setExitCode(Integer exitCode) {
        this.exitCode = exitCode;
    }

    public String getCompilationError() {
        return compilationError;
    }

    public void setCompilationError(String compilationError) {
        this.compilationError = compilationError;
    }
}
