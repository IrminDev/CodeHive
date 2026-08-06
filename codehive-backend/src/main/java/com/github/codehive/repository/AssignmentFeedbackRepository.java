package com.github.codehive.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.AssignmentFeedback;

public interface AssignmentFeedbackRepository extends JpaRepository<AssignmentFeedback, UUID> {
    List<AssignmentFeedback> findByStudentWorkIdOrderByCreatedAtAsc(UUID studentWorkId);
}
