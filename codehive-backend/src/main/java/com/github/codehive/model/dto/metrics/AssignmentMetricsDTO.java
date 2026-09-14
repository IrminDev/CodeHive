package com.github.codehive.model.dto.metrics;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.ExecutionStatus;

/**
 * Per-assignment metrics row (contract E2). Rates and averages are null when
 * the assignment has no data for them; counts are always concrete numbers.
 */
public record AssignmentMetricsDTO(
        UUID assignmentId,
        String title,
        AssignmentValidationStatus validationStatus,
        Instant dueDate,
        Instant closeDate,
        BigDecimal maxPoints,
        long activeStudents,
        long submittedCount,
        BigDecimal submissionRate,
        long lateCount,
        BigDecimal onTimeRate,
        BigDecimal averageScore,
        BigDecimal averagePoints,
        long draftGrades,
        long returnedGrades,
        BigDecimal averageAttempts,
        BigDecimal averageDeliveryMarginHours,
        Map<ExecutionStatus, Long> verdictDistribution,
        long missingCount,
        boolean overdue) {
}
