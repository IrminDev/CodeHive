package com.github.codehive.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.Submission;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByAssignment(Assignment assignment);
    
    List<Submission> findByAssignmentId(Long assignmentId);
    
    List<Submission> findByAssignmentIdOrderByCreatedAtDesc(Long assignmentId);
    
    List<Submission> findByCreatedAtBefore(LocalDateTime date);
    
    List<Submission> findByCreatedAtAfter(LocalDateTime date);
    
    long countByAssignmentId(Long assignmentId);
}
