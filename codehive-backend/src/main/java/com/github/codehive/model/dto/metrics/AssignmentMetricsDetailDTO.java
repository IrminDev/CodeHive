package com.github.codehive.model.dto.metrics;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.GradeStatus;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.StudentWorkStatus;

/**
 * Detailed metrics of one assignment (contract E4): the E2 aggregate fields
 * plus language distribution, accepted-solution performance, missing students,
 * and a per-student breakdown.
 */
public record AssignmentMetricsDetailDTO(
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
        boolean overdue,
        Map<Language, Long> languageDistribution,
        AcceptedPerformance acceptedPerformance,
        List<StudentRef> missingStudents,
        List<StudentBreakdown> perStudent) {

    /** Average runtime cost of accepted solutions next to the assignment limits (metric M9). */
    public record AcceptedPerformance(
            BigDecimal averageTimeMs,
            BigDecimal averageMemoryMb,
            Long timeLimitMs,
            Long memoryLimitMb) {
    }

    public record StudentRef(UUID studentId, String fullName, String enrollmentNumber) {
    }

    public record StudentBreakdown(
            UUID studentId,
            String fullName,
            StudentWorkStatus workStatus,
            UUID currentSubmissionId,
            Boolean deliveredLate,
            long attempts,
            ExecutionStatus verdict,
            Long timeMs,
            Long memoryMb,
            GradeSummary grade) {
    }

    public record GradeSummary(BigDecimal value, BigDecimal maxPoints, GradeStatus status) {
    }
}
