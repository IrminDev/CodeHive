package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.access.AccessDeniedException;

import com.github.codehive.model.dto.AssignmentFeedbackDTO;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentFeedback;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.FeedbackStatus;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.enums.Role;
import com.github.codehive.notification.NotificationDomainEventPublisher;
import com.github.codehive.notification.event.NotificationDomainEvent;
import com.github.codehive.repository.AssignmentFeedbackRepository;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.StudentAssignmentWorkRepository;
import com.github.codehive.repository.UserRepository;

class AssignmentFeedbackServiceTest {
    private static final UUID ASSIGNMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID STUDENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID OTHER_STUDENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final UUID GROUP_ID = UUID.fromString("00000000-0000-0000-0000-000000000004");

    private AssignmentFeedbackRepository feedbackRepository;
    private AssignmentRepository assignmentRepository;
    private StudentAssignmentWorkRepository workRepository;
    private StudentAssignmentWorkService workService;
    private UserRepository userRepository;
    private NotificationDomainEventPublisher notificationPublisher;
    private AssignmentFeedbackService service;
    private User teacher;
    private User student;
    private Assignment assignment;
    private StudentAssignmentWork work;

    @BeforeEach
    void setUp() {
        feedbackRepository = mock(AssignmentFeedbackRepository.class);
        assignmentRepository = mock(AssignmentRepository.class);
        workRepository = mock(StudentAssignmentWorkRepository.class);
        workService = mock(StudentAssignmentWorkService.class);
        userRepository = mock(UserRepository.class);
        notificationPublisher = mock(NotificationDomainEventPublisher.class);
        service = new AssignmentFeedbackService(feedbackRepository, assignmentRepository, workRepository,
                workService, userRepository, notificationPublisher);
        teacher = user(UUID.fromString("00000000-0000-0000-0000-000000000005"), "teacher@example.com", Role.TEACHER);
        student = user(STUDENT_ID, "student@example.com", Role.STUDENT);
        assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        ClassGroup group = new ClassGroup();
        group.setId(GROUP_ID);
        group.setOwner(teacher);
        assignment.setGroup(group);
        work = new StudentAssignmentWork();
        work.setAssignment(assignment);
        work.setStudent(student);
        when(userRepository.findByEmail(teacher.getEmail())).thenReturn(Optional.of(teacher));
        when(assignmentRepository.findById(ASSIGNMENT_ID)).thenReturn(Optional.of(assignment));
    }

