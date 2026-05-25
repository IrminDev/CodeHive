package com.github.codehive.model.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.Language;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class AssignmentDTO {
    private UUID id;
    private String title;
    private String description;
    private List<String> constraints;
    private List<String> hints;
    private List<String> tags;
    private Long timeLimitMs;
    private Long memoryLimitMb;
    private ComparatorType comparatorType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime dueDate;
    private List<Language> allowedLanguages;
    private Boolean isActive;
    private List<SampleTestCaseDTO> sampleTestCases;

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }

    public List<Language> getAllowedLanguages() {
        return allowedLanguages;
    }

    public void setAllowedLanguages(List<Language> allowedLanguages) {
        this.allowedLanguages = allowedLanguages;
    }

    public List<SampleTestCaseDTO> getSampleTestCases() {
        return sampleTestCases;
    }

    public void setSampleTestCases(List<SampleTestCaseDTO> sampleTestCases) {
        this.sampleTestCases = sampleTestCases;
    }
}