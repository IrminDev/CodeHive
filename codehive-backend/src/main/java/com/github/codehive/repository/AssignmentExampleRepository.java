package com.github.codehive.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.AssignmentExample;

public interface AssignmentExampleRepository extends JpaRepository<AssignmentExample, UUID> {
    List<AssignmentExample> findByAssignmentIdOrderByOrderAsc(UUID assignmentId);
}
