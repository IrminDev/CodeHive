package com.github.codehive.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

import com.github.codehive.model.entity.AssignmentAiPolicy;

public interface AssignmentAiPolicyRepository extends JpaRepository<AssignmentAiPolicy, UUID> {
    @Query(value = "select * from assignment_ai_policies where assignment_id = :id for update", nativeQuery = true)
    Optional<AssignmentAiPolicy> findByIdForUpdate(@Param("id") UUID id);
}
