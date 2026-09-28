package com.github.codehive.model.dto.metrics;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Group-level metrics summary (contract E1). Aggregate values are null when
 * there is no data to compute them; the frontend must distinguish null from 0.
 */
public record GroupMetricsOverviewDTO(
        UUID groupId,
        Instant generatedAt,
        EnrollmentBreakdown enrollment,
        AssignmentBreakdown assignments,
        BigDecimal overallSubmissionRate,
        BigDecimal overallAverageScore,
        BigDecimal overallOnTimeRate,
        GradingProgress gradingProgress) {

    public record EnrollmentBreakdown(long active, long left, long removed) {
    }

    public record AssignmentBreakdown(long total, long published, long processing, long failed) {
    }

    public record GradingProgress(long submitted, long graded, long returned) {
    }
}
