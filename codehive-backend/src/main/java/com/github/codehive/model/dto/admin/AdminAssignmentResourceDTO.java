package com.github.codehive.model.dto.admin;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.StudentWorkStatus;

public record AdminAssignmentResourceDTO(
        UUID id,
        String title,
        UUID groupId,
        String groupName,
        String relationship,
        boolean active,
        AssignmentValidationStatus validationStatus,
        Instant launchDate,
        Instant dueDate,
        Instant closeDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        StudentWorkStatus studentWorkStatus) {
}
