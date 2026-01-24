package com.github.codehive.model.request.execution;

import java.util.List;

import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.model.enums.Language;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ExecutionRequest {
    @NotBlank(message = "Code is required")
    private String code;
    
    @NotNull(message = "Language is required")
    private Language language;
    
    private Long requesterId;
    
    private Long assignmentId;
    
    private List<String> testCases;
    
    @NotNull(message = "Execution type is required")
    private ExecutionType executionType;

    public ExecutionRequest() {
    }

    public ExecutionRequest(String code, Language language, Long requesterId,
                            Long assignmentId, List<String> testCases, ExecutionType executionType) {
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

    public Long getRequesterId() {
        return requesterId;
    }

    public void setRequesterId(Long requesterId) {
        this.requesterId = requesterId;
    }

    public Long getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(Long assignmentId) {
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
