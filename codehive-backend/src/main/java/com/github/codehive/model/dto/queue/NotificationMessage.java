package com.github.codehive.model.dto.queue;

import java.time.Instant;
import java.util.UUID;

import com.github.codehive.model.enums.NotificationType;

public record NotificationMessage(
        UUID notificationId,
        NotificationType type,
        UUID recipientId,
        UUID actorId,
        UUID groupId,
        UUID assignmentId,
        UUID submissionId,
        Instant occurredAt,
        int attempt,
        int schemaVersion
) {
    public NotificationMessage nextAttempt() {
        return new NotificationMessage(notificationId, type, recipientId, actorId, groupId,
                assignmentId, submissionId, occurredAt, attempt + 1, schemaVersion);
    }
}
