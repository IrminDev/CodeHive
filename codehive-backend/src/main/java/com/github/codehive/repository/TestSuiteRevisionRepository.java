package com.github.codehive.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.Instant;

import com.github.codehive.model.enums.RevisionStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.TestSuiteRevision;

public interface TestSuiteRevisionRepository extends JpaRepository<TestSuiteRevision, UUID> {
    Optional<TestSuiteRevision> findTopByAssignmentIdOrderByRevisionNumberDesc(UUID assignmentId);
    List<TestSuiteRevision> findByAssignmentIdOrderByRevisionNumberDesc(UUID assignmentId);
    List<TestSuiteRevision> findByStatusAndCreatedAtBefore(RevisionStatus status, Instant createdAt);
    boolean existsByReferenceSolutionRevisionIdAndStatus(UUID referenceSolutionRevisionId,
                                                         RevisionStatus status);
}
