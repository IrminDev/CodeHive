package com.github.codehive.notification;

import java.util.List;

public record NotificationEmailContent(
        String subject,
        String badge,
        String title,
        String message,
        String detailTitle,
        List<String> detailLines,
        String ctaLabel,
        String ctaUrl
) {}
