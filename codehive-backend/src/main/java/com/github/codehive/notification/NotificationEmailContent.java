package com.github.codehive.notification;

import java.util.List;

import com.github.codehive.model.enums.NotificationType;

public record NotificationEmailContent(
        NotificationType type,
        String subject,
        String summary,
        List<NotificationFact> facts,
        NotificationCallout callout,
        String ctaLabel,
        String ctaUrl
) {
    public NotificationEmailContent {
        facts = facts == null ? List.of() : List.copyOf(facts);
    }
}
