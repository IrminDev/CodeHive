package com.github.codehive.model.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.model.enums.ExecutionTrigger;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "executions")
public class Execution {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = true)
    private Submission submission; // NULLABLE for PRACTICE executions
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User user; // User who initiated the execution

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = true)
    private Assignment assignment;
    
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ExecutionType executionType;
    
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ExecutionStatus status;
    
    @Column(nullable = true)
    private Long timeMs;
    
    @Column(nullable = true)
    private Long memoryMb;
    
    @Column(nullable = false)
    private Boolean isOutdated;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_suite_revision_id")
    private TestSuiteRevision testSuiteRevision;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private ExecutionTrigger trigger;

    @Column(nullable = false)
    private Instant artifactsExpireAt;

    private Instant artifactsPurgedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reevaluation_batch_id")
    private ReevaluationBatch reevaluationBatch;

    public Execution() {
        this.createdAt = LocalDateTime.now();
        this.isOutdated = false;
        this.status = ExecutionStatus.PENDING;
        this.trigger = ExecutionTrigger.INITIAL_SUBMISSION;
        this.artifactsExpireAt = Instant.now().plus(90, ChronoUnit.DAYS);
    }

    public Execution(Submission submission, ExecutionType executionType) {
        this();
        this.submission = submission;
        this.executionType = executionType;
    }

    public Execution(ExecutionType executionType) {
        this();
        this.executionType = executionType;
        if (executionType == ExecutionType.PRACTICE) this.trigger = ExecutionTrigger.PRACTICE;
    }

    public Execution(ExecutionType executionType, User user) {
        this();
        this.executionType = executionType;
        this.user = user;
        if (executionType == ExecutionType.PRACTICE) this.trigger = ExecutionTrigger.PRACTICE;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Submission getSubmission() {
        return submission;
    }

    public void setSubmission(Submission submission) {
        this.submission = submission;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Assignment getAssignment() { return assignment; }
    public void setAssignment(Assignment assignment) { this.assignment = assignment; }

    public ExecutionType getExecutionType() {
        return executionType;
    }

    public void setExecutionType(ExecutionType executionType) {
        this.executionType = executionType;
    }

    public ExecutionStatus getStatus() {
        return status;
    }

    public void setStatus(ExecutionStatus status) {
        this.status = status;
    }

    public Long getTimeMs() {
        return timeMs;
    }

    public void setTimeMs(Long timeMs) {
        this.timeMs = timeMs;
    }

    public Long getMemoryMb() {
        return memoryMb;
    }

    public void setMemoryMb(Long memoryMb) {
        this.memoryMb = memoryMb;
    }

    public Boolean getIsOutdated() {
        return isOutdated;
    }

    public void setIsOutdated(Boolean isOutdated) {
        this.isOutdated = isOutdated;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public TestSuiteRevision getTestSuiteRevision() { return testSuiteRevision; }
    public void setTestSuiteRevision(TestSuiteRevision revision) { this.testSuiteRevision = revision; }
    public ExecutionTrigger getTrigger() { return trigger; }
    public void setTrigger(ExecutionTrigger trigger) { this.trigger = trigger; }
    public Instant getArtifactsExpireAt() { return artifactsExpireAt; }
    public void setArtifactsExpireAt(Instant artifactsExpireAt) { this.artifactsExpireAt = artifactsExpireAt; }
    public Instant getArtifactsPurgedAt() { return artifactsPurgedAt; }
    public void setArtifactsPurgedAt(Instant artifactsPurgedAt) { this.artifactsPurgedAt = artifactsPurgedAt; }
    public ReevaluationBatch getReevaluationBatch() { return reevaluationBatch; }
    public void setReevaluationBatch(ReevaluationBatch batch) { this.reevaluationBatch = batch; }
}
