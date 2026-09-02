package com.github.codehive.model.dto;

import com.github.codehive.model.enums.NotificationType;

public record NotificationPreferenceDTO(
        NotificationType type,
        boolean enabled,
        Integer reminderLeadMinutes
) {}
