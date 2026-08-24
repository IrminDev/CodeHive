package com.github.codehive.model.request.admin;

import com.github.codehive.model.enums.Role;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateUserRoleRequest(
        @NotNull Role role,
        @NotBlank @Size(max = 50) String enrollmentNumber,
        @NotBlank @Size(min = 10, max = 500) String reason,
        boolean confirmEnrollmentCancellation,
        boolean confirmOwnedGroupDeletion) {
    public UpdateUserRoleRequest(Role role, String enrollmentNumber, String reason) {
        this(role, enrollmentNumber, reason, false, false);
    }
}
