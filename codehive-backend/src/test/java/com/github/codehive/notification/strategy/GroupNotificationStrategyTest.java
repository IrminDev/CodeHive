package com.github.codehive.notification.strategy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.github.codehive.model.dto.queue.NotificationMessage;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.enums.Role;
import com.github.codehive.notification.NotificationFormatService;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.UserRepository;

class GroupNotificationStrategyTest {
    @Test
    void enrolledEmailUsesExactEnrollmentAndRosterDeepLink() {
        UUID groupId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        UUID studentId = UUID.fromString("00000000-0000-0000-0000-000000000002");
        UUID enrollmentId = UUID.fromString("00000000-0000-0000-0000-000000000003");
        UUID ownerId = UUID.fromString("00000000-0000-0000-0000-000000000005");
        ClassGroupRepository groupRepository = mock(ClassGroupRepository.class);
        GroupEnrollmentRepository enrollmentRepository = mock(GroupEnrollmentRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        NotificationFormatService format = mock(NotificationFormatService.class);
        GroupNotificationStrategy strategy = new GroupNotificationStrategy(
                groupRepository, enrollmentRepository, userRepository, format);

        User owner = new User("Grace", "Hopper", "T-1", "grace@example.com", "encoded", Role.TEACHER);
        owner.setId(ownerId);
        User student = new User("Ada", "Lovelace", "S-1", "ada@example.com", "encoded", Role.STUDENT);
        student.setId(studentId);
        ClassGroup group = mock(ClassGroup.class);
        when(group.getId()).thenReturn(groupId);
        when(group.getName()).thenReturn("Algorithms");
        GroupEnrollment enrollment = new GroupEnrollment(group, student);
        enrollment.setId(enrollmentId);
        enrollment.setJoinedAt(LocalDateTime.of(2026, 8, 22, 17, 0));

        when(groupRepository.findById(groupId)).thenReturn(Optional.of(group));
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
        when(format.fullName(student)).thenReturn("Ada Lovelace");
        when(format.format(enrollment.getJoinedAt(), owner)).thenReturn("August 22, 2026 at 5:00 PM");
        when(format.teacherGroupUrl(groupId)).thenReturn(
                "https://codehive.example/teacher/groups/" + groupId);

        NotificationMessage message = new NotificationMessage(
                UUID.fromString("00000000-0000-0000-0000-000000000004"),
                NotificationType.STUDENT_ENROLLED, owner.getId(), studentId, groupId,
                null, null, enrollmentId, Instant.parse("2026-08-22T23:00:00Z"), 0, 2);

        var content = strategy.build(message, owner);

        assertThat(content.facts())
                .anySatisfy(fact -> assertThat(fact.value()).isEqualTo("S-1"))
                .anySatisfy(fact -> assertThat(fact.value()).contains("August 22, 2026"));
        assertThat(content.ctaUrl()).endsWith("/teacher/groups/" + groupId);
    }
}
