package com.github.codehive.model.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.github.codehive.model.enums.GradeChangeReason;
import com.github.codehive.model.enums.GradeStatus;

public record AssignmentGradeHistoryDTO(
        UUID id,
        BigDecimal value,
        BigDecimal maxPoints,
        GradeStatus status,
        GradeChangeReason reason,
        UUID actorId,
        String actorName,
        Instant createdAt) {
}
