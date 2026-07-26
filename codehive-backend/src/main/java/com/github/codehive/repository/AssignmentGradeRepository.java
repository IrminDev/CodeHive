package com.github.codehive.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.AssignmentGrade;

public interface AssignmentGradeRepository extends JpaRepository<AssignmentGrade, UUID> {
    Optional<AssignmentGrade> findByStudentWorkId(UUID studentWorkId);
    List<AssignmentGrade> findByStudentWorkAssignmentId(UUID assignmentId);
}