    @Test
    void createPersistsFeedbackForEnrolledWorkAndNotifiesStudent() {
        when(userRepository.findById(STUDENT_ID)).thenReturn(Optional.of(student));
        when(workService.getOrCreate(assignment, student)).thenReturn(work);
        when(feedbackRepository.save(any(AssignmentFeedback.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AssignmentFeedbackDTO result = service.create(ASSIGNMENT_ID, STUDENT_ID,
                "Explain loop invariant.", teacher.getEmail());

        assertThat(result.body()).isEqualTo("Explain loop invariant.");
        assertThat(result.status()).isEqualTo(FeedbackStatus.PUBLISHED);
        ArgumentCaptor<NotificationDomainEvent> event = ArgumentCaptor.forClass(NotificationDomainEvent.class);
        verify(notificationPublisher).publish(event.capture());
        assertThat(event.getValue().type()).isEqualTo(NotificationType.FEEDBACK_RECEIVED);
        assertThat(event.getValue().subjectUserId()).isEqualTo(STUDENT_ID);
    }

    @Test
    void deleteMarksFeedbackDeletedWithoutRemovingAuditRecord() {
        UUID feedbackId = UUID.fromString("00000000-0000-0000-0000-000000000006");
        AssignmentFeedback feedback = new AssignmentFeedback();
        feedback.setStudentWork(work);
        feedback.setAuthor(teacher);
        feedback.setBody("Needs more detail");
        when(feedbackRepository.findById(feedbackId)).thenReturn(Optional.of(feedback));

        service.delete(feedbackId, teacher.getEmail());

        assertThat(feedback.getStatus()).isEqualTo(FeedbackStatus.DELETED);
        assertThat(feedback.getDeletedAt()).isNotNull();
        assertThat(feedback.getDeletedBy()).isSameAs(teacher);
    }

    @Test
    void listRejectsStudentRequestingAnotherStudentsFeedbackBeforeLoadingWork() {
        User otherStudent = user(OTHER_STUDENT_ID, "other@example.com", Role.STUDENT);
        when(userRepository.findByEmail(otherStudent.getEmail())).thenReturn(Optional.of(otherStudent));

        assertThatThrownBy(() -> service.list(ASSIGNMENT_ID, STUDENT_ID, otherStudent.getEmail()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("own feedback");

        verify(workRepository, never()).findByAssignmentIdAndStudentId(any(), any());
    }

    @Test
    void listMasksDeletedFeedbackBodyButKeepsPublishedFeedbackContent() {
        when(userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        StudentAssignmentWork persistedWork = mock(StudentAssignmentWork.class);
        UUID workId = UUID.fromString("00000000-0000-0000-0000-000000000007");
        when(persistedWork.getId()).thenReturn(workId);
        when(workRepository.findByAssignmentIdAndStudentId(ASSIGNMENT_ID, STUDENT_ID))
                .thenReturn(Optional.of(persistedWork));
        AssignmentFeedback published = feedback(work, teacher, "Visible", FeedbackStatus.PUBLISHED);
        AssignmentFeedback deleted = feedback(work, teacher, "Hidden", FeedbackStatus.DELETED);
        when(feedbackRepository.findByStudentWorkIdOrderByCreatedAtAsc(workId))
                .thenReturn(List.of(published, deleted));

        List<AssignmentFeedbackDTO> result = service.list(ASSIGNMENT_ID, STUDENT_ID, student.getEmail());

        assertThat(result).extracting(AssignmentFeedbackDTO::body).containsExactly("Visible", null);
        assertThat(result).extracting(AssignmentFeedbackDTO::status)
                .containsExactly(FeedbackStatus.PUBLISHED, FeedbackStatus.DELETED);
    }

    @Test
    void listMineReturnsPublishedFeedbackAndDeletedTombstonesForAuthenticatedStudent() {
        when(userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        StudentAssignmentWork persistedWork = mock(StudentAssignmentWork.class);
        UUID workId = UUID.fromString("00000000-0000-0000-0000-000000000008");
        when(persistedWork.getId()).thenReturn(workId);
        when(workRepository.findByAssignmentIdAndStudentId(ASSIGNMENT_ID, STUDENT_ID))
                .thenReturn(Optional.of(persistedWork));
        AssignmentFeedback published = feedback(work, teacher, "Visible", FeedbackStatus.PUBLISHED);
        AssignmentFeedback deleted = feedback(work, teacher, "Removed", FeedbackStatus.DELETED);
        when(feedbackRepository.findByStudentWorkIdOrderByCreatedAtAsc(workId))
                .thenReturn(List.of(published, deleted));

        List<AssignmentFeedbackDTO> result = service.listMine(ASSIGNMENT_ID, student.getEmail());

        assertThat(result).extracting(AssignmentFeedbackDTO::status)
                .containsExactly(FeedbackStatus.PUBLISHED, FeedbackStatus.DELETED);
        assertThat(result).extracting(AssignmentFeedbackDTO::body).containsExactly("Visible", null);
    }

    private AssignmentFeedback feedback(StudentAssignmentWork feedbackWork, User author, String body,
                                         FeedbackStatus status) {
        AssignmentFeedback feedback = new AssignmentFeedback();
        feedback.setStudentWork(feedbackWork);
        feedback.setAuthor(author);
        feedback.setBody(body);
        feedback.setStatus(status);
        return feedback;
    }

    private User user(UUID id, String email, Role role) {
        User user = new User("Test", "User", id.toString(), email, "password", role);
        user.setId(id);
        return user;
    }
}
