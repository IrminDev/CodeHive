package com.github.codehive.model.dto;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.SubmissionStatus;

/** Persisted student-facing summary for one definitive submission attempt. */
public record StudentSubmissionHistoryDTO(
        UUID submissionId,
        UUID assignmentId,
        Language language,
        SubmissionStatus submissionStatus,
        LocalDateTime submittedAt,
        boolean deliveredLate,
        Instant withdrawnAt,
        UUID executionId,
        ExecutionStatus executionStatus,
        Long timeMs,
        Long memoryMb,
        boolean reportAvailable
) {}
