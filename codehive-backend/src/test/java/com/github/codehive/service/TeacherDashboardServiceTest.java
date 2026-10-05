package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;

import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.SubmissionStatus;
import com.github.codehive.repository.AssignmentGradeRepository;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.StudentAssignmentWorkRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.UserRepository;

class TeacherDashboardServiceTest {
    private static final UUID TEACHER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID GROUP_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID ASSIGNMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final UUID STUDENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000004");
    private static final UUID SUBMISSION_ID = UUID.fromString("00000000-0000-0000-0000-000000000005");

    @Test
    void listsOnlyCurrentLatestSubmissionForEachStudentAssignment() {
        UserRepository userRepository = mock(UserRepository.class);
        ClassGroupRepository groupRepository = mock(ClassGroupRepository.class);
        GroupEnrollmentRepository enrollmentRepository = mock(GroupEnrollmentRepository.class);
        AssignmentRepository assignmentRepository = mock(AssignmentRepository.class);
        StudentAssignmentWorkRepository workRepository = mock(StudentAssignmentWorkRepository.class);
        AssignmentGradeRepository gradeRepository = mock(AssignmentGradeRepository.class);
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        ExecutionRepository executionRepository = mock(ExecutionRepository.class);
        TeacherDashboardService service = new TeacherDashboardService(
                userRepository, groupRepository, enrollmentRepository, assignmentRepository,
                workRepository, gradeRepository, submissionRepository, executionRepository);

        User teacher = user(TEACHER_ID, "teacher@example.com", "Teacher", "One");
        User student = user(STUDENT_ID, "student@example.com", "Student", "One");
        ClassGroup group = new ClassGroup();
        group.setId(GROUP_ID);
        group.setName("Algorithms");
        Assignment assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        assignment.setGroup(group);
        assignment.setTitle("Grid Paths");
        assignment.setValidationStatus(AssignmentValidationStatus.READY);
        Submission current = new Submission();
        current.setId(SUBMISSION_ID);
        current.setAssignment(assignment);
        current.setStudent(student);
        current.setLanguage(Language.PYTHON);
        current.setStatus(SubmissionStatus.SUBMITTED);
        current.setCreatedAt(LocalDateTime.of(2026, 8, 21, 10, 0));

        when(userRepository.findByEmail(teacher.getEmail())).thenReturn(Optional.of(teacher));
        when(groupRepository.findByOwnerIdAndIsActiveTrueOrderByCreatedAtDesc(TEACHER_ID)).thenReturn(List.of(group));
        when(assignmentRepository.findByGroupIdAndIsActiveTrueOrderByCreatedAtDesc(GROUP_ID)).thenReturn(List.of(assignment));
        when(workRepository.findByAssignmentIdIn(List.of(ASSIGNMENT_ID))).thenReturn(List.of());
        when(enrollmentRepository.findByGroupIdAndStatusOrderByJoinedAtAsc(GROUP_ID, EnrollmentStatus.ACTIVE)).thenReturn(List.of());
        when(submissionRepository.findLatestSubmittedByAssignmentGroupOwnerId(
                TEACHER_ID, SubmissionStatus.SUBMITTED, PageRequest.of(0, 10))).thenReturn(List.of(current));
        when(executionRepository.findTopBySubmissionIdOrderByCreatedAtDesc(SUBMISSION_ID)).thenReturn(Optional.empty());

        var result = service.get(teacher.getEmail());

        assertThat(result.recentSubmissions()).singleElement().satisfies(item -> {
            assertThat(item.submissionId()).isEqualTo(SUBMISSION_ID);
            assertThat(item.assignmentId()).isEqualTo(ASSIGNMENT_ID);
            assertThat(item.studentId()).isEqualTo(STUDENT_ID);
        });
        verify(submissionRepository).findLatestSubmittedByAssignmentGroupOwnerId(
                TEACHER_ID, SubmissionStatus.SUBMITTED, PageRequest.of(0, 10));
    }

    private User user(UUID id, String email, String name, String lastName) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setName(name);
        user.setLastName(lastName);
        return user;
    }
}
