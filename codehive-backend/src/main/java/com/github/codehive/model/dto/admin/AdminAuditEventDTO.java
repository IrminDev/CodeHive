package com.github.codehive.model.dto.admin;

import java.time.Instant;
import java.util.UUID;

import com.github.codehive.model.enums.AdminAuditAction;
import com.github.codehive.model.enums.AdminAuditOutcome;

public record AdminAuditEventDTO(
        UUID id,
        UUID actorId,
        String actorDisplayName,
        UUID targetId,
        String targetDisplayName,
        AdminAuditAction action,
        AdminAuditOutcome outcome,
        String reason,
        String details,
        Instant occurredAt,
        String correlationId) {
}
