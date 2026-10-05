package com.github.codehive.model.entity;

import java.time.Instant;
import java.util.UUID;

import com.github.codehive.model.enums.ReevaluationBatchStatus;

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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "reevaluation_batches",
        uniqueConstraints = @UniqueConstraint(columnNames = {"assignment_id", "test_suite_revision_id"}))
public class ReevaluationBatch {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "test_suite_revision_id", nullable = false)
    private TestSuiteRevision testSuiteRevision;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReevaluationBatchStatus status = ReevaluationBatchStatus.DISPATCHING;

    @Column(nullable = false)
    private int total;
    @Column(nullable = false)
    private int queued;
    @Column(nullable = false)
    private int completed;
    @Column(nullable = false)
    private int failed;
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
    private Instant completedAt;

    public UUID getId() { return id; }
    public Assignment getAssignment() { return assignment; }
    public void setAssignment(Assignment assignment) { this.assignment = assignment; }
    public TestSuiteRevision getTestSuiteRevision() { return testSuiteRevision; }
    public void setTestSuiteRevision(TestSuiteRevision revision) { this.testSuiteRevision = revision; }
    public ReevaluationBatchStatus getStatus() { return status; }
    public void setStatus(ReevaluationBatchStatus status) { this.status = status; }
    public int getTotal() { return total; }
    public void setTotal(int total) { this.total = total; }
    public int getQueued() { return queued; }
    public void setQueued(int queued) { this.queued = queued; }
    public int getCompleted() { return completed; }
    public void setCompleted(int completed) { this.completed = completed; }
    public int getFailed() { return failed; }
    public void setFailed(int failed) { this.failed = failed; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
