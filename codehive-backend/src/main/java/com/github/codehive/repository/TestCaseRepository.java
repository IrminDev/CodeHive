package com.github.codehive.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.TestCase;

public interface TestCaseRepository extends JpaRepository<TestCase, Long> {
    List<TestCase> findByAssignment(Assignment assignment);
    
    List<TestCase> findByAssignmentId(Long assignmentId);
    
    List<TestCase> findByAssignmentOrderByOrderAsc(Assignment assignment);
    
    List<TestCase> findByAssignmentIdOrderByOrderAsc(Long assignmentId);
    
    List<TestCase> findByAssignmentAndIsSample(Assignment assignment, Boolean isSample);
    
    List<TestCase> findByAssignmentIdAndIsSample(Long assignmentId, Boolean isSample);
    
    long countByAssignmentId(Long assignmentId);
}
