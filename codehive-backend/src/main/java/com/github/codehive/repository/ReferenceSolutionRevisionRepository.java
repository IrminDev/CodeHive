package com.github.codehive.repository;

import java.util.List;
import java.util.UUID;
import java.time.Instant;

import com.github.codehive.model.enums.RevisionStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.ReferenceSolutionRevision;

public interface ReferenceSolutionRevisionRepository extends JpaRepository<ReferenceSolutionRevision, UUID> {
    List<ReferenceSolutionRevision> findByAssignmentIdOrderByCreatedAtDesc(UUID assignmentId);
    List<ReferenceSolutionRevision> findByStatusAndCreatedAtBefore(RevisionStatus status, Instant createdAt);
}
