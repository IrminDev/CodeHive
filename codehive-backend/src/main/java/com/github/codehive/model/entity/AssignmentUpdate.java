package com.github.codehive.model.entity;

import java.time.Instant;
import java.util.UUID;

import com.github.codehive.model.enums.AssignmentUpdateKind;
import com.github.codehive.model.enums.AssignmentUpdateStatus;

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
@Table(name = "assignment_updates")
public class AssignmentUpdate {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reference_solution_revision_id")
    private ReferenceSolutionRevision referenceSolutionRevision;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_suite_revision_id")
    private TestSuiteRevision testSuiteRevision;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private AssignmentUpdateKind kind;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AssignmentUpdateStatus status = AssignmentUpdateStatus.VALIDATING;

    @Column(nullable = false)
    private Long baseAssignmentVersion;

    @Column(columnDefinition = "TEXT")
    private String proposedMetadataJson;

    @Column(columnDefinition = "TEXT")
    private String failureMessage;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    private Instant completedAt;

    public UUID getId() { return id; }
    public Assignment getAssignment() { return assignment; }
    public void setAssignment(Assignment assignment) { this.assignment = assignment; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public ReferenceSolutionRevision getReferenceSolutionRevision() { return referenceSolutionRevision; }
    public void setReferenceSolutionRevision(ReferenceSolutionRevision revision) { this.referenceSolutionRevision = revision; }
    public TestSuiteRevision getTestSuiteRevision() { return testSuiteRevision; }
    public void setTestSuiteRevision(TestSuiteRevision revision) { this.testSuiteRevision = revision; }
    public AssignmentUpdateKind getKind() { return kind; }
    public void setKind(AssignmentUpdateKind kind) { this.kind = kind; }
    public AssignmentUpdateStatus getStatus() { return status; }
    public void setStatus(AssignmentUpdateStatus status) { this.status = status; }
    public Long getBaseAssignmentVersion() { return baseAssignmentVersion; }
    public void setBaseAssignmentVersion(Long baseAssignmentVersion) { this.baseAssignmentVersion = baseAssignmentVersion; }
    public String getProposedMetadataJson() { return proposedMetadataJson; }
    public void setProposedMetadataJson(String proposedMetadataJson) { this.proposedMetadataJson = proposedMetadataJson; }
    public String getFailureMessage() { return failureMessage; }
    public void setFailureMessage(String failureMessage) { this.failureMessage = failureMessage; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
