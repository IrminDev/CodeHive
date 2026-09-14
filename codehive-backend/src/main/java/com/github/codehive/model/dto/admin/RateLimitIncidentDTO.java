package com.github.codehive.model.dto.admin;

import java.time.Instant;
import java.util.UUID;

public record RateLimitIncidentDTO(
        UUID id,
        UUID userId,
        String userDisplayName,
        String policy,
        String method,
        String endpoint,
        Instant occurredAt,
        String correlationId) {
}
