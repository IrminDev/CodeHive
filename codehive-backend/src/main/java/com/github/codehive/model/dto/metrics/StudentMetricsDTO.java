package com.github.codehive.model.dto.metrics;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Per-student metrics row over the group's published assignments (contract E3).
 * Personal data is intentionally limited to id, full name, enrollment number,
 * and join date.
 */
public record StudentMetricsDTO(
        UUID studentId,
        String fullName,
        String enrollmentNumber,
        LocalDateTime joinedAt,
        long publishedAssignments,
        long submittedCount,
        BigDecimal completionRate,
        long lateCount,
        BigDecimal averageScore,
        long gradedAssignments,
        long totalAttempts,
        List<UUID> missingAssignmentIds) {
}
