package com.github.codehive.model.request.assignment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.Language;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

/**
 * Complete editable snapshot submitted by the assignment clone form.
 *
 * Dates remain optional and are intentionally not supplied by the clone-form
 * endpoint so a new clone starts without inherited scheduling.
 */
public class CloneAssignmentRequest {
    @NotNull(message = "Target group ID is required")
    private UUID targetGroupId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    private List<String> constraints;
    private List<String> hints;
    private List<String> tags;

    @NotNull(message = "Time limit is required")
    @Min(value = AssignmentLimits.MIN_TIME_LIMIT_MS, message = "Time limit must be at least 100ms")
    @Max(value = AssignmentLimits.MAX_TIME_LIMIT_MS, message = "Time limit must not exceed 10000ms")
    private Long timeLimitMs;

    @NotNull(message = "Memory limit is required")
    @Min(value = AssignmentLimits.MIN_MEMORY_LIMIT_MB, message = "Memory limit must be at least 16MB")
    @Max(value = AssignmentLimits.MAX_MEMORY_LIMIT_MB, message = "Memory limit must not exceed 1000MB")
    private Long memoryLimitMb;

    @NotNull(message = "Comparator type is required")
    private ComparatorType comparatorType;

    @NotEmpty(message = "At least one allowed language is required")
    private List<Language> allowedLanguages;

    @NotNull(message = "Reference language is required")
    private Language referenceLanguage;

    @NotBlank(message = "Reference solution is required")
    private String referenceSolution;

    @NotEmpty(message = "At least one test case input is required")
    @Size(max = AssignmentLimits.MAX_TEST_CASES, message = "At most 50 test cases are allowed")
    @Valid
    private List<CloneTestCaseRequest> testCases;

    @Valid
    private List<AssignmentExampleRequest> examples;

    @DecimalMin(value = "0.01", message = "Max points must be greater than zero")
    private BigDecimal maxPoints = new BigDecimal("100.00");

    @FutureOrPresent(message = "Launch date cannot be before the current time")
    private Instant launchDate;
    @FutureOrPresent(message = "Due date cannot be before the current time")
    private Instant dueDate;
    @FutureOrPresent(message = "Close date cannot be before the current time")
    private Instant closeDate;

    public UUID getTargetGroupId() { return targetGroupId; }
    public void setTargetGroupId(UUID targetGroupId) { this.targetGroupId = targetGroupId; }
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
    public String getReferenceSolution() { return referenceSolution; }
    public void setReferenceSolution(String referenceSolution) { this.referenceSolution = referenceSolution; }
    public List<CloneTestCaseRequest> getTestCases() { return testCases; }
    public void setTestCases(List<CloneTestCaseRequest> testCases) { this.testCases = testCases; }
    public List<AssignmentExampleRequest> getExamples() { return examples; }
    public void setExamples(List<AssignmentExampleRequest> examples) { this.examples = examples; }
    public BigDecimal getMaxPoints() { return maxPoints; }
    public void setMaxPoints(BigDecimal maxPoints) { this.maxPoints = maxPoints; }
    public Instant getLaunchDate() { return launchDate; }
    public void setLaunchDate(Instant launchDate) { this.launchDate = launchDate; }
    public Instant getDueDate() { return dueDate; }
    public void setDueDate(Instant dueDate) { this.dueDate = dueDate; }
    public Instant getCloseDate() { return closeDate; }
    public void setCloseDate(Instant closeDate) { this.closeDate = closeDate; }
}
