package com.github.codehive.model.dto;

import java.time.Instant;
import java.util.UUID;

import com.github.codehive.model.enums.AssignmentUpdateKind;
import com.github.codehive.model.enums.AssignmentUpdateStatus;

public record AssignmentUpdateDTO(
        UUID id,
        UUID assignmentId,
        AssignmentUpdateKind kind,
        AssignmentUpdateStatus status,
        String failureMessage,
        Instant createdAt,
        Instant completedAt
) {
}
