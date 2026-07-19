package com.github.codehive.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.enums.EnrollmentStatus;

public interface GroupEnrollmentRepository extends JpaRepository<GroupEnrollment, UUID> {
    Optional<GroupEnrollment> findByGroupIdAndStudentId(UUID groupId, UUID studentId);
    boolean existsByGroupIdAndStudentIdAndStatus(UUID groupId, UUID studentId, EnrollmentStatus status);
    List<GroupEnrollment> findByGroupIdAndStatusOrderByJoinedAtAsc(UUID groupId, EnrollmentStatus status);
    List<GroupEnrollment> findByStudentIdAndStatus(UUID studentId, EnrollmentStatus status);
}
