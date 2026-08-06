package com.github.codehive.model.dto;

import java.time.Instant;
import java.util.UUID;

import com.github.codehive.model.enums.FeedbackStatus;

public record AssignmentFeedbackDTO(
        UUID id,
        UUID assignmentId,
        UUID studentId,
        UUID authorId,
        String body,
        FeedbackStatus status,
        Instant createdAt,
        Instant deletedAt
) {
}
