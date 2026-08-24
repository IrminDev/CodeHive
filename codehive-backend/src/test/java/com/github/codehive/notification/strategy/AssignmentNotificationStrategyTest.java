package com.github.codehive.notification.strategy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.codehive.model.dto.queue.NotificationMessage;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.TestSuiteRevision;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.Role;
import com.github.codehive.notification.NotificationFormatService;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.AssignmentUpdateRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.TestCaseRepository;
import com.github.codehive.repository.TestSuiteRevisionRepository;

class AssignmentNotificationStrategyTest {
    private static final UUID ASSIGNMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID RECIPIENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID REVISION_ID = UUID.fromString("00000000-0000-0000-0000-000000000004");

    @Test
    void includesStoredValidationDiagnosticInTeacherEmail() {
        AssignmentRepository assignmentRepository = mock(AssignmentRepository.class);
        TestSuiteRevisionRepository revisionRepository = mock(TestSuiteRevisionRepository.class);
        TestCaseRepository testCaseRepository = mock(TestCaseRepository.class);
        AssignmentUpdateRepository updateRepository = mock(AssignmentUpdateRepository.class);
        GroupEnrollmentRepository enrollmentRepository = mock(GroupEnrollmentRepository.class);
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        NotificationFormatService format = mock(NotificationFormatService.class);
        AssignmentNotificationStrategy strategy = new AssignmentNotificationStrategy(
                assignmentRepository, revisionRepository, testCaseRepository, updateRepository,
                enrollmentRepository, submissionRepository, format, new ObjectMapper());

        User teacher = new User("Ada", "Lovelace", "20260001", "ada@example.com", "encoded", Role.TEACHER);
        ClassGroup group = new ClassGroup("Algorithms", null, teacher, "CODE1234");
        Assignment assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        assignment.setTitle("Shortest paths");
        assignment.setGroup(group);
        TestSuiteRevision revision = new TestSuiteRevision();
        revision.setId(REVISION_ID);
        revision.setFailureMessage("Reference solution compilation error:\nMain.java:7: error: ';' expected");

        when(assignmentRepository.findById(ASSIGNMENT_ID)).thenReturn(Optional.of(assignment));
        when(revisionRepository.findById(REVISION_ID)).thenReturn(Optional.of(revision));
        when(format.format(Instant.parse("2026-08-18T12:00:00Z"), teacher))
                .thenReturn("August 18, 2026 at 6:00 AM");
        when(format.teacherAssignmentUrl(ASSIGNMENT_ID))
                .thenReturn("http://localhost:5173/teacher/assignments/" + ASSIGNMENT_ID + "/preview");

        var content = strategy.build(new NotificationMessage(
                UUID.fromString("00000000-0000-0000-0000-000000000003"),
                NotificationType.ASSIGNMENT_VALIDATION_FAILED, RECIPIENT_ID, null, null,
                ASSIGNMENT_ID, null, REVISION_ID, Instant.parse("2026-08-18T12:00:00Z"), 0, 2), teacher);

        assertThat(content.callout().title()).isEqualTo("Validation output");
        assertThat(content.callout().body())
                .contains("Reference solution compilation error:",
                        "Main.java:7: error: ';' expected");
    }

    @Test
    void ownerReminderIncludesSubmittedAndMissingCounts() {
        AssignmentRepository assignmentRepository = mock(AssignmentRepository.class);
        TestSuiteRevisionRepository revisionRepository = mock(TestSuiteRevisionRepository.class);
        TestCaseRepository testCaseRepository = mock(TestCaseRepository.class);
        AssignmentUpdateRepository updateRepository = mock(AssignmentUpdateRepository.class);
        GroupEnrollmentRepository enrollmentRepository = mock(GroupEnrollmentRepository.class);
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        NotificationFormatService format = mock(NotificationFormatService.class);
        AssignmentNotificationStrategy strategy = new AssignmentNotificationStrategy(
                assignmentRepository, revisionRepository, testCaseRepository, updateRepository,
                enrollmentRepository, submissionRepository, format, new ObjectMapper());

        User teacher = new User("Grace", "Hopper", "T-1", "grace@example.com", "encoded", Role.TEACHER);
        User submittedStudent = new User(
                "Ada", "Lovelace", "S-1", "ada@example.com", "encoded", Role.STUDENT);
        submittedStudent.setId(UUID.fromString("00000000-0000-0000-0000-000000000010"));
        User missingStudent = new User(
                "Alan", "Turing", "S-2", "alan@example.com", "encoded", Role.STUDENT);
        missingStudent.setId(UUID.fromString("00000000-0000-0000-0000-000000000011"));
        ClassGroup group = new ClassGroup("Algorithms", null, teacher, "CODE1234");
        Assignment assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        assignment.setTitle("Shortest paths");
        assignment.setGroup(group);
        assignment.setDueDate(Instant.parse("2026-08-23T12:00:00Z"));
        Submission submission = new Submission(assignment, submittedStudent, Language.JAVA, false);

        when(assignmentRepository.findById(ASSIGNMENT_ID)).thenReturn(Optional.of(assignment));
        when(enrollmentRepository.findByGroupIdAndStatusOrderByJoinedAtAsc(
                group.getId(), com.github.codehive.model.enums.EnrollmentStatus.ACTIVE))
                .thenReturn(List.of(
                        new GroupEnrollment(group, submittedStudent),
                        new GroupEnrollment(group, missingStudent)));
        when(submissionRepository.findByAssignmentId(ASSIGNMENT_ID)).thenReturn(List.of(submission));
        when(format.format(assignment.getDueDate(), teacher)).thenReturn("August 23, 2026 at 6:00 AM");
        when(format.remaining(assignment.getDueDate(), Instant.parse("2026-08-22T12:00:00Z")))
                .thenReturn("1 day remaining");

        var content = strategy.build(new NotificationMessage(
                UUID.fromString("00000000-0000-0000-0000-000000000012"),
                NotificationType.ASSIGNMENT_DUE_SOON, RECIPIENT_ID, null, group.getId(),
                ASSIGNMENT_ID, null, null, Instant.parse("2026-08-22T12:00:00Z"), 0, 2), teacher);

        assertThat(content.facts()).hasSizeLessThanOrEqualTo(5)
                .anySatisfy(fact -> assertThat(fact.value()).isEqualTo("1 of 2"))
                .anySatisfy(fact -> assertThat(fact.value()).isEqualTo("1"));
    }
}
