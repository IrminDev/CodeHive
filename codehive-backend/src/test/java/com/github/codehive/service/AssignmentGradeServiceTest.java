package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.github.codehive.model.dto.AssignmentGradeDTO;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentGrade;
import com.github.codehive.model.entity.AssignmentGradeHistory;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.GradeChangeReason;
import com.github.codehive.model.enums.GradeStatus;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.notification.NotificationDomainEventPublisher;
import com.github.codehive.notification.event.NotificationDomainEvent;
import com.github.codehive.repository.AssignmentGradeHistoryRepository;
import com.github.codehive.repository.AssignmentGradeRepository;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.StudentAssignmentWorkRepository;
import com.github.codehive.repository.UserRepository;

class AssignmentGradeServiceTest {
    private static final UUID ASSIGNMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID STUDENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID GROUP_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");

    private AssignmentGradeRepository gradeRepository;
    private AssignmentGradeHistoryRepository historyRepository;
    private AssignmentRepository assignmentRepository;
    private StudentAssignmentWorkRepository workRepository;
    private User teacher;
    private User student;
    private Assignment assignment;
    private StudentAssignmentWork work;
    private NotificationDomainEventPublisher notificationPublisher;
    private StudentAssignmentWorkService workService;
    private UserRepository userRepository;
    private AssignmentGradeService service;

    @BeforeEach
    void setUp() {
        gradeRepository = mock(AssignmentGradeRepository.class);
        historyRepository = mock(AssignmentGradeHistoryRepository.class);
        assignmentRepository = mock(AssignmentRepository.class);
        workRepository = mock(StudentAssignmentWorkRepository.class);
        userRepository = mock(UserRepository.class);
        notificationPublisher = mock(NotificationDomainEventPublisher.class);
        workService = mock(StudentAssignmentWorkService.class);
        service = new AssignmentGradeService(gradeRepository, historyRepository, assignmentRepository,
                workRepository, userRepository, notificationPublisher, workService);
        teacher = user("teacher@example.com", UUID.fromString("00000000-0000-0000-0000-000000000004"), Role.TEACHER);
        student = user("student@example.com", STUDENT_ID, Role.STUDENT);
        assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        assignment.setMaxPoints(new BigDecimal("100.00"));
        ClassGroup group = new ClassGroup();
        group.setId(GROUP_ID);
        group.setOwner(teacher);
        assignment.setGroup(group);
        work = mock(StudentAssignmentWork.class);
        when(work.getId()).thenReturn(UUID.fromString("00000000-0000-0000-0000-000000000005"));
        when(work.getAssignment()).thenReturn(assignment);
        when(work.getStudent()).thenReturn(student);
        when(assignmentRepository.findById(ASSIGNMENT_ID)).thenReturn(Optional.of(assignment));
        when(workRepository.findByAssignmentIdAndStudentId(ASSIGNMENT_ID, STUDENT_ID)).thenReturn(Optional.of(work));
        when(userRepository.findByEmail(teacher.getEmail())).thenReturn(Optional.of(teacher));
    }

