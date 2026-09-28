package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.TestSuiteRevision;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.AssignmentUpdateRepository;
import com.github.codehive.repository.ReevaluationBatchRepository;
import com.github.codehive.repository.TestSuiteRevisionRepository;
import com.github.codehive.repository.UserRepository;

class TeacherAssignmentStatusServiceTest {
    private static final UUID ASSIGNMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID OWNER_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID OTHER_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");

    private AssignmentUpdateRepository updateRepository;
    private ReevaluationBatchRepository reevaluationRepository;
    private TestSuiteRevisionRepository revisionRepository;
    private UserRepository userRepository;
    private TeacherAssignmentStatusService service;
    private Assignment assignment;

    @BeforeEach
    void setUp() {
        AssignmentRepository assignmentRepository = mock(AssignmentRepository.class);
        updateRepository = mock(AssignmentUpdateRepository.class);
        reevaluationRepository = mock(ReevaluationBatchRepository.class);
        revisionRepository = mock(TestSuiteRevisionRepository.class);
        userRepository = mock(UserRepository.class);
        service = new TeacherAssignmentStatusService(assignmentRepository, updateRepository,
                reevaluationRepository, revisionRepository, userRepository);

        User owner = user(OWNER_ID, "owner@example.com");
        ClassGroup group = new ClassGroup();
        group.setOwner(owner);
        assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        assignment.setGroup(group);
        assignment.setValidationStatus(AssignmentValidationStatus.FAILED);
        when(assignmentRepository.findById(ASSIGNMENT_ID)).thenReturn(Optional.of(assignment));
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
    }

    @Test
    void returnsLatestValidationFailureAndEmptyOperationHistory() {
        TestSuiteRevision revision = new TestSuiteRevision();
        revision.setFailureMessage("Reference solution compilation failed");
        when(revisionRepository.findTopByAssignmentIdOrderByRevisionNumberDesc(ASSIGNMENT_ID))
                .thenReturn(Optional.of(revision));
        when(updateRepository.findTop10ByAssignmentIdOrderByCreatedAtDesc(ASSIGNMENT_ID)).thenReturn(List.of());
        when(reevaluationRepository.findTopByAssignmentIdOrderByCreatedAtDesc(ASSIGNMENT_ID))
                .thenReturn(Optional.empty());

        var result = service.get(ASSIGNMENT_ID, "owner@example.com");

        assertThat(result.assignmentId()).isEqualTo(ASSIGNMENT_ID);
        assertThat(result.validationStatus()).isEqualTo(AssignmentValidationStatus.FAILED);
        assertThat(result.validationFailureMessage()).isEqualTo("Reference solution compilation failed");
        assertThat(result.updates()).isEmpty();
        assertThat(result.reevaluation()).isNull();
    }

    @Test
    void rejectsNonOwnerBeforeLoadingPrivateManagementHistory() {
        User other = user(OTHER_ID, "other@example.com");
        when(userRepository.findByEmail(other.getEmail())).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> service.get(ASSIGNMENT_ID, other.getEmail()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("owner");

        verify(revisionRepository, never()).findTopByAssignmentIdOrderByRevisionNumberDesc(ASSIGNMENT_ID);
        verify(updateRepository, never()).findTop10ByAssignmentIdOrderByCreatedAtDesc(ASSIGNMENT_ID);
    }

    private User user(UUID id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        return user;
    }
}
