package com.github.codehive.model.request.notification;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateNotificationSettingsRequest(
        @NotNull(message = "Email enabled is required")
        Boolean emailEnabled,
        @NotBlank(message = "Timezone is required")
        String timezone,
        @NotBlank(message = "Locale is required")
        String locale,
        @Valid
        List<UpdateNotificationPreferenceRequest> preferences
) {}
