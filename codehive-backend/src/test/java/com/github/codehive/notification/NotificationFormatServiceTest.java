package com.github.codehive.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.ZoneId;

import org.junit.jupiter.api.Test;

import com.github.codehive.model.entity.User;
import com.github.codehive.service.NotificationPreferenceService;

class NotificationFormatServiceTest {
    private final NotificationPreferenceService preferences = mock(NotificationPreferenceService.class);
    private final NotificationFormatService format = new NotificationFormatService(
            preferences, "https://codehive.example");
    private final User recipient = mock(User.class);

    @Test
    void formatsInRecipientTimezoneWithoutDisplayingTimezoneIdentifier() {
        when(preferences.getTimezone(recipient)).thenReturn(ZoneId.of("America/Mexico_City"));

        String value = format.format(Instant.parse("2026-08-22T02:00:00Z"), recipient);

        assertThat(value)
                .isEqualTo("August 21, 2026 at 8:00 PM")
                .doesNotContain("America/Mexico_City", "UTC", "Timezone");
    }

    @Test
    void omitsMissingDateInsteadOfRenderingPlaceholder() {
        assertThat(format.format((Instant) null, recipient)).isNull();
    }

    @Test
    void formatsStableReminderDurationFromEventTime() {
        assertThat(format.remaining(
                Instant.parse("2026-08-23T12:00:00Z"),
                Instant.parse("2026-08-22T12:05:00Z")))
                .isEqualTo("1 day remaining");
        assertThat(format.remaining(
                Instant.parse("2026-08-22T14:00:00Z"),
                Instant.parse("2026-08-22T12:05:00Z")))
                .isEqualTo("2 hours remaining");
    }

    @Test
    void buildsFocusedNotificationLinks() {
        java.util.UUID groupId = java.util.UUID.fromString("00000000-0000-0000-0000-000000000001");
        java.util.UUID assignmentId = java.util.UUID.fromString("00000000-0000-0000-0000-000000000002");
        java.util.UUID studentId = java.util.UUID.fromString("00000000-0000-0000-0000-000000000003");

        assertThat(format.teacherGradesUrl(groupId, assignmentId, studentId))
                .isEqualTo("https://codehive.example/teacher/grades?groupId=" + groupId
                        + "&assignmentId=" + assignmentId + "&studentId=" + studentId);
        assertThat(format.studentGradesUrl(assignmentId))
                .isEqualTo("https://codehive.example/grades?assignmentId=" + assignmentId);
    }
}
