package com.github.codehive.model.dto.queue;

import java.util.UUID;

public class TestGenerationResult {
    private UUID assignmentId;
    private boolean success;
    private int generatedCount;
    private String errorMessage;

    public TestGenerationResult() {
    }

    public TestGenerationResult(UUID assignmentId, boolean success, int generatedCount, String errorMessage) {
        this.assignmentId = assignmentId;
        this.success = success;
        this.generatedCount = generatedCount;
        this.errorMessage = errorMessage;
    }

    public UUID getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(UUID assignmentId) {
        this.assignmentId = assignmentId;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public int getGeneratedCount() {
        return generatedCount;
    }

    public void setGeneratedCount(int generatedCount) {
        this.generatedCount = generatedCount;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}
