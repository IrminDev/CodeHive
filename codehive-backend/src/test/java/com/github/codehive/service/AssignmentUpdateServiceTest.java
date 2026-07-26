package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.codehive.messaging.producer.TestGenerationRequestProducer;
import com.github.codehive.model.dto.queue.TestGenerationResult;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentUpdate;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.ReferenceSolutionRevision;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AssignmentUpdateKind;
import com.github.codehive.model.enums.AssignmentUpdateStatus;
import com.github.codehive.model.enums.RevisionStatus;
import com.github.codehive.notification.NotificationDomainEventPublisher;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.AssignmentUpdateRepository;
import com.github.codehive.repository.ReferenceSolutionRevisionRepository;
import com.github.codehive.repository.TestCaseRepository;
import com.github.codehive.repository.TestSuiteRevisionRepository;
import com.github.codehive.repository.UserRepository;

class AssignmentUpdateServiceTest {
    private static final UUID ASSIGNMENT_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID UPDATE_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID ACTIVE_REFERENCE_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final UUID CANDIDATE_REFERENCE_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000004");

    @Test
    void failedReferenceValidationLeavesActiveAssignmentUntouched() {
        AssignmentUpdateRepository updateRepository = mock(AssignmentUpdateRepository.class);
        Assignment assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        assignment.setVersion(0L);
        ClassGroup group = new ClassGroup();
        group.setId(UUID.fromString("00000000-0000-0000-0000-000000000005"));
        assignment.setGroup(group);
        User teacher = new User();
        teacher.setId(UUID.fromString("00000000-0000-0000-0000-000000000006"));
        ReferenceSolutionRevision active = new ReferenceSolutionRevision();
        active.setId(ACTIVE_REFERENCE_ID);
        active.setStatus(RevisionStatus.ACTIVE);
        ReferenceSolutionRevision candidate = new ReferenceSolutionRevision();
        candidate.setId(CANDIDATE_REFERENCE_ID);
        candidate.setStatus(RevisionStatus.PROCESSING);
        assignment.setActiveReferenceSolutionRevision(active);

        AssignmentUpdate update = new AssignmentUpdate();
        update.setAssignment(assignment);
        update.setCreatedBy(teacher);
        update.setKind(AssignmentUpdateKind.REFERENCE_ONLY);
        update.setReferenceSolutionRevision(candidate);
        update.setBaseAssignmentVersion(0L);
        update.setProposedMetadataJson("{}");
        when(updateRepository.findByIdAndStatus(
                UPDATE_ID, AssignmentUpdateStatus.VALIDATING)).thenReturn(Optional.of(update));

        AssignmentUpdateService service = new AssignmentUpdateService(
                mock(AssignmentRepository.class), updateRepository,
                mock(ReferenceSolutionRevisionRepository.class),
                mock(TestSuiteRevisionRepository.class), mock(TestCaseRepository.class),
                mock(UserRepository.class), mock(GroupService.class),
                mock(ObjectStorageService.class), mock(TestGenerationRequestProducer.class),
                new ObjectMapper(), mock(AssignmentGradeService.class),
                mock(NotificationDomainEventPublisher.class),
                mock(ApplicationEventPublisher.class));
        TestGenerationResult result = new TestGenerationResult(
                ASSIGNMENT_ID, false, 0, "Reference failed");
        result.setAssignmentUpdateId(UPDATE_ID);
        result.setReferenceSolutionRevisionId(CANDIDATE_REFERENCE_ID);

        service.processValidationResult(result);

        assertThat(update.getStatus()).isEqualTo(AssignmentUpdateStatus.REJECTED);
        assertThat(candidate.getStatus()).isEqualTo(RevisionStatus.FAILED);
        assertThat(assignment.getActiveReferenceSolutionRevision()).isSameAs(active);
        assertThat(active.getStatus()).isEqualTo(RevisionStatus.ACTIVE);
    }
}
