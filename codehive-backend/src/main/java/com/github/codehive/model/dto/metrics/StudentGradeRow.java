package com.github.codehive.model.dto.metrics;

import java.math.BigDecimal;
import java.util.UUID;

import com.github.codehive.model.enums.GradeStatus;

/**
 * Flat projection of one assignment grade, used to derive normalized score
 * averages and grading progress (metrics M2, M3, M11).
 */
public record StudentGradeRow(
        UUID assignmentId,
        UUID studentId,
        BigDecimal value,
        BigDecimal maxPoints,
        GradeStatus status) {
}
