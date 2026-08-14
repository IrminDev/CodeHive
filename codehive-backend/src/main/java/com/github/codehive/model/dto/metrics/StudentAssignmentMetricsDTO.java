package com.github.codehive.model.dto.metrics;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.StudentWorkStatus;

/**
 * One published assignment seen from the authenticated student's own perspective:
 * their current submission, verdict, attempts, and returned grade (drafts excluded).
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
