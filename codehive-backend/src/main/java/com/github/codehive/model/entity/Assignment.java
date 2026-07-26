package com.github.codehive.model.entity;

import java.time.Instant;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.AssignmentValidationStatus;
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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import jakarta.persistence.FetchType;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "assignments")
public class Assignment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private ClassGroup group;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;
    
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
    
    private Instant launchDate;

    private Instant dueDate;

    private Instant closeDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private AssignmentValidationStatus validationStatus;

    @Column(nullable = false)
    private Boolean isActive;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "active_test_suite_revision_id")
    private TestSuiteRevision activeTestSuiteRevision;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "active_reference_solution_revision_id")
    private ReferenceSolutionRevision activeReferenceSolutionRevision;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal maxPoints = new BigDecimal("100.00");

    @Version
    @Column(nullable = false)
    private Long version;

    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AssignmentExample> examples = new ArrayList<>();

    public Assignment() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.constraints = new ArrayList<>();
        this.hints = new ArrayList<>();
        this.tags = new ArrayList<>();
        this.allowedLanguages = new ArrayList<>();
        this.isActive = true;
        this.validationStatus = AssignmentValidationStatus.PROCESSING;
    }

    public Assignment(String title, String description, Long timeLimitMs, Long memoryLimitMb, ComparatorType comparatorType) {
        this();
        this.title = title;
        this.description = description;
        this.timeLimitMs = timeLimitMs;
        this.memoryLimitMb = memoryLimitMb;
        this.comparatorType = comparatorType;
    }

    public ClassGroup getGroup() { return group; }
    public void setGroup(ClassGroup group) { this.group = group; }
    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }
    public Instant getLaunchDate() { return launchDate; }
    public void setLaunchDate(Instant launchDate) { this.launchDate = launchDate; }
    public Instant getCloseDate() { return closeDate; }
    public void setCloseDate(Instant closeDate) { this.closeDate = closeDate; }
    public AssignmentValidationStatus getValidationStatus() { return validationStatus; }
    public void setValidationStatus(AssignmentValidationStatus validationStatus) { this.validationStatus = validationStatus; }
    public List<AssignmentExample> getExamples() { return examples; }
    public void setExamples(List<AssignmentExample> examples) {
        this.examples.clear();
        if (examples != null) {
            examples.forEach(this::addExample);
        }
    }
    public void addExample(AssignmentExample example) {
        example.setAssignment(this);
        this.examples.add(example);
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
        this.allowedLanguages = allowedLanguages == null ? new ArrayList<>() : new ArrayList<>(allowedLanguages);
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
        this.constraints = constraints == null ? new ArrayList<>() : new ArrayList<>(constraints);
    }

    public List<String> getHints() {
        return hints;
    }

    public void setHints(List<String> hints) {
        this.hints = hints == null ? new ArrayList<>() : new ArrayList<>(hints);
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags == null ? new ArrayList<>() : new ArrayList<>(tags);
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

    public Instant getDueDate() {
        return dueDate;
    }

    public void setDueDate(Instant dueDate) {
        this.dueDate = dueDate;
    }

    public TestSuiteRevision getActiveTestSuiteRevision() { return activeTestSuiteRevision; }
    public void setActiveTestSuiteRevision(TestSuiteRevision revision) { this.activeTestSuiteRevision = revision; }
    public ReferenceSolutionRevision getActiveReferenceSolutionRevision() { return activeReferenceSolutionRevision; }
    public void setActiveReferenceSolutionRevision(ReferenceSolutionRevision revision) { this.activeReferenceSolutionRevision = revision; }
    public BigDecimal getMaxPoints() { return maxPoints; }
    public void setMaxPoints(BigDecimal maxPoints) { this.maxPoints = maxPoints; }
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}
