package com.github.codehive.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.AssignmentGradeHistory;

public interface AssignmentGradeHistoryRepository extends JpaRepository<AssignmentGradeHistory, UUID> {
    List<AssignmentGradeHistory> findByStudentWorkIdOrderByCreatedAtDesc(UUID studentWorkId);
}
