package com.github.codehive.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.Test;
import com.github.codehive.model.entity.*;
import com.github.codehive.model.enums.*;
import com.github.codehive.model.dto.metrics.StudentGradeRow;
import com.github.codehive.repository.*;

class OwnerStudentMetricsServiceTest {
    private static final UUID OWNER = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID STUDENT = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID GROUP = UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final UUID ASSIGNMENT = UUID.fromString("00000000-0000-0000-0000-000000000004");
    private static final UUID OTHER = UUID.fromString("00000000-0000-0000-0000-000000000005");
    private final ClassGroupRepository groups = mock(ClassGroupRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final GroupEnrollmentRepository enrollments = mock(GroupEnrollmentRepository.class);
    private final AssignmentRepository assignments = mock(AssignmentRepository.class);
    private final AssignmentGradeRepository grades = mock(AssignmentGradeRepository.class);
    private final GroupMetricsService service = new GroupMetricsService(groups, users, enrollments, assignments,
            mock(StudentAssignmentWorkRepository.class), mock(SubmissionRepository.class), mock(ExecutionRepository.class), grades);

    private Assignment fixture() {
        var owner = new User(); owner.setId(OWNER);
        var student = new User(); student.setId(STUDENT);
        var other = new User(); other.setId(OTHER);
        var group = new ClassGroup(); group.setId(GROUP); group.setOwner(owner); group.setIsActive(true);
        when(users.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(users.findByEmail("student@example.com")).thenReturn(Optional.of(student));
        when(groups.findById(GROUP)).thenReturn(Optional.of(group));
        when(enrollments.findByGroupIdAndStatusOrderByJoinedAtAsc(GROUP, EnrollmentStatus.ACTIVE))
                .thenReturn(List.of(new GroupEnrollment(group, student), new GroupEnrollment(group, other)));
        var assignment = new Assignment(); assignment.setId(ASSIGNMENT); assignment.setTitle("Loops");
        assignment.setValidationStatus(AssignmentValidationStatus.READY); assignment.setMaxPoints(BigDecimal.TEN);
        when(assignments.findByGroupIdAndIsActiveTrueOrderByCreatedAtDesc(GROUP)).thenReturn(List.of(assignment));
        when(grades.findGradeRowsByGroupId(GROUP)).thenReturn(List.of(
                new StudentGradeRow(ASSIGNMENT, STUDENT, BigDecimal.ONE, BigDecimal.TEN, GradeStatus.DRAFT),
                new StudentGradeRow(ASSIGNMENT, OTHER, BigDecimal.TEN, BigDecimal.TEN, GradeStatus.RETURNED)));
        return assignment;
    }

    @Test void ownerGetsSelectedStudentsDraftsAndUnpublishedWorkOnly() {
        fixture().setLaunchDate(Instant.parse("2099-01-01T00:00:00Z"));
        var rows = service.studentAssignmentMetrics(GROUP, STUDENT, "owner@example.com");
        assertThat(rows).hasSize(1);
        assertThat(rows.getFirst().grade().value()).isEqualByComparingTo(BigDecimal.ONE);
        assertThat(rows.getFirst().grade().status()).isEqualTo(GradeStatus.DRAFT);
        assertThat(rows.getFirst().attempts()).isZero();
    }
    @Test void studentSelfViewStillHidesDraftGrades() {
        fixture();
        when(enrollments.existsByGroupIdAndStudentIdAndStatus(GROUP, STUDENT, EnrollmentStatus.ACTIVE)).thenReturn(true);
        assertThat(service.myAssignmentMetrics(GROUP, "student@example.com").getFirst().grade()).isNull();
    }
    @Test void nonOwnerCannotReadStudentGrades() {
        fixture();
        assertThatThrownBy(() -> service.studentAssignmentMetrics(GROUP, STUDENT, "student@example.com"))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        verifyNoInteractions(assignments, grades);
    }
    @Test void studentOutsideActiveRosterCannotReadAsSelectedStudent() {
        fixture();
        assertThatThrownBy(() -> service.studentAssignmentMetrics(GROUP, OWNER, "owner@example.com"))
                .isInstanceOf(com.github.codehive.model.exception.EntityNotFoundException.class);
    }
}
