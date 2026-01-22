package com.github.codehive.model.dto.queue;

import java.util.List;

import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.model.enums.Language;


public class ExecutionJob {
    private Long id;
    private String source;
    private String reference;
    private Language language;
    private ExecutionType executionType;
    private List<String> testCases;
    private String outputPath;
    private Long timeLimitMs;
    private Long memoryLimitMb;
    private Integer numTests;
    private Language referenceLanguage;
    private String testsPath;
    private ComparatorType comparatorType;

    public ExecutionJob() {
    }

    public ExecutionJob(Long id, String source, String reference, Language language, 
                       ExecutionType executionType, List<String> testCases, 
                       Long timeLimitMs, Long memoryLimitMb, ComparatorType comparatorType, String outputPath, Integer numTests, String testsPath, Language referenceLanguage) {
        this.id = id;
        this.source = source;
        this.reference = reference;
        this.language = language;
        this.executionType = executionType;
        this.testCases = testCases;
        this.timeLimitMs = timeLimitMs;
        this.memoryLimitMb = memoryLimitMb;
        this.comparatorType = comparatorType;
        this.outputPath = outputPath;
        this.numTests = numTests;
        this.testsPath = testsPath;
        this.referenceLanguage = referenceLanguage;
    }

    public Language getReferenceLanguage() {
        return referenceLanguage;
    }

    public void setReferenceLanguage(Language referenceLanguage) {
        this.referenceLanguage = referenceLanguage;
    }

    public String getTestsPath() {
        return testsPath;
    }

    public void setTestsPath(String testsPath) {
        this.testsPath = testsPath;
    }

    public Integer getNumTests() {
        return numTests;
    }
    public void setNumTests(Integer numTests) {
        this.numTests = numTests;
    }

    public String getOutputPath() {
        return outputPath;
    }

    public void setOutputPath(String outputPath) {
        this.outputPath = outputPath;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
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

    public List<String> getTestCases() {
        return testCases;
    }

    public void setTestCases(List<String> testCases) {
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
}
