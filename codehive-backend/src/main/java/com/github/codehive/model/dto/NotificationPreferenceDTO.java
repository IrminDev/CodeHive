package com.github.codehive.model.dto;

import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.enums.NotificationAudience;

public record NotificationPreferenceDTO(
        NotificationType type,
        NotificationAudience audience,
        boolean enabled,
        Integer reminderLeadMinutes
) {}
