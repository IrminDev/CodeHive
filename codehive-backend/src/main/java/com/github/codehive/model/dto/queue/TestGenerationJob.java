package com.github.codehive.model.dto.queue;

import java.util.List;
import java.util.UUID;

import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.TestGenerationMode;

public class TestGenerationJob {
    private UUID assignmentId;
    private String referenceSolutionPath;
    private Language referenceLanguage;
    private List<TestCaseInfo> testCases;
    private Long timeLimitMs;
    private Long memoryLimitMb;
    private UUID assignmentUpdateId;
    private UUID testSuiteRevisionId;
    private UUID referenceSolutionRevisionId;
    private TestGenerationMode mode = TestGenerationMode.TEST_SUITE_GENERATION;
    private ComparatorType comparatorType;

    public TestGenerationJob() {
    }

    public TestGenerationJob(UUID assignmentId, String referenceSolutionPath, Language referenceLanguage,
                             List<TestCaseInfo> testCases, Long timeLimitMs, Long memoryLimitMb) {
        this.assignmentId = assignmentId;
        this.referenceSolutionPath = referenceSolutionPath;
        this.referenceLanguage = referenceLanguage;
        this.testCases = testCases;
        this.timeLimitMs = timeLimitMs;
        this.memoryLimitMb = memoryLimitMb;
    }

    public UUID getAssignmentUpdateId() { return assignmentUpdateId; }
    public void setAssignmentUpdateId(UUID assignmentUpdateId) { this.assignmentUpdateId = assignmentUpdateId; }
    public UUID getTestSuiteRevisionId() { return testSuiteRevisionId; }
    public void setTestSuiteRevisionId(UUID testSuiteRevisionId) { this.testSuiteRevisionId = testSuiteRevisionId; }
    public UUID getReferenceSolutionRevisionId() { return referenceSolutionRevisionId; }
    public void setReferenceSolutionRevisionId(UUID referenceSolutionRevisionId) { this.referenceSolutionRevisionId = referenceSolutionRevisionId; }
    public TestGenerationMode getMode() { return mode; }
    public void setMode(TestGenerationMode mode) { this.mode = mode; }
    public ComparatorType getComparatorType() { return comparatorType; }
    public void setComparatorType(ComparatorType comparatorType) { this.comparatorType = comparatorType; }

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
