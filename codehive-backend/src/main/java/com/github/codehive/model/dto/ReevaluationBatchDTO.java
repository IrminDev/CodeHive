package com.github.codehive.model.dto;

import java.time.Instant;
import java.util.UUID;

import com.github.codehive.model.enums.ReevaluationBatchStatus;

public record ReevaluationBatchDTO(
        UUID id,
        UUID assignmentId,
        UUID testSuiteRevisionId,
        ReevaluationBatchStatus status,
        int total,
        int queued,
        int completed,
        int failed,
        Instant createdAt,
        Instant completedAt) {
}