    @Test
    void saveDraftPersistsDraftAndCreatedAuditEntry() {
        when(gradeRepository.findByStudentWorkId(work.getId())).thenReturn(Optional.empty());
        when(gradeRepository.save(any(AssignmentGrade.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AssignmentGradeDTO result = service.saveDraft(ASSIGNMENT_ID, STUDENT_ID,
                new BigDecimal("87.50"), teacher.getEmail());

        assertThat(result.value()).isEqualByComparingTo("87.50");
        assertThat(result.maxPoints()).isEqualByComparingTo("100.00");
        assertThat(result.status()).isEqualTo(GradeStatus.DRAFT);
        ArgumentCaptor<AssignmentGradeHistory> history = ArgumentCaptor.forClass(AssignmentGradeHistory.class);
        verify(historyRepository).save(history.capture());
        assertThat(history.getValue().getReason()).isEqualTo(GradeChangeReason.CREATED);
        assertThat(history.getValue().getActor()).isSameAs(teacher);
    }

    @Test
    void saveDraftRejectsValueAboveAssignmentMaximumWithoutSaving() {
        assertThatThrownBy(() -> service.saveDraft(ASSIGNMENT_ID, STUDENT_ID,
                new BigDecimal("100.01"), teacher.getEmail()))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("cannot exceed");

        verify(workRepository, never()).findByAssignmentIdAndStudentId(any(), any());
        verify(gradeRepository, never()).save(any());
    }

    @Test
    void saveDraftCreatesMissingWorkForZeroGrade() {
        when(workRepository.findByAssignmentIdAndStudentId(ASSIGNMENT_ID, STUDENT_ID))
                .thenReturn(Optional.empty());
        when(userRepository.findById(STUDENT_ID)).thenReturn(Optional.of(student));
        when(workService.getOrCreate(assignment, student)).thenReturn(work);
        when(gradeRepository.findByStudentWorkId(work.getId())).thenReturn(Optional.empty());
        when(gradeRepository.save(any(AssignmentGrade.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AssignmentGradeDTO result = service.saveDraft(ASSIGNMENT_ID, STUDENT_ID,
                BigDecimal.ZERO, teacher.getEmail());

        assertThat(result.value()).isEqualByComparingTo(BigDecimal.ZERO);
        verify(workService).getOrCreate(assignment, student);
    }

    @Test
    void saveDraftRejectsNonZeroGradeWhenStudentHasNoWork() {
        when(workRepository.findByAssignmentIdAndStudentId(ASSIGNMENT_ID, STUDENT_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.saveDraft(ASSIGNMENT_ID, STUDENT_ID,
                BigDecimal.ONE, teacher.getEmail()))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("only receive a zero");

        verify(userRepository, never()).findById(any());
        verify(gradeRepository, never()).save(any());
    }

    @Test
    void returnGradePublishesNotificationAndRecordsReturnedAuditEntry() {
        AssignmentGrade grade = new AssignmentGrade();
        grade.setStudentWork(work);
        grade.setValue(new BigDecimal("90.00"));
        grade.setMaxPointsSnapshot(new BigDecimal("100.00"));
        when(gradeRepository.findByStudentWorkId(work.getId())).thenReturn(Optional.of(grade));

        AssignmentGradeDTO result = service.returnGrade(ASSIGNMENT_ID, STUDENT_ID, teacher.getEmail());

        assertThat(result.status()).isEqualTo(GradeStatus.RETURNED);
        assertThat(result.returnedAt()).isNotNull();
        ArgumentCaptor<AssignmentGradeHistory> history = ArgumentCaptor.forClass(AssignmentGradeHistory.class);
        verify(historyRepository).save(history.capture());
        assertThat(history.getValue().getReason()).isEqualTo(GradeChangeReason.RETURNED);
        ArgumentCaptor<NotificationDomainEvent> event = ArgumentCaptor.forClass(NotificationDomainEvent.class);
        verify(notificationPublisher).publish(event.capture());
        assertThat(event.getValue().type()).isEqualTo(NotificationType.GRADE_RETURNED);
        assertThat(event.getValue().subjectUserId()).isEqualTo(STUDENT_ID);
    }

    @Test
    void returnAllDraftsReturnsEachDraftAndPublishesNotifications() {
        AssignmentGrade first = draft(work, "80.00");
        StudentAssignmentWork secondWork = mock(StudentAssignmentWork.class);
        User secondStudent = user("second@example.com",
                UUID.fromString("00000000-0000-0000-0000-000000000006"), Role.STUDENT);
        when(secondWork.getAssignment()).thenReturn(assignment);
        when(secondWork.getStudent()).thenReturn(secondStudent);
        AssignmentGrade second = draft(secondWork, "90.00");
        when(gradeRepository.findByStudentWorkAssignmentIdAndStatus(ASSIGNMENT_ID, GradeStatus.DRAFT))
                .thenReturn(List.of(first, second));

        var result = service.returnAllDrafts(ASSIGNMENT_ID, teacher.getEmail());

        assertThat(result.assignmentId()).isEqualTo(ASSIGNMENT_ID);
        assertThat(result.returnedCount()).isEqualTo(2);
        assertThat(first.getStatus()).isEqualTo(GradeStatus.RETURNED);
        assertThat(second.getStatus()).isEqualTo(GradeStatus.RETURNED);
        verify(historyRepository, org.mockito.Mockito.times(2)).save(any(AssignmentGradeHistory.class));
        verify(notificationPublisher, org.mockito.Mockito.times(2)).publish(any(NotificationDomainEvent.class));
    }

    @Test
    void returnAllDraftsIsIdempotentWhenNoDraftsRemain() {
        when(gradeRepository.findByStudentWorkAssignmentIdAndStatus(ASSIGNMENT_ID, GradeStatus.DRAFT))
                .thenReturn(List.of());

        var result = service.returnAllDrafts(ASSIGNMENT_ID, teacher.getEmail());

        assertThat(result.returnedCount()).isZero();
        verify(historyRepository, never()).save(any());
        verify(notificationPublisher, never()).publish(any());
    }

    @Test
    void clearGradeDeletesCurrentGradeOnlyAfterRecordingReason() {
        AssignmentGrade grade = new AssignmentGrade();
        grade.setStudentWork(work);
        grade.setValue(new BigDecimal("75.00"));
        grade.setMaxPointsSnapshot(new BigDecimal("100.00"));
        when(gradeRepository.findByStudentWorkId(work.getId())).thenReturn(Optional.of(grade));

        boolean cleared = service.clearGrade(work, GradeChangeReason.CLEARED_RESUBMISSION, teacher);

        assertThat(cleared).isTrue();
        verify(historyRepository).save(any(AssignmentGradeHistory.class));
        verify(gradeRepository).delete(grade);
    }

    private User user(String email, UUID id, Role role) {
        User user = new User("Test", "User", id.toString(), email, "password", role);
        user.setId(id);
        return user;
    }

    private AssignmentGrade draft(StudentAssignmentWork studentWork, String value) {
        AssignmentGrade grade = new AssignmentGrade();
        grade.setStudentWork(studentWork);
        grade.setValue(new BigDecimal(value));
        grade.setMaxPointsSnapshot(new BigDecimal("100.00"));
        grade.setStatus(GradeStatus.DRAFT);
        return grade;
    }
}
