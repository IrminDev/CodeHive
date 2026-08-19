package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.Language;
import com.github.codehive.service.GroupService;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.UserRepository;

class StudentSubmissionQueryServiceTest {
    private static final UUID STUDENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID ASSIGNMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID SUBMISSION_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final UUID GROUP_ID = UUID.fromString("00000000-0000-0000-0000-000000000004");

    @Test
    void listsRecentSubmissionsWithLatestExecutionResult() {
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        ExecutionRepository executionRepository = mock(ExecutionRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        GroupService groupService = mock(GroupService.class);
        StudentSubmissionQueryService service = new StudentSubmissionQueryService(
                submissionRepository, executionRepository, userRepository, groupService);

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
        UserRepository userRepository = mock(UserRepository.class);
        GroupService groupService = mock(GroupService.class);
        StudentSubmissionQueryService service = new StudentSubmissionQueryService(
                submissionRepository, executionRepository, userRepository, groupService);

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

        var result = service.listGroupSubmissions(GROUP_ID, student.getEmail());

        assertThat(result).singleElement().satisfies(item -> {
            assertThat(item.assignmentId()).isEqualTo(ASSIGNMENT_ID);
            assertThat(item.submissionId()).isEqualTo(SUBMISSION_ID);
            assertThat(item.deliveredLate()).isTrue();
        });
        verify(groupService).getGroupForAssignmentAccess(GROUP_ID, student);
    }
}
