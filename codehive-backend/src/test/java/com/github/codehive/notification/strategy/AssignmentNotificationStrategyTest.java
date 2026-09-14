package com.github.codehive.notification.strategy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.github.codehive.model.dto.queue.NotificationMessage;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.TestSuiteRevision;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.enums.RevisionStatus;
import com.github.codehive.model.enums.Role;
import com.github.codehive.notification.NotificationFormatService;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.TestSuiteRevisionRepository;

class AssignmentNotificationStrategyTest {
    private static final UUID ASSIGNMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID RECIPIENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @Test
    void includesStoredValidationDiagnosticInTeacherEmail() {
        AssignmentRepository assignmentRepository = mock(AssignmentRepository.class);
        TestSuiteRevisionRepository revisionRepository = mock(TestSuiteRevisionRepository.class);
        NotificationFormatService format = mock(NotificationFormatService.class);
        AssignmentNotificationStrategy strategy = new AssignmentNotificationStrategy(
                assignmentRepository, revisionRepository, format);

        User teacher = new User("Ada", "Lovelace", "20260001", "ada@example.com", "encoded", Role.TEACHER);
        ClassGroup group = new ClassGroup("Algorithms", null, teacher, "CODE1234");
        Assignment assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        assignment.setTitle("Shortest paths");
        assignment.setGroup(group);
        TestSuiteRevision revision = new TestSuiteRevision();
        revision.setFailureMessage("Reference solution compilation error:\nMain.java:7: error: ';' expected");

        when(assignmentRepository.findById(ASSIGNMENT_ID)).thenReturn(Optional.of(assignment));
        when(revisionRepository.findTopByAssignmentIdAndStatusOrderByRevisionNumberDesc(
                ASSIGNMENT_ID, RevisionStatus.FAILED)).thenReturn(Optional.of(revision));
        when(format.format(null, teacher)).thenReturn("Not configured");
        when(format.teacherDashboardUrl()).thenReturn("http://localhost:5173/teacher");

        var content = strategy.build(new NotificationMessage(
                UUID.fromString("00000000-0000-0000-0000-000000000003"),
                NotificationType.ASSIGNMENT_VALIDATION_FAILED, RECIPIENT_ID, null, null,
                ASSIGNMENT_ID, null, Instant.parse("2026-08-18T12:00:00Z"), 0, 1), teacher);

        assertThat(content.detailLines())
                .contains("Validation output:",
                        "  Reference solution compilation error:",
                        "  Main.java:7: error: ';' expected");
    }
}
