package com.github.codehive.notification.strategy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.github.codehive.model.dto.queue.NotificationMessage;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.enums.Role;
import com.github.codehive.notification.NotificationFormatService;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.SubmissionRepository;

class SubmissionNotificationStrategyTest {
    private static final UUID ASSIGNMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID SUBMISSION_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID EXECUTION_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final UUID STUDENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000004");

    @Test
    void reevaluationUsesExactExecutionAndShowsVerdictChange() {
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        ExecutionRepository executionRepository = mock(ExecutionRepository.class);
        NotificationFormatService format = mock(NotificationFormatService.class);
        SubmissionNotificationStrategy strategy = new SubmissionNotificationStrategy(
                submissionRepository, executionRepository, format);

        User owner = new User("Grace", "Hopper", "T-1", "grace@example.com", "encoded", Role.TEACHER);
        User student = new User("Ada", "Lovelace", "S-1", "ada@example.com", "encoded", Role.STUDENT);
        student.setId(STUDENT_ID);
        Assignment assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        assignment.setTitle("Graph paths");
        assignment.setGroup(new ClassGroup("Algorithms", null, owner, "CODE1234"));
        Submission submission = new Submission(assignment, student, Language.JAVA, false);
        submission.setId(SUBMISSION_ID);
        submission.setCreatedAt(LocalDateTime.of(2026, 8, 22, 16, 0));

        Execution current = new Execution();
        current.setId(EXECUTION_ID);
        current.setSubmission(submission);
        current.setStatus(ExecutionStatus.AC);
        current.setTimeMs(120L);
        current.setMemoryMb(32L);
        current.setCreatedAt(LocalDateTime.of(2026, 8, 22, 17, 0));
        Execution previous = new Execution();
        previous.setStatus(ExecutionStatus.WA);

        when(submissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.of(submission));
        when(submissionRepository.findByAssignmentAndStudentOrderByCreatedAtDesc(assignment, student))
                .thenReturn(List.of(submission));
        when(executionRepository.findById(EXECUTION_ID)).thenReturn(Optional.of(current));
        when(executionRepository.findTopBySubmissionIdAndCreatedAtBeforeOrderByCreatedAtDesc(
                SUBMISSION_ID, current.getCreatedAt())).thenReturn(Optional.of(previous));
        when(format.format(submission.getCreatedAt(), student)).thenReturn("August 22, 2026 at 4:00 PM");
        when(format.submissionReportUrl(ASSIGNMENT_ID, EXECUTION_ID)).thenReturn(
                "https://codehive.example/assignment/" + ASSIGNMENT_ID + "/report/" + EXECUTION_ID);

        NotificationMessage message = new NotificationMessage(
                UUID.fromString("00000000-0000-0000-0000-000000000005"),
                NotificationType.SUBMISSION_REEVALUATED, STUDENT_ID, null,
                assignment.getGroup().getId(), ASSIGNMENT_ID, SUBMISSION_ID, EXECUTION_ID,
                Instant.parse("2026-08-22T23:00:00Z"), 0, 2);

        var content = strategy.build(message, student);

        assertThat(content.facts()).anySatisfy(fact ->
                assertThat(fact.value()).isEqualTo("Accepted (AC)"));
        assertThat(content.callout().body())
                .isEqualTo("Wrong answer (WA) → Accepted (AC)");
        assertThat(content.ctaUrl()).endsWith("/report/" + EXECUTION_ID);
    }
}
