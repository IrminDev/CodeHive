package com.github.codehive.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.github.codehive.model.dto.metrics.EnrollmentStatusCount;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.enums.EnrollmentStatus;

public interface GroupEnrollmentRepository extends JpaRepository<GroupEnrollment, UUID> {
    Optional<GroupEnrollment> findByGroupIdAndStudentId(UUID groupId, UUID studentId);
    boolean existsByGroupIdAndStudentIdAndStatus(UUID groupId, UUID studentId, EnrollmentStatus status);
    List<GroupEnrollment> findByGroupIdAndStatusOrderByJoinedAtAsc(UUID groupId, EnrollmentStatus status);
    List<GroupEnrollment> findByStudentIdAndStatus(UUID studentId, EnrollmentStatus status);
    Page<GroupEnrollment> findByStudentId(UUID studentId, Pageable pageable);
    long countByStudentId(UUID studentId);
    long countByStudentIdAndStatus(UUID studentId, EnrollmentStatus status);

    @Query("""
            select new com.github.codehive.model.dto.metrics.EnrollmentStatusCount(
                enrollment.status, count(enrollment))
            from GroupEnrollment enrollment
            where enrollment.group.id = :groupId
              and enrollment.student.isActive = true
              and enrollment.student.blocked = false
            group by enrollment.status
            """)
    List<EnrollmentStatusCount> countByGroupIdGroupedByStatus(@Param("groupId") UUID groupId);
}
