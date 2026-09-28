package com.github.codehive.model.dto.admin;

import java.time.LocalDateTime;
import java.util.UUID;

import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.ExecutionTrigger;
import com.github.codehive.model.enums.ExecutionType;

public record AdminExecutionResourceDTO(
        UUID id,
        UUID assignmentId,
        UUID submissionId,
        ExecutionType type,
        ExecutionTrigger trigger,
        ExecutionStatus status,
        Long timeMs,
        Long memoryMb,
        LocalDateTime createdAt,
        boolean reportAvailable) {
}
