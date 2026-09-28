package com.github.codehive.model.dto.queue;

import java.util.UUID;

public class TestGenerationResult {
    private UUID assignmentId;
    private boolean success;
    private int generatedCount;
    private String errorMessage;
    private UUID assignmentUpdateId;
    private UUID testSuiteRevisionId;
    private UUID referenceSolutionRevisionId;

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

    public UUID getAssignmentUpdateId() { return assignmentUpdateId; }
    public void setAssignmentUpdateId(UUID assignmentUpdateId) { this.assignmentUpdateId = assignmentUpdateId; }
    public UUID getTestSuiteRevisionId() { return testSuiteRevisionId; }
    public void setTestSuiteRevisionId(UUID testSuiteRevisionId) { this.testSuiteRevisionId = testSuiteRevisionId; }
    public UUID getReferenceSolutionRevisionId() { return referenceSolutionRevisionId; }
    public void setReferenceSolutionRevisionId(UUID referenceSolutionRevisionId) { this.referenceSolutionRevisionId = referenceSolutionRevisionId; }
}
