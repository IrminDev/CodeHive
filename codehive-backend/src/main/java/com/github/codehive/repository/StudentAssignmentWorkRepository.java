package com.github.codehive.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.StudentAssignmentWork;

public interface StudentAssignmentWorkRepository extends JpaRepository<StudentAssignmentWork, UUID> {
    Optional<StudentAssignmentWork> findByAssignmentIdAndStudentId(UUID assignmentId, UUID studentId);
    List<StudentAssignmentWork> findByAssignmentId(UUID assignmentId);
}
