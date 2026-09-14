package com.github.codehive.model.dto.queue;

import java.util.UUID;

public class ExecutionTestCaseInfo {
    private UUID testCaseId;
    private Integer order;
    private String inputPath;
    private String inlineInput;
    private String expectedOutputPath;
    private String stdoutPath;
    private String stderrPath;

    public ExecutionTestCaseInfo() {
    }

    public ExecutionTestCaseInfo(UUID testCaseId, Integer order, String inputPath, String inlineInput,
                                 String expectedOutputPath, String stdoutPath, String stderrPath) {
        this.testCaseId = testCaseId;
        this.order = order;
        this.inputPath = inputPath;
        this.inlineInput = inlineInput;
        this.expectedOutputPath = expectedOutputPath;
        this.stdoutPath = stdoutPath;
        this.stderrPath = stderrPath;
    }

    public UUID getTestCaseId() { return testCaseId; }
    public void setTestCaseId(UUID testCaseId) { this.testCaseId = testCaseId; }
    public Integer getOrder() { return order; }
    public void setOrder(Integer order) { this.order = order; }
    public String getInputPath() { return inputPath; }
    public void setInputPath(String inputPath) { this.inputPath = inputPath; }
    public String getInlineInput() { return inlineInput; }
    public void setInlineInput(String inlineInput) { this.inlineInput = inlineInput; }
    public String getExpectedOutputPath() { return expectedOutputPath; }
    public void setExpectedOutputPath(String expectedOutputPath) { this.expectedOutputPath = expectedOutputPath; }
    public String getStdoutPath() { return stdoutPath; }
    public void setStdoutPath(String stdoutPath) { this.stdoutPath = stdoutPath; }
    public String getStderrPath() { return stderrPath; }
    public void setStderrPath(String stderrPath) { this.stderrPath = stderrPath; }
}
