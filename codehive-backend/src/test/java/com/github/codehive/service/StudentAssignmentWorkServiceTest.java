package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.StudentAssignmentWorkRepository;

class StudentAssignmentWorkServiceTest {
    private static final UUID ASSIGNMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID GROUP_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID STUDENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");

    @Test
    void returnsExistingWorkWithoutRecheckingEnrollment() {
        StudentAssignmentWorkRepository workRepository = mock(StudentAssignmentWorkRepository.class);
        GroupEnrollmentRepository enrollmentRepository = mock(GroupEnrollmentRepository.class);
        StudentAssignmentWorkService service = new StudentAssignmentWorkService(workRepository, enrollmentRepository);
        Assignment assignment = assignment();
        User student = student();
        StudentAssignmentWork existing = new StudentAssignmentWork();
        when(workRepository.findByAssignmentIdAndStudentId(ASSIGNMENT_ID, STUDENT_ID))
                .thenReturn(Optional.of(existing));

        StudentAssignmentWork result = service.getOrCreate(assignment, student);

        assertThat(result).isSameAs(existing);
        verify(enrollmentRepository, never()).existsByGroupIdAndStudentIdAndStatus(
                any(), any(), any());
    }

    @Test
    void rejectsNewWorkForStudentWithoutActiveEnrollment() {
        StudentAssignmentWorkRepository workRepository = mock(StudentAssignmentWorkRepository.class);
        GroupEnrollmentRepository enrollmentRepository = mock(GroupEnrollmentRepository.class);
        StudentAssignmentWorkService service = new StudentAssignmentWorkService(workRepository, enrollmentRepository);
        when(workRepository.findByAssignmentIdAndStudentId(ASSIGNMENT_ID, STUDENT_ID)).thenReturn(Optional.empty());
        when(enrollmentRepository.existsByGroupIdAndStudentIdAndStatus(
                GROUP_ID, STUDENT_ID, EnrollmentStatus.ACTIVE)).thenReturn(false);

        assertThatThrownBy(() -> service.getOrCreate(assignment(), student()))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("not actively enrolled");

        verify(workRepository, never()).save(any());
    }

    @Test
    void createsWorkForActivelyEnrolledStudent() {
        StudentAssignmentWorkRepository workRepository = mock(StudentAssignmentWorkRepository.class);
        GroupEnrollmentRepository enrollmentRepository = mock(GroupEnrollmentRepository.class);
        StudentAssignmentWorkService service = new StudentAssignmentWorkService(workRepository, enrollmentRepository);
        when(workRepository.findByAssignmentIdAndStudentId(ASSIGNMENT_ID, STUDENT_ID)).thenReturn(Optional.empty());
        when(enrollmentRepository.existsByGroupIdAndStudentIdAndStatus(
                GROUP_ID, STUDENT_ID, EnrollmentStatus.ACTIVE)).thenReturn(true);
        when(workRepository.save(any(StudentAssignmentWork.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        StudentAssignmentWork result = service.getOrCreate(assignment(), student());

        assertThat(result.getAssignment().getId()).isEqualTo(ASSIGNMENT_ID);
        assertThat(result.getStudent().getId()).isEqualTo(STUDENT_ID);
        assertThat(result.getUpdatedAt()).isNotNull();
    }

    private Assignment assignment() {
        Assignment assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        ClassGroup group = new ClassGroup();
        group.setId(GROUP_ID);
        assignment.setGroup(group);
        return assignment;
    }

    private User student() {
        User student = new User("Ada", "Lovelace", "STU-1", "student@example.com", "password", Role.STUDENT);
        student.setId(STUDENT_ID);
        return student;
    }
}
