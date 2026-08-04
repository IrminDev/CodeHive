package com.github.codehive.model.dto.metrics;

import java.util.UUID;

/**
 * Number of definitive submissions (including superseded and withdrawn ones)
 * a student made for an assignment (metric M7).
 */
public record SubmissionAttemptCount(UUID assignmentId, UUID studentId, Long attempts) {
}
