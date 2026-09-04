package com.github.codehive.model.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.Language;

public record RecentSubmissionDTO(
        UUID id,
        UUID assignmentId,
        String assignmentTitle,
        Language language,
        ExecutionStatus executionStatus,
        Long timeMs,
        LocalDateTime createdAt
) {}
