package com.github.codehive.model.entity;

import java.time.Instant;
import java.util.UUID;

import com.github.codehive.model.enums.RevisionStatus;

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
@Table(name = "test_suite_revisions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"assignment_id", "revision_number"}))
public class TestSuiteRevision {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reference_solution_revision_id", nullable = false)
    private ReferenceSolutionRevision referenceSolutionRevision;

    @Column(name = "revision_number", nullable = false)
    private Integer revisionNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RevisionStatus status = RevisionStatus.PROCESSING;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    private Instant activatedAt;

    @Column(columnDefinition = "TEXT")
    private String failureMessage;

    private Instant artifactsPurgedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Assignment getAssignment() { return assignment; }
    public void setAssignment(Assignment assignment) { this.assignment = assignment; }
    public ReferenceSolutionRevision getReferenceSolutionRevision() { return referenceSolutionRevision; }
    public void setReferenceSolutionRevision(ReferenceSolutionRevision referenceSolutionRevision) { this.referenceSolutionRevision = referenceSolutionRevision; }
    public Integer getRevisionNumber() { return revisionNumber; }
    public void setRevisionNumber(Integer revisionNumber) { this.revisionNumber = revisionNumber; }
    public RevisionStatus getStatus() { return status; }
    public void setStatus(RevisionStatus status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getActivatedAt() { return activatedAt; }
    public void setActivatedAt(Instant activatedAt) { this.activatedAt = activatedAt; }
    public String getFailureMessage() { return failureMessage; }
    public void setFailureMessage(String failureMessage) { this.failureMessage = failureMessage; }
    public Instant getArtifactsPurgedAt() { return artifactsPurgedAt; }
    public void setArtifactsPurgedAt(Instant artifactsPurgedAt) { this.artifactsPurgedAt = artifactsPurgedAt; }
}
