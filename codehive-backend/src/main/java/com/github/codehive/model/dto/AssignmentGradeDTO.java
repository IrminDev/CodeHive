package com.github.codehive.model.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.github.codehive.model.enums.GradeStatus;

public record AssignmentGradeDTO(
        UUID id,
        UUID assignmentId,
        UUID studentId,
        UUID submissionId,
        BigDecimal value,
        BigDecimal maxPoints,
        GradeStatus status,
        Instant updatedAt,
        Instant returnedAt
) {
}
