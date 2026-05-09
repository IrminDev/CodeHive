package com.github.codehive.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.TestCase;

public interface TestCaseRepository extends JpaRepository<TestCase, UUID> {
    List<TestCase> findByAssignment(Assignment assignment);
    
    List<TestCase> findByAssignmentId(UUID assignmentId);

    List<TestCase> findByAssignmentOrderByOrderAsc(Assignment assignment);

    List<TestCase> findByAssignmentIdOrderByOrderAsc(UUID assignmentId);

    List<TestCase> findByAssignmentAndIsSample(Assignment assignment, Boolean isSample);

    List<TestCase> findByAssignmentIdAndIsSample(UUID assignmentId, Boolean isSample);

    long countByAssignmentId(UUID assignmentId);
}
