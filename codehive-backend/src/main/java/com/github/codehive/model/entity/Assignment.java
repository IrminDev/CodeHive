package com.github.codehive.model.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.Language;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "assignments")
public class Assignment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, length = 200)
    private String title;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;
    
    @ElementCollection
    @CollectionTable(name = "assignment_constraints", joinColumns = @JoinColumn(name = "assignment_id"))
    @Column(name = "constraint_text", columnDefinition = "TEXT")
    private List<String> constraints = new ArrayList<>();
    
    @ElementCollection
    @CollectionTable(name = "assignment_hints", joinColumns = @JoinColumn(name = "assignment_id"))
    @Column(name = "hint_text", columnDefinition = "TEXT")
    private List<String> hints = new ArrayList<>();
    
    @ElementCollection
    @CollectionTable(name = "assignment_tags", joinColumns = @JoinColumn(name = "assignment_id"))
    @Column(name = "tag", length = 50)
    private List<String> tags = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "assignment_allowed_languages", joinColumns = @JoinColumn(name = "assignment_id"))
    @Column(name = "language", length = 20)
    @Enumerated(EnumType.STRING)
    private List<Language> allowedLanguages;
    
    @Column(nullable = false)
    private Long timeLimitMs;
    
    @Column(nullable = false)
    private Long memoryLimitMb;
    
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ComparatorType comparatorType;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(nullable = true)
    private LocalDateTime dueDate;

    @Column(nullable = false)
    private Boolean isActive;

    public Assignment() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.constraints = new ArrayList<>();
        this.hints = new ArrayList<>();
        this.tags = new ArrayList<>();
        this.allowedLanguages = new ArrayList<>();
        this.isActive = true;
    }

    public Assignment(String title, String description, Long timeLimitMs, Long memoryLimitMb, ComparatorType comparatorType) {
        this();
        this.title = title;
        this.description = description;
        this.timeLimitMs = timeLimitMs;
        this.memoryLimitMb = memoryLimitMb;
        this.comparatorType = comparatorType;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public List<Language> getAllowedLanguages() {
        return allowedLanguages;
    }

    public void setAllowedLanguages(List<Language> allowedLanguages) {
        this.allowedLanguages = allowedLanguages;
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
}
