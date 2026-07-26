package com.github.codehive.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;

public interface SubmissionRepository extends JpaRepository<Submission, UUID> {
    List<Submission> findByAssignment(Assignment assignment);
    
    List<Submission> findByAssignmentId(UUID assignmentId);

    List<Submission> findByAssignmentIdOrderByCreatedAtDesc(UUID assignmentId);
    
    List<Submission> findByCreatedAtBefore(LocalDateTime date);
    
    List<Submission> findByCreatedAtAfter(LocalDateTime date);
    
    long countByAssignmentId(UUID assignmentId);

    List<Submission> findByAssignmentAndStudentOrderByCreatedAtDesc(Assignment assignment, User student);

    boolean existsByAssignmentIdAndStudentId(UUID assignmentId, UUID studentId);
}
