package com.github.codehive.messaging.listener;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.github.codehive.model.dto.queue.TestGenerationResult;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.ReferenceSolutionRevision;
import com.github.codehive.model.entity.TestSuiteRevision;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.RevisionStatus;
import com.github.codehive.model.enums.Role;
import com.github.codehive.notification.NotificationDomainEventPublisher;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.TestSuiteRevisionRepository;
import com.github.codehive.service.AssignmentUpdateService;

class TestGenerationResultListenerTest {
    private static final UUID ASSIGNMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID REVISION_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @Test
    void storesWorkerCompilationDiagnosticOnFailedRevision() {
        AssignmentRepository assignmentRepository = mock(AssignmentRepository.class);
        TestSuiteRevisionRepository revisionRepository = mock(TestSuiteRevisionRepository.class);
        AssignmentUpdateService updateService = mock(AssignmentUpdateService.class);
        NotificationDomainEventPublisher notificationPublisher = mock(NotificationDomainEventPublisher.class);
        TestGenerationResultListener listener = new TestGenerationResultListener(
                assignmentRepository, revisionRepository, updateService, notificationPublisher);

        User teacher = new User("Ada", "Lovelace", "20260001", "ada@example.com", "encoded", Role.TEACHER);
        teacher.setId(UUID.fromString("00000000-0000-0000-0000-000000000003"));
        ClassGroup group = new ClassGroup("Algorithms", null, teacher, "CODE1234");
        group.setId(UUID.fromString("00000000-0000-0000-0000-000000000004"));
        Assignment assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        assignment.setGroup(group);
        assignment.setAuthor(teacher);
        assignment.setValidationStatus(AssignmentValidationStatus.PROCESSING);
        ReferenceSolutionRevision referenceRevision = new ReferenceSolutionRevision();
        TestSuiteRevision revision = new TestSuiteRevision();
        revision.setId(REVISION_ID);
        revision.setAssignment(assignment);
        revision.setReferenceSolutionRevision(referenceRevision);

        when(assignmentRepository.findById(ASSIGNMENT_ID)).thenReturn(Optional.of(assignment));
        when(revisionRepository.findById(REVISION_ID)).thenReturn(Optional.of(revision));
        TestGenerationResult result = new TestGenerationResult(ASSIGNMENT_ID, false, 0,
                "Reference solution compilation error:\nMain.java:7: error: ';' expected");
        result.setTestSuiteRevisionId(REVISION_ID);

        listener.handleTestGenerationResult(result);

        assertThat(revision.getStatus()).isEqualTo(RevisionStatus.FAILED);
        assertThat(revision.getFailureMessage()).contains("Main.java:7: error: ';' expected");
        assertThat(assignment.getValidationStatus()).isEqualTo(AssignmentValidationStatus.FAILED);
    }
}
