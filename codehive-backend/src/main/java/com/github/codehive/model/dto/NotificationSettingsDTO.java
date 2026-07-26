package com.github.codehive.model.dto;

import java.util.List;

public record NotificationSettingsDTO(
        boolean emailEnabled,
        String timezone,
        String locale,
        List<NotificationPreferenceDTO> preferences
) {}
