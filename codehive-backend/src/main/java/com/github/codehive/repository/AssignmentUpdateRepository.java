package com.github.codehive.repository;

import java.util.Optional;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.AssignmentUpdate;
import com.github.codehive.model.enums.AssignmentUpdateStatus;

public interface AssignmentUpdateRepository extends JpaRepository<AssignmentUpdate, UUID> {
    boolean existsByAssignmentIdAndStatus(UUID assignmentId, AssignmentUpdateStatus status);
    Optional<AssignmentUpdate> findByIdAndStatus(UUID id, AssignmentUpdateStatus status);
    List<AssignmentUpdate> findByStatusAndCompletedAtBefore(
            AssignmentUpdateStatus status, Instant completedAt);
    List<AssignmentUpdate> findTop10ByAssignmentIdOrderByCreatedAtDesc(UUID assignmentId);

    @org.springframework.data.jpa.repository.Query(
            "select u.assignment.id from AssignmentUpdate u "
            + "where u.assignment.id in :assignmentIds and u.status = :status")
    java.util.Set<UUID> findAssignmentIdsByStatus(
            @org.springframework.data.repository.query.Param("assignmentIds") java.util.Collection<UUID> assignmentIds,
            @org.springframework.data.repository.query.Param("status") AssignmentUpdateStatus status);
}
