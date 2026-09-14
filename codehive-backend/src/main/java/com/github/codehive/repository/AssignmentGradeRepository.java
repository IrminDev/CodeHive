package com.github.codehive.repository;

import java.util.List;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.github.codehive.model.dto.metrics.StudentGradeRow;
import com.github.codehive.model.entity.AssignmentGrade;
import com.github.codehive.model.enums.GradeStatus;

public interface AssignmentGradeRepository extends JpaRepository<AssignmentGrade, UUID> {
    Optional<AssignmentGrade> findByStudentWorkId(UUID studentWorkId);
    List<AssignmentGrade> findByStudentWorkAssignmentId(UUID assignmentId);
    List<AssignmentGrade> findByStudentWorkAssignmentIdAndStatus(UUID assignmentId, GradeStatus status);
    List<AssignmentGrade> findByStudentWorkIdIn(Collection<UUID> studentWorkIds);

    @Query("""
            select new com.github.codehive.model.dto.metrics.StudentGradeRow(
                work.assignment.id, work.student.id,
                grade.value, grade.maxPointsSnapshot, grade.status)
            from AssignmentGrade grade
            join grade.studentWork work
            where work.assignment.group.id = :groupId and work.assignment.isActive = true
            """)
    List<StudentGradeRow> findGradeRowsByGroupId(@Param("groupId") UUID groupId);

    @Query("""
            select new com.github.codehive.model.dto.metrics.StudentGradeRow(
                work.assignment.id, work.student.id,
                grade.value, grade.maxPointsSnapshot, grade.status)
            from AssignmentGrade grade
            join grade.studentWork work
            where work.assignment.id = :assignmentId
            """)
    List<StudentGradeRow> findGradeRowsByAssignmentId(@Param("assignmentId") UUID assignmentId);
}
