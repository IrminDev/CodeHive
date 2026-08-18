package com.github.codehive.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.github.codehive.model.dto.metrics.CurrentSubmissionRow;
import com.github.codehive.model.entity.StudentAssignmentWork;

public interface StudentAssignmentWorkRepository extends JpaRepository<StudentAssignmentWork, UUID> {
    Optional<StudentAssignmentWork> findByAssignmentIdAndStudentId(UUID assignmentId, UUID studentId);
    List<StudentAssignmentWork> findByAssignmentId(UUID assignmentId);

    @Query("""
            select new com.github.codehive.model.dto.metrics.CurrentSubmissionRow(
                work.assignment.id, work.student.id, work.status,
                submission.id, submission.deliveredLate, submission.createdAt, submission.language)
            from StudentAssignmentWork work
            join work.currentSubmission submission
            where work.assignment.group.id = :groupId and work.assignment.isActive = true
            """)
    List<CurrentSubmissionRow> findCurrentSubmissionRowsByGroupId(@Param("groupId") UUID groupId);

    @Query("""
            select new com.github.codehive.model.dto.metrics.CurrentSubmissionRow(
                work.assignment.id, work.student.id, work.status,
                submission.id, submission.deliveredLate, submission.createdAt, submission.language)
            from StudentAssignmentWork work
            join work.currentSubmission submission
            where work.assignment.id = :assignmentId
            """)
    List<CurrentSubmissionRow> findCurrentSubmissionRowsByAssignmentId(@Param("assignmentId") UUID assignmentId);
}
