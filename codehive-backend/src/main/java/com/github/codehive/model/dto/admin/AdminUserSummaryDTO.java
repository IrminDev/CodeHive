package com.github.codehive.model.dto.admin;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.github.codehive.model.enums.AdminUserStatus;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.Scope;

public record AdminUserSummaryDTO(
        UUID id,
        String email,
        String name,
        String lastName,
        String enrollmentNumber,
        Role role,
        List<Scope> scopes,
        AdminUserStatus status,
        LocalDateTime createdAt,
        Instant blockedAt) {
}
