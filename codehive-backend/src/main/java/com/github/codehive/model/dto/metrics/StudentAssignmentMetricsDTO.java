package com.github.codehive.model.dto.metrics;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.StudentWorkStatus;

/**
 * One assignment's student work, verdict, attempts, and grade. Student self views
 * include published assignments and returned grades; owner views also include drafts.
 */
public record StudentAssignmentMetricsDTO(
        UUID assignmentId,
        String title,
        Instant dueDate,
        Instant closeDate,
        BigDecimal maxPoints,
        StudentWorkStatus workStatus,
        UUID currentSubmissionId,
        Boolean deliveredLate,
        long attempts,
        ExecutionStatus verdict,
        Long timeMs,
        Long memoryMb,
        AssignmentMetricsDetailDTO.GradeSummary grade) {
}
