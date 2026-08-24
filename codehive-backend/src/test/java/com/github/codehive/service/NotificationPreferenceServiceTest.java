package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.Scope;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.model.request.notification.UpdateNotificationPreferenceRequest;
import com.github.codehive.model.request.notification.UpdateNotificationSettingsRequest;
import com.github.codehive.repository.UserNotificationPreferenceRepository;
import com.github.codehive.repository.UserNotificationSettingsRepository;
import com.github.codehive.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class NotificationPreferenceServiceTest {
    private static final UUID USER_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserNotificationSettingsRepository settingsRepository;
    @Mock
    private UserNotificationPreferenceRepository preferenceRepository;

    private NotificationPreferenceService service;
    private User student;

    @BeforeEach
    void setUp() {
        service = new NotificationPreferenceService(
                userRepository, settingsRepository, preferenceRepository);
        student = new User("Ada", "Lovelace", "20260001", "ada@example.com", "encoded", Role.STUDENT);
        student.setId(USER_ID);
    }

    @Test
    void returnsRoleDefaultsWhenNoOverridesExist() {
        when(userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        when(settingsRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());
        when(preferenceRepository.findByUserId(USER_ID)).thenReturn(List.of());

        var result = service.getForUser(student.getEmail());

        assertThat(result.emailEnabled()).isTrue();
        assertThat(result.timezone()).isEqualTo("America/Mexico_City");
        assertThat(result.locale()).isEqualTo("en-US");
        assertThat(result.preferences())
                .extracting(preference -> preference.type())
                .containsExactlyInAnyOrderElementsOf(NotificationType.forUser(student));
        assertThat(result.preferences())
                .extracting(preference -> preference.type())
                .doesNotContain(NotificationType.ASSIGNMENT_VALIDATION_FAILED);
    }

    @Test
    void rejectsPreferenceOwnedByAnotherRole() {
        when(userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        var request = new UpdateNotificationSettingsRequest(
                true,
                "America/Mexico_City",
                "en-US",
                List.of(new UpdateNotificationPreferenceRequest(
                        NotificationType.STUDENT_ENROLLED, true, null)));

        assertThatThrownBy(() -> service.update(student.getEmail(), request))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("not available for this account");
    }

    @Test
    void scopedStudentReceivesStudentAndOwnerCatalogs() {
        student.addScope(Scope.CREATE_GROUP);
        when(userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        when(settingsRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());
        when(preferenceRepository.findByUserId(USER_ID)).thenReturn(List.of());

        var result = service.getForUser(student.getEmail());

        assertThat(result.preferences()).extracting(preference -> preference.type())
                .contains(NotificationType.ASSIGNMENT_PUBLISHED, NotificationType.STUDENT_ENROLLED);
        assertThat(result.preferences()).extracting(preference -> preference.audience())
                .contains(com.github.codehive.model.enums.NotificationAudience.STUDENT,
                        com.github.codehive.model.enums.NotificationAudience.OWNER);
    }

    @Test
    void rejectsUnsupportedReminderLeadTime() {
        when(userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        var request = new UpdateNotificationSettingsRequest(
                true,
                "America/Mexico_City",
                "en-US",
                List.of(new UpdateNotificationPreferenceRequest(
                        NotificationType.ASSIGNMENT_CLOSE_SOON_NO_SUBMISSION, true, 60)));

        assertThatThrownBy(() -> service.update(student.getEmail(), request))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Unsupported reminder lead time");
    }

    @Test
    void resetDeletesOnlyCurrentUsersOverrides() {
        when(userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        when(settingsRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());
        when(preferenceRepository.findByUserId(USER_ID)).thenReturn(List.of());

        service.reset(student.getEmail());

        verify(preferenceRepository).deleteByUserId(USER_ID);
        verify(settingsRepository).deleteByUserId(USER_ID);
    }
}
