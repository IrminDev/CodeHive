package com.github.codehive.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.ReevaluationBatch;

public interface ReevaluationBatchRepository extends JpaRepository<ReevaluationBatch, UUID> {
    Optional<ReevaluationBatch> findByAssignmentIdAndTestSuiteRevisionId(
            UUID assignmentId, UUID testSuiteRevisionId);
    Optional<ReevaluationBatch> findTopByAssignmentIdOrderByCreatedAtDesc(UUID assignmentId);
}
