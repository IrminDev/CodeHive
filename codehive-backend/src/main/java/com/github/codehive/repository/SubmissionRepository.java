package com.github.codehive.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import com.github.codehive.model.dto.metrics.SubmissionAttemptCount;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.SubmissionStatus;

public interface SubmissionRepository extends JpaRepository<Submission, UUID> {
    List<Submission> findByAssignment(Assignment assignment);
    
    List<Submission> findByAssignmentId(UUID assignmentId);

    List<Submission> findByAssignmentIdOrderByCreatedAtDesc(UUID assignmentId);
    
    List<Submission> findByCreatedAtBefore(LocalDateTime date);
    
    List<Submission> findByCreatedAtAfter(LocalDateTime date);
    
    long countByAssignmentId(UUID assignmentId);

    List<Submission> findByAssignmentAndStudentOrderByCreatedAtDesc(Assignment assignment, User student);

    List<Submission> findByStudentIdOrderByCreatedAtDesc(UUID studentId);
    List<Submission> findTop10ByAssignmentGroupOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    @Query("""
            select submission
            from Submission submission
            where submission.assignment.group.owner.id = :ownerId
              and submission.status = :status
              and not exists (
                  select 1
                  from Submission newer
                  where newer.assignment.id = submission.assignment.id
                    and newer.student.id = submission.student.id
                    and newer.status = :status
                    and newer.createdAt > submission.createdAt
              )
            order by submission.createdAt desc
            """)
    List<Submission> findLatestSubmittedByAssignmentGroupOwnerId(
            @Param("ownerId") UUID ownerId,
            @Param("status") SubmissionStatus status,
            Pageable pageable);

    List<Submission> findByStudentIdAndAssignmentGroupIdAndStatusOrderByCreatedAtDesc(
            UUID studentId, UUID groupId, SubmissionStatus status);

    boolean existsByAssignmentIdAndStudentId(UUID assignmentId, UUID studentId);

    @Modifying(flushAutomatically = true)
    @Query("""
            update Submission submission
            set submission.deliveredLate = false
            where submission.assignment.id = :assignmentId
              and submission.deliveredLate = true
              and submission.createdAt <= :newDueDate
            """)
    int markLateSubmissionsOnTimeThrough(
            @Param("assignmentId") UUID assignmentId,
            @Param("newDueDate") LocalDateTime newDueDate);

    @Modifying(flushAutomatically = true)
    @Query("""
            update Submission submission
            set submission.deliveredLate = false
            where submission.assignment.id = :assignmentId
              and submission.deliveredLate = true
            """)
    int markAllLateSubmissionsOnTime(@Param("assignmentId") UUID assignmentId);

    @Query("""
            select new com.github.codehive.model.dto.metrics.SubmissionAttemptCount(
                submission.assignment.id, submission.student.id, count(submission))
            from Submission submission
            where submission.assignment.group.id = :groupId
              and submission.assignment.isActive = true
            group by submission.assignment.id, submission.student.id
            """)
    List<SubmissionAttemptCount> countAttemptsByGroupId(@Param("groupId") UUID groupId);

    @Query("""
            select new com.github.codehive.model.dto.metrics.SubmissionAttemptCount(
                submission.assignment.id, submission.student.id, count(submission))
            from Submission submission
            where submission.assignment.id = :assignmentId
            group by submission.assignment.id, submission.student.id
            """)
    List<SubmissionAttemptCount> countAttemptsByAssignmentId(@Param("assignmentId") UUID assignmentId);
}
