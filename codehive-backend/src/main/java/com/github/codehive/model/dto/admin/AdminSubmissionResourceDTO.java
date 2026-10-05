package com.github.codehive.model.dto.admin;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.SubmissionStatus;

public record AdminSubmissionResourceDTO(
        UUID id,
        UUID assignmentId,
        String assignmentTitle,
        UUID groupId,
        String groupName,
        Language language,
        SubmissionStatus status,
        boolean deliveredLate,
        LocalDateTime createdAt,
        Instant withdrawnAt,
        ExecutionStatus latestVerdict) {
}
