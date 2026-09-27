package com.github.codehive.model.dto.assistant;

import java.util.UUID;

import com.github.codehive.model.enums.AiAssistanceLevel;

public record AssistantAvailabilityDTO(boolean available, String reason, int maximum, long used,
        long reserved, long remaining, AiAssistanceLevel assistanceLevel, long policyVersion,
        UUID pendingInteractionId) {}
