package com.github.codehive.model.dto.metrics;

import java.time.LocalDateTime;
import java.util.UUID;

import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.StudentWorkStatus;

/**
 * Flat projection of one current (non-withdrawn) submission, used to derive
 * submission rate, punctuality, delivery margin, and language distribution
 * (metrics M1, M4, M5, M8) without N+1 queries.
 */
public record CurrentSubmissionRow(
        UUID assignmentId,
        UUID studentId,
        StudentWorkStatus workStatus,
        UUID submissionId,
        Boolean deliveredLate,
        LocalDateTime submittedAt,
        Language language) {
}
