package com.github.codehive.model.request.execution;

import java.util.List;
import java.util.UUID;

import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.model.enums.Language;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ExecutionRequest {
    @NotBlank(message = "Code is required")
    private String code;
    
    @NotNull(message = "Language is required")
    private Language language;
    
    private UUID requesterId;

    @NotNull(message = "Assignment ID is required")
    private UUID assignmentId;
    
    private List<String> testCases;
    
    @NotNull(message = "Execution type is required")
    private ExecutionType executionType;

    public ExecutionRequest() {
    }

    public ExecutionRequest(String code, Language language, UUID requesterId,
                            UUID assignmentId, List<String> testCases, ExecutionType executionType) {
        this.code = code;
        this.language = language;
        this.requesterId = requesterId;
        this.assignmentId = assignmentId;
        this.testCases = testCases;
        this.executionType = executionType;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Language getLanguage() {
        return language;
    }

    public void setLanguage(Language language) {
        this.language = language;
    }

    public UUID getRequesterId() {
        return requesterId;
    }

    public void setRequesterId(UUID requesterId) {
        this.requesterId = requesterId;
    }

    public UUID getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(UUID assignmentId) {
        this.assignmentId = assignmentId;
    }

    public List<String> getTestCases() {
        return testCases;
    }

    public void setTestCases(List<String> testCases) {
        this.testCases = testCases;
    }

    public ExecutionType getExecutionType() {
        return executionType;
    }

    public void setExecutionType(ExecutionType executionType) {
        this.executionType = executionType;
    }
}
