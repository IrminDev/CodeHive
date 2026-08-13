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

import com.github.codehive.messaging.producer.TestGenerationRequestProducer;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.model.request.assignment.CreateAssignmentRequest;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.ReferenceSolutionRevisionRepository;
import com.github.codehive.repository.TestCaseRepository;
import com.github.codehive.repository.TestSuiteRevisionRepository;
import com.github.codehive.repository.UserRepository;

class AssignmentServiceTest {
    private static final UUID OWNER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID STUDENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID GROUP_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final UUID ASSIGNMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000004");

    private AssignmentRepository assignmentRepository;
    private TestCaseRepository testCaseRepository;
    private TestGenerationRequestProducer generationProducer;
    private UserRepository userRepository;
    private GroupEnrollmentRepository enrollmentRepository;
    private GroupService groupService;
    private AssignmentService service;
    private User owner;
    private ClassGroup group;

    @BeforeEach
    void setUp() {
        assignmentRepository = mock(AssignmentRepository.class);
        testCaseRepository = mock(TestCaseRepository.class);
        generationProducer = mock(TestGenerationRequestProducer.class);
        userRepository = mock(UserRepository.class);
        enrollmentRepository = mock(GroupEnrollmentRepository.class);
        groupService = mock(GroupService.class);
        service = new AssignmentService(assignmentRepository, testCaseRepository,
                mock(ReferenceSolutionRevisionRepository.class), mock(TestSuiteRevisionRepository.class),
                mock(ObjectStorageService.class), generationProducer, userRepository,
                enrollmentRepository, groupService);
        owner = user(OWNER_ID, "owner@example.com", Role.TEACHER);
        group = new ClassGroup("Algorithms", "", owner, "ABC12345");
        group.setId(GROUP_ID);
    }

    @Test
    void createRejectsEmptyTestSuiteBeforePersistingOrPublishing() {
        CreateAssignmentRequest request = new CreateAssignmentRequest();
        request.setGroupId(GROUP_ID);
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
        when(groupService.requireOwnedWritableGroup(GROUP_ID, owner)).thenReturn(group);

        assertThatThrownBy(() -> service.createAssignment(request, null, List.of(), owner.getEmail()))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("At least one test case input");

        verify(assignmentRepository, never()).save(org.mockito.ArgumentMatchers.any());
        verify(generationProducer, never()).sendTestGenerationRequest(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void getAssignmentHidesReadyAssignmentFromStudentWithoutActiveEnrollment() {
        User student = user(STUDENT_ID, "student@example.com", Role.STUDENT);
        Assignment assignment = assignment();
        assignment.setValidationStatus(AssignmentValidationStatus.READY);
        when(assignmentRepository.findById(ASSIGNMENT_ID)).thenReturn(Optional.of(assignment));
        when(userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        when(enrollmentRepository.existsByGroupIdAndStudentIdAndStatus(
                GROUP_ID, STUDENT_ID, com.github.codehive.model.enums.EnrollmentStatus.ACTIVE)).thenReturn(false);

        assertThatThrownBy(() -> service.getAssignmentById(ASSIGNMENT_ID, student.getEmail()))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Assignment not found");

        verify(testCaseRepository, never()).findByTestSuiteRevisionIdAndIsSampleOrderByOrderAsc(
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyBoolean());
    }

    @Test
    void softDeleteMarksAssignmentInactiveForOwner() {
        Assignment assignment = assignment();
        when(assignmentRepository.findById(ASSIGNMENT_ID)).thenReturn(Optional.of(assignment));
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));

        service.softDelete(ASSIGNMENT_ID, owner.getEmail());

        assertThat(assignment.getIsActive()).isFalse();
    }

    @Test
    void softDeleteRejectsNonOwnerWithoutChangingAssignment() {
        User otherTeacher = user(STUDENT_ID, "other@example.com", Role.TEACHER);
        Assignment assignment = assignment();
        when(assignmentRepository.findById(ASSIGNMENT_ID)).thenReturn(Optional.of(assignment));
        when(userRepository.findByEmail(otherTeacher.getEmail())).thenReturn(Optional.of(otherTeacher));

        assertThatThrownBy(() -> service.softDelete(ASSIGNMENT_ID, otherTeacher.getEmail()))
                .isInstanceOf(AccessDeniedException.class);

        assertThat(assignment.getIsActive()).isTrue();
    }

    private Assignment assignment() {
        Assignment assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        assignment.setGroup(group);
        assignment.setIsActive(true);
        return assignment;
    }

    private User user(UUID id, String email, Role role) {
        User user = new User("Test", "User", id.toString(), email, "password", role);
        user.setId(id);
        return user;
    }
}
