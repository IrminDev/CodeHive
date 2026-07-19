package com.github.codehive.model.request.assignment;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.Language;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;

public class CreateAssignmentRequest {

    @NotNull(message = "Group ID is required")
    private UUID groupId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    private List<String> constraints;
    private List<String> hints;
    private List<String> tags;

    @NotNull(message = "Time limit is required")
    @Min(value = 100, message = "Time limit must be at least 100ms")
    private Long timeLimitMs;

    @NotNull(message = "Memory limit is required")
    @Min(value = 16, message = "Memory limit must be at least 16MB")
    private Long memoryLimitMb;

    @NotNull(message = "Comparator type is required")
    private ComparatorType comparatorType;

    @NotEmpty(message = "At least one allowed language is required")
    private List<Language> allowedLanguages;

    @NotNull(message = "Reference language is required")
    private Language referenceLanguage;

    private Instant launchDate;
    private Instant dueDate;
    private Instant closeDate;

    @Valid
    private List<AssignmentExampleRequest> examples;

    // Parallel list indicating whether each uploaded test case input is a sample.
    // If null or shorter than the number of uploaded files, remaining cases default to non-sample.
    private List<Boolean> sampleFlags;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getConstraints() {
        return constraints;
    }

    public void setConstraints(List<String> constraints) {
        this.constraints = constraints;
    }

    public List<String> getHints() {
        return hints;
    }

    public void setHints(List<String> hints) {
        this.hints = hints;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
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

    public List<Language> getAllowedLanguages() {
        return allowedLanguages;
    }

    public void setAllowedLanguages(List<Language> allowedLanguages) {
        this.allowedLanguages = allowedLanguages;
    }

    public Language getReferenceLanguage() {
        return referenceLanguage;
    }

    public void setReferenceLanguage(Language referenceLanguage) {
        this.referenceLanguage = referenceLanguage;
    }

    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }
    public Instant getLaunchDate() { return launchDate; }
    public void setLaunchDate(Instant launchDate) { this.launchDate = launchDate; }
    public Instant getDueDate() {
        return dueDate;
    }

    public void setDueDate(Instant dueDate) {
        this.dueDate = dueDate;
    }

    public Instant getCloseDate() { return closeDate; }
    public void setCloseDate(Instant closeDate) { this.closeDate = closeDate; }
    public List<AssignmentExampleRequest> getExamples() { return examples; }
    public void setExamples(List<AssignmentExampleRequest> examples) { this.examples = examples; }

    public List<Boolean> getSampleFlags() {
        return sampleFlags;
    }

    public void setSampleFlags(List<Boolean> sampleFlags) {
        this.sampleFlags = sampleFlags;
    }
}
