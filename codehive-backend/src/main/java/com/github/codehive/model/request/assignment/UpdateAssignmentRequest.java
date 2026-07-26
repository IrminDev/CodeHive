package com.github.codehive.model.request.assignment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.TestSuiteUpdateMode;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public class UpdateAssignmentRequest {
    @Size(max = 200)
    private String title;
    private String description;
    private List<String> constraints;
    private List<String> hints;
    private List<String> tags;
    @Min(100)
    private Long timeLimitMs;
    @Min(16)
    private Long memoryLimitMb;
    private ComparatorType comparatorType;
    private List<Language> allowedLanguages;
    private Language referenceLanguage;
    private Instant launchDate;
    private Instant dueDate;
    private Instant closeDate;
    private Boolean clearLaunchDate;
    private Boolean clearDueDate;
    private Boolean clearCloseDate;
    @DecimalMin("0.01")
    private BigDecimal maxPoints;
    @Valid
    private List<AssignmentExampleRequest> examples;
    private List<Boolean> sampleFlags;
    private TestSuiteUpdateMode testSuiteUpdateMode = TestSuiteUpdateMode.APPEND;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<String> getConstraints() { return constraints; }
    public void setConstraints(List<String> constraints) { this.constraints = constraints; }
    public List<String> getHints() { return hints; }
    public void setHints(List<String> hints) { this.hints = hints; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public Long getTimeLimitMs() { return timeLimitMs; }
    public void setTimeLimitMs(Long timeLimitMs) { this.timeLimitMs = timeLimitMs; }
    public Long getMemoryLimitMb() { return memoryLimitMb; }
    public void setMemoryLimitMb(Long memoryLimitMb) { this.memoryLimitMb = memoryLimitMb; }
    public ComparatorType getComparatorType() { return comparatorType; }
    public void setComparatorType(ComparatorType comparatorType) { this.comparatorType = comparatorType; }
    public List<Language> getAllowedLanguages() { return allowedLanguages; }
    public void setAllowedLanguages(List<Language> allowedLanguages) { this.allowedLanguages = allowedLanguages; }
    public Language getReferenceLanguage() { return referenceLanguage; }
    public void setReferenceLanguage(Language referenceLanguage) { this.referenceLanguage = referenceLanguage; }
    public Instant getLaunchDate() { return launchDate; }
    public void setLaunchDate(Instant launchDate) { this.launchDate = launchDate; }
    public Instant getDueDate() { return dueDate; }
    public void setDueDate(Instant dueDate) { this.dueDate = dueDate; }
    public Instant getCloseDate() { return closeDate; }
    public void setCloseDate(Instant closeDate) { this.closeDate = closeDate; }
    public Boolean getClearLaunchDate() { return clearLaunchDate; }
    public void setClearLaunchDate(Boolean clearLaunchDate) { this.clearLaunchDate = clearLaunchDate; }
    public Boolean getClearDueDate() { return clearDueDate; }
    public void setClearDueDate(Boolean clearDueDate) { this.clearDueDate = clearDueDate; }
    public Boolean getClearCloseDate() { return clearCloseDate; }
    public void setClearCloseDate(Boolean clearCloseDate) { this.clearCloseDate = clearCloseDate; }
    public BigDecimal getMaxPoints() { return maxPoints; }
    public void setMaxPoints(BigDecimal maxPoints) { this.maxPoints = maxPoints; }
    public List<AssignmentExampleRequest> getExamples() { return examples; }
    public void setExamples(List<AssignmentExampleRequest> examples) { this.examples = examples; }
    public List<Boolean> getSampleFlags() { return sampleFlags; }
    public void setSampleFlags(List<Boolean> sampleFlags) { this.sampleFlags = sampleFlags; }
    public TestSuiteUpdateMode getTestSuiteUpdateMode() { return testSuiteUpdateMode; }
    public void setTestSuiteUpdateMode(TestSuiteUpdateMode mode) { this.testSuiteUpdateMode = mode; }
}
