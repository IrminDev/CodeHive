package com.github.codehive.worker.model.dto.queue;

import java.util.List;
import java.util.UUID;

import com.github.codehive.worker.model.enums.Language;

public class TestGenerationJob {
    private UUID assignmentId;
    private String referenceSolutionPath;
    private Language referenceLanguage;
    private List<TestCaseInfo> testCases;
    private Long timeLimitMs;
    private Long memoryLimitMb;

    public TestGenerationJob() {
    }

    public UUID getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(UUID assignmentId) {
        this.assignmentId = assignmentId;
    }

    public String getReferenceSolutionPath() {
        return referenceSolutionPath;
    }

    public void setReferenceSolutionPath(String referenceSolutionPath) {
        this.referenceSolutionPath = referenceSolutionPath;
    }

    public Language getReferenceLanguage() {
        return referenceLanguage;
    }

    public void setReferenceLanguage(Language referenceLanguage) {
        this.referenceLanguage = referenceLanguage;
    }

    public List<TestCaseInfo> getTestCases() {
        return testCases;
    }

    public void setTestCases(List<TestCaseInfo> testCases) {
        this.testCases = testCases;
    }

    public Long getTimeLimitMs() {
        return timeLimitMs;
    }

    public void setTimeLimitMs(Long timeLimitMs) {
        this.timeLimitMs = timeLimitMs;
    }

    public Long getMemoryLimitMb() {
        return memoryLimitMb;
    }

    public void setMemoryLimitMb(Long memoryLimitMb) {
        this.memoryLimitMb = memoryLimitMb;
    }
}
