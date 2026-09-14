package com.github.codehive.model.dto.admin;

import java.time.LocalDateTime;
import java.util.UUID;

import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.GroupDeletionReason;

public record AdminGroupResourceDTO(
        UUID id,
        String name,
        String relationship,
        boolean active,
        boolean archived,
        LocalDateTime createdAt,
        GroupDeletionReason deletionReason,
        EnrollmentStatus enrollmentStatus,
        LocalDateTime joinedAt,
        LocalDateTime endedAt) {
}
