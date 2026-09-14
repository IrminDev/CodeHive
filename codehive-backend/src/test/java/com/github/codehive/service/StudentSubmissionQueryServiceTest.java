package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.Instant;
import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;

import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.SubmissionStatus;
import com.github.codehive.service.GroupService;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.UserRepository;

class StudentSubmissionQueryServiceTest {
    private static final UUID STUDENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID ASSIGNMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID SUBMISSION_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final UUID GROUP_ID = UUID.fromString("00000000-0000-0000-0000-000000000004");
    private static final UUID EXECUTION_ID = UUID.fromString("00000000-0000-0000-0000-000000000005");

    @Test
    void listsRecentSubmissionsWithLatestExecutionResult() {
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        ExecutionRepository executionRepository = mock(ExecutionRepository.class);
        AssignmentRepository assignmentRepository = mock(AssignmentRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        GroupService groupService = mock(GroupService.class);
        StudentSubmissionQueryService service = new StudentSubmissionQueryService(
                submissionRepository, executionRepository, assignmentRepository,
                userRepository, groupService);

        User student = new User();
        student.setId(STUDENT_ID);
        student.setEmail("student@example.com");
        Assignment assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        assignment.setTitle("Grid Escape");
        Submission submission = new Submission();
        submission.setId(SUBMISSION_ID);
        submission.setStudent(student);
        submission.setAssignment(assignment);
        submission.setLanguage(Language.PYTHON);
        Execution execution = new Execution();
        execution.setStatus(ExecutionStatus.AC);
        execution.setTimeMs(14L);

        when(userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        when(submissionRepository.findByStudentIdOrderByCreatedAtDesc(STUDENT_ID)).thenReturn(List.of(submission));
        when(executionRepository.findTopBySubmissionIdOrderByCreatedAtDesc(SUBMISSION_ID)).thenReturn(Optional.of(execution));

        var result = service.listRecent(student.getEmail(), 5);

        assertThat(result).singleElement().satisfies(item -> {
            assertThat(item.assignmentId()).isEqualTo(ASSIGNMENT_ID);
            assertThat(item.assignmentTitle()).isEqualTo("Grid Escape");
            assertThat(item.executionStatus()).isEqualTo(ExecutionStatus.AC);
            assertThat(item.timeMs()).isEqualTo(14L);
        });
    }

    @Test
    void listsOnlyLatestCurrentSubmissionForEachGroupAssignment() {
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        ExecutionRepository executionRepository = mock(ExecutionRepository.class);
        AssignmentRepository assignmentRepository = mock(AssignmentRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        GroupService groupService = mock(GroupService.class);
        StudentSubmissionQueryService service = new StudentSubmissionQueryService(
                submissionRepository, executionRepository, assignmentRepository,
                userRepository, groupService);

        User student = new User();
        student.setId(STUDENT_ID);
        student.setEmail("student@example.com");
        Assignment assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        Submission submission = new Submission();
        submission.setId(SUBMISSION_ID);
        submission.setStudent(student);
        submission.setAssignment(assignment);
        submission.setDeliveredLate(true);
        when(userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        when(submissionRepository.findByStudentIdAndAssignmentGroupIdAndStatusOrderByCreatedAtDesc(
                STUDENT_ID, GROUP_ID, com.github.codehive.model.enums.SubmissionStatus.SUBMITTED))
                .thenReturn(List.of(submission));
        when(executionRepository.findResultRowsBySubmissionIds(List.of(SUBMISSION_ID)))
                .thenReturn(List.of(new com.github.codehive.model.dto.metrics.SubmissionResultRow(
                        SUBMISSION_ID, ExecutionStatus.WA, 12L, 18L,
                        LocalDateTime.of(2026, 8, 18, 22, 0))));

        var result = service.listGroupSubmissions(GROUP_ID, student.getEmail());

        assertThat(result).singleElement().satisfies(item -> {
            assertThat(item.assignmentId()).isEqualTo(ASSIGNMENT_ID);
            assertThat(item.submissionId()).isEqualTo(SUBMISSION_ID);
            assertThat(item.deliveredLate()).isTrue();
            assertThat(item.executionStatus()).isEqualTo(ExecutionStatus.WA);
        });
        verify(groupService).getGroupForAssignmentAccess(GROUP_ID, student);
    }

    @Test
    void listsAssignmentHistoryWithPersistedExecutionSummaryAndReportAvailability() {
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        ExecutionRepository executionRepository = mock(ExecutionRepository.class);
        AssignmentRepository assignmentRepository = mock(AssignmentRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        GroupService groupService = mock(GroupService.class);
        StudentSubmissionQueryService service = new StudentSubmissionQueryService(
                submissionRepository, executionRepository, assignmentRepository,
                userRepository, groupService);

        User student = new User();
        student.setId(STUDENT_ID);
        student.setEmail("student@example.com");
        ClassGroup group = new ClassGroup();
        group.setId(GROUP_ID);
        Assignment assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        assignment.setGroup(group);
        assignment.setIsActive(true);
        Submission submission = new Submission();
        submission.setId(SUBMISSION_ID);
        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setLanguage(Language.CPP);
        submission.setStatus(SubmissionStatus.WITHDRAWN);
        submission.setDeliveredLate(true);
        submission.setWithdrawnAt(Instant.parse("2026-08-18T22:00:00Z"));
        Execution execution = new Execution();
        execution.setId(EXECUTION_ID);
        execution.setSubmission(submission);
        execution.setStatus(ExecutionStatus.WA);
        execution.setTimeMs(25L);
        execution.setMemoryMb(18L);

        when(userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        when(assignmentRepository.findById(ASSIGNMENT_ID)).thenReturn(Optional.of(assignment));
        when(submissionRepository.findByAssignmentAndStudentOrderByCreatedAtDesc(assignment, student))
                .thenReturn(List.of(submission));
        when(executionRepository.findLatestCandidatesBySubmissionIds(List.of(SUBMISSION_ID)))
                .thenReturn(List.of(execution));

        var result = service.listAssignmentHistory(ASSIGNMENT_ID, student.getEmail());

        assertThat(result).singleElement().satisfies(item -> {
            assertThat(item.submissionId()).isEqualTo(SUBMISSION_ID);
            assertThat(item.submissionStatus()).isEqualTo(SubmissionStatus.WITHDRAWN);
            assertThat(item.executionId()).isEqualTo(EXECUTION_ID);
            assertThat(item.executionStatus()).isEqualTo(ExecutionStatus.WA);
            assertThat(item.timeMs()).isEqualTo(25L);
            assertThat(item.memoryMb()).isEqualTo(18L);
            assertThat(item.reportAvailable()).isTrue();
        });
        verify(groupService).getGroupForAssignmentAccess(GROUP_ID, student);
    }

    @Test
    void marksPurgedHistoryReportUnavailableWithoutLosingSummary() {
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        ExecutionRepository executionRepository = mock(ExecutionRepository.class);
        AssignmentRepository assignmentRepository = mock(AssignmentRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        GroupService groupService = mock(GroupService.class);
        StudentSubmissionQueryService service = new StudentSubmissionQueryService(
                submissionRepository, executionRepository, assignmentRepository,
                userRepository, groupService);

        User student = new User();
        student.setId(STUDENT_ID);
        student.setEmail("student@example.com");
        ClassGroup group = new ClassGroup();
        group.setId(GROUP_ID);
        Assignment assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        assignment.setGroup(group);
        assignment.setIsActive(true);
        Submission submission = new Submission();
        submission.setId(SUBMISSION_ID);
        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setLanguage(Language.PYTHON);
        Execution execution = new Execution();
        execution.setId(EXECUTION_ID);
        execution.setSubmission(submission);
        execution.setStatus(ExecutionStatus.AC);
        execution.setArtifactsExpireAt(Instant.now().plusSeconds(3600));
        execution.setArtifactsPurgedAt(Instant.now());

        when(userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        when(assignmentRepository.findById(ASSIGNMENT_ID)).thenReturn(Optional.of(assignment));
        when(submissionRepository.findByAssignmentAndStudentOrderByCreatedAtDesc(assignment, student))
                .thenReturn(List.of(submission));
        when(executionRepository.findLatestCandidatesBySubmissionIds(List.of(SUBMISSION_ID)))
                .thenReturn(List.of(execution));

        var result = service.listAssignmentHistory(ASSIGNMENT_ID, student.getEmail());

        assertThat(result).singleElement().satisfies(item -> {
            assertThat(item.executionStatus()).isEqualTo(ExecutionStatus.AC);
            assertThat(item.reportAvailable()).isFalse();
        });
    }
}
