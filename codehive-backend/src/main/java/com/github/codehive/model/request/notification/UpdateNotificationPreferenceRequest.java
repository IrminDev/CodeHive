package com.github.codehive.model.request.notification;

import com.github.codehive.model.enums.NotificationType;

import jakarta.validation.constraints.NotNull;

public record UpdateNotificationPreferenceRequest(
        @NotNull(message = "Notification type is required")
        NotificationType type,
        @NotNull(message = "Enabled is required")
        Boolean enabled,
        Integer reminderLeadMinutes
) {}
