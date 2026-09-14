package com.github.codehive.model.dto.metrics;

import java.time.LocalDateTime;
import java.util.UUID;

import com.github.codehive.model.enums.ExecutionStatus;

/**
 * Flat projection of a non-outdated execution of a submission. The most recent
 * row per submission is the representative execution used for verdict
 * distribution and accepted-solution performance (metrics M6, M9).
 */
public record SubmissionResultRow(
        UUID submissionId,
        ExecutionStatus status,
        Long timeMs,
        Long memoryMb,
        LocalDateTime createdAt) {
}
