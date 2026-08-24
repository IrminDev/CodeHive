package com.github.codehive.notification.event;

import java.time.Instant;
import java.util.UUID;

import com.github.codehive.model.enums.NotificationType;

public record NotificationDomainEvent(
        UUID eventId,
        NotificationType type,
        UUID actorId,
        UUID subjectUserId,
        UUID groupId,
        UUID assignmentId,
        UUID submissionId,
        UUID resourceId,
        Instant occurredAt
) {
    public static NotificationDomainEvent of(NotificationType type, UUID actorId, UUID subjectUserId,
                                             UUID groupId, UUID assignmentId, UUID submissionId) {
        return new NotificationDomainEvent(UUID.randomUUID(), type, actorId, subjectUserId, groupId,
                assignmentId, submissionId, null, Instant.now());
    }

    public static NotificationDomainEvent of(NotificationType type, UUID actorId, UUID subjectUserId,
                                             UUID groupId, UUID assignmentId, UUID submissionId,
                                             UUID resourceId) {
        return new NotificationDomainEvent(UUID.randomUUID(), type, actorId, subjectUserId, groupId,
                assignmentId, submissionId, resourceId, Instant.now());
    }
}
