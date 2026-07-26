package com.github.codehive.model.dto.queue;

import java.util.List;
import java.util.UUID;

import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.model.enums.Language;


public class ExecutionJob {
    private UUID id;
    private String source;
    private String reference;
    private Language language;
    private ExecutionType executionType;
    private List<ExecutionTestCaseInfo> testCases;
    private String reportPath;
    private Long timeLimitMs;
    private Long memoryLimitMb;
    private Language referenceLanguage;
    private ComparatorType comparatorType;
    private UUID testSuiteRevisionId;
    private String trigger;

    public ExecutionJob() {
    }

    public ExecutionJob(UUID id, String source, String reference, Language language,
                        ExecutionType executionType, List<ExecutionTestCaseInfo> testCases,
                        Long timeLimitMs, Long memoryLimitMb, ComparatorType comparatorType,
                        String reportPath, Language referenceLanguage,
                        UUID testSuiteRevisionId, String trigger) {
        this.id = id;
        this.source = source;
        this.reference = reference;
        this.language = language;
        this.executionType = executionType;
        this.testCases = testCases;
        this.timeLimitMs = timeLimitMs;
        this.memoryLimitMb = memoryLimitMb;
        this.comparatorType = comparatorType;
        this.reportPath = reportPath;
        this.referenceLanguage = referenceLanguage;
        this.testSuiteRevisionId = testSuiteRevisionId;
        this.trigger = trigger;
    }

    public Language getReferenceLanguage() {
        return referenceLanguage;
    }

    public void setReferenceLanguage(Language referenceLanguage) {
        this.referenceLanguage = referenceLanguage;
    }

    public String getReportPath() {
        return reportPath;
    }

    public void setReportPath(String reportPath) {
        this.reportPath = reportPath;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public Language getLanguage() {
        return language;
    }

    public void setLanguage(Language language) {
        this.language = language;
    }

    public ExecutionType getExecutionType() {
        return executionType;
    }

    public void setExecutionType(ExecutionType executionType) {
        this.executionType = executionType;
    }

    public List<ExecutionTestCaseInfo> getTestCases() {
        return testCases;
    }

    public void setTestCases(List<ExecutionTestCaseInfo> testCases) {
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

    public ComparatorType getComparatorType() {
        return comparatorType;
    }

    public void setComparatorType(ComparatorType comparatorType) {
        this.comparatorType = comparatorType;
    }

    public UUID getTestSuiteRevisionId() {
        return testSuiteRevisionId;
    }

    public void setTestSuiteRevisionId(UUID testSuiteRevisionId) {
        this.testSuiteRevisionId = testSuiteRevisionId;
    }

    public String getTrigger() {
        return trigger;
    }

    public void setTrigger(String trigger) {
        this.trigger = trigger;
    }
}
