package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.github.codehive.model.dto.GroupDTO;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.model.request.group.CreateGroupRequest;
import com.github.codehive.notification.NotificationDomainEventPublisher;
import com.github.codehive.notification.event.NotificationDomainEvent;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.UserRepository;

class GroupServiceTest {
    private static final UUID OWNER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID STUDENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID GROUP_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final String OWNER_EMAIL = "owner@example.com";
    private static final String STUDENT_EMAIL = "student@example.com";

    private ClassGroupRepository groupRepository;
    private GroupEnrollmentRepository enrollmentRepository;
    private UserRepository userRepository;
    private NotificationDomainEventPublisher notificationPublisher;
    private GroupService service;

    private User owner;
    private User student;
    private ClassGroup group;

    @BeforeEach
    void setUp() {
        groupRepository = mock(ClassGroupRepository.class);
        enrollmentRepository = mock(GroupEnrollmentRepository.class);
        userRepository = mock(UserRepository.class);
        notificationPublisher = mock(NotificationDomainEventPublisher.class);
        service = new GroupService(groupRepository, enrollmentRepository,
                userRepository, notificationPublisher);

        owner = new User("Grace", "Hopper", "TEA-001", OWNER_EMAIL, "encoded", Role.TEACHER);
        owner.setId(OWNER_ID);
        student = new User("Ada", "Lovelace", "STU-001", STUDENT_EMAIL, "encoded", Role.STUDENT);
        student.setId(STUDENT_ID);
        group = new ClassGroup("Algorithms", "", owner, "CODE1234");
        group.setId(GROUP_ID);

        when(userRepository.findByEmail(OWNER_EMAIL)).thenReturn(Optional.of(owner));
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(student));
        when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
    }

    @Test
    void createRetriesJoinCodeGenerationOnCollision() {
        when(groupRepository.existsByJoinCodeIgnoreCase(anyString()))
                .thenReturn(true)
                .thenReturn(false);
        when(groupRepository.save(any(ClassGroup.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        CreateGroupRequest request = new CreateGroupRequest();
        request.setName("Algorithms");

        GroupDTO created = service.create(request, OWNER_EMAIL);

        verify(groupRepository, times(2)).existsByJoinCodeIgnoreCase(anyString());
        assertThat(created.getJoinCode()).hasSize(8);
        assertThat(created.getOwnerId()).isEqualTo(OWNER_ID);
    }

    @Test
    void rejoinReactivatesTheHistoricalEnrollment() {
        GroupEnrollment historical = new GroupEnrollment(group, student);
        historical.setStatus(EnrollmentStatus.LEFT);
        historical.setJoinedAt(LocalDateTime.now().minusDays(30));
        historical.setEndedAt(LocalDateTime.now().minusDays(10));
        when(groupRepository.findByJoinCodeIgnoreCase("CODE1234")).thenReturn(Optional.of(group));
        when(enrollmentRepository.findByGroupIdAndStudentId(GROUP_ID, STUDENT_ID))
                .thenReturn(Optional.of(historical));

        service.join("CODE1234", STUDENT_EMAIL);

        ArgumentCaptor<GroupEnrollment> saved = ArgumentCaptor.forClass(GroupEnrollment.class);
        verify(enrollmentRepository).save(saved.capture());
        assertThat(saved.getValue()).isSameAs(historical);
        assertThat(historical.getStatus()).isEqualTo(EnrollmentStatus.ACTIVE);
        assertThat(historical.getEndedAt()).isNull();
        assertThat(historical.getJoinedAt()).isAfter(LocalDateTime.now().minusMinutes(1));

        ArgumentCaptor<NotificationDomainEvent> event =
                ArgumentCaptor.forClass(NotificationDomainEvent.class);
        verify(notificationPublisher).publish(event.capture());
        assertThat(event.getValue().type()).isEqualTo(NotificationType.STUDENT_ENROLLED);
    }

    @Test
    void restoreLeavesTheGroupArchived() {
        group.setIsActive(false);
        group.setArchived(true);

        GroupDTO restored = service.restore(GROUP_ID, OWNER_EMAIL);

        assertThat(restored.getIsActive()).isTrue();
        assertThat(restored.getArchived()).isTrue();
    }

    @Test
    void softDeleteAlsoArchivesTheGroup() {
        service.softDelete(GROUP_ID, OWNER_EMAIL);

        assertThat(group.getIsActive()).isFalse();
        assertThat(group.getArchived()).isTrue();
    }

    @Test
    void softDeletePublishesGroupArchivedSoEnrolledStudentsAreNotified() {
        service.softDelete(GROUP_ID, OWNER_EMAIL);

        ArgumentCaptor<NotificationDomainEvent> event =
                ArgumentCaptor.forClass(NotificationDomainEvent.class);
        verify(notificationPublisher).publish(event.capture());
        assertThat(event.getValue().type()).isEqualTo(NotificationType.GROUP_ARCHIVED);
        assertThat(event.getValue().groupId()).isEqualTo(GROUP_ID);
    }

    @Test
    void restoreRejectsAGroupThatIsNotDeleted() {
        assertThatThrownBy(() -> service.restore(GROUP_ID, OWNER_EMAIL))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("not deleted");
    }

    @Test
    void joinRejectsADeletedGroupsCodeAsNotFoundWithoutRevealingItExisted() {
        group.setIsActive(false);
        when(groupRepository.findByJoinCodeIgnoreCase("CODE1234")).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> service.join("CODE1234", STUDENT_EMAIL))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("No active group uses that join code");
    }

    @Test
    void rotateJoinCodeRejectsArchivedAndDeletedGroups() {
        group.setArchived(true);
        assertThatThrownBy(() -> service.rotateJoinCode(GROUP_ID, OWNER_EMAIL))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("archived");

        group.setArchived(false);
        group.setIsActive(false);
        assertThatThrownBy(() -> service.rotateJoinCode(GROUP_ID, OWNER_EMAIL))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("deleted");
    }

    @Test
    void removeStudentOnAnArchivedGroupIsCurrentlyAllowed() {
        // Documents current behavior: roster management skips the read-only check.
        group.setArchived(true);
        GroupEnrollment enrollment = new GroupEnrollment(group, student);
        when(enrollmentRepository.findByGroupIdAndStudentId(GROUP_ID, STUDENT_ID))
                .thenReturn(Optional.of(enrollment));

        service.removeStudent(GROUP_ID, STUDENT_ID, OWNER_EMAIL);

        assertThat(enrollment.getStatus()).isEqualTo(EnrollmentStatus.REMOVED);
        assertThat(enrollment.getEndedAt()).isNotNull();
    }
}
