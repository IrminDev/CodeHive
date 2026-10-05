package com.github.codehive.model.dto.queue;

import java.util.UUID;

public class TestCaseInfo {
    private UUID testCaseId;
    private String inputPath;
    private String outputPath;
    private String baselineOutputPath;

    public TestCaseInfo() {
    }

    public TestCaseInfo(UUID testCaseId, String inputPath, String outputPath) {
        this.testCaseId = testCaseId;
        this.inputPath = inputPath;
        this.outputPath = outputPath;
    }

    public UUID getTestCaseId() {
        return testCaseId;
    }

    public void setTestCaseId(UUID testCaseId) {
        this.testCaseId = testCaseId;
    }

    public String getInputPath() {
        return inputPath;
    }

    public void setInputPath(String inputPath) {
        this.inputPath = inputPath;
    }

    public String getOutputPath() {
        return outputPath;
    }

    public void setOutputPath(String outputPath) {
        this.outputPath = outputPath;
    }

    public String getBaselineOutputPath() { return baselineOutputPath; }
    public void setBaselineOutputPath(String baselineOutputPath) { this.baselineOutputPath = baselineOutputPath; }
}
