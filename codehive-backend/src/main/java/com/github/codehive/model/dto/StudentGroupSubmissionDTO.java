package com.github.codehive.model.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/** Current definitive submission for one assignment in a student's group. */
public record StudentGroupSubmissionDTO(
        UUID assignmentId,
        UUID submissionId,
        LocalDateTime submittedAt,
        boolean deliveredLate
) {}
