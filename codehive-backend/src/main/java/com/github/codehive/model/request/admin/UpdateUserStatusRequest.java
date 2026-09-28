package com.github.codehive.model.request.admin;

import com.github.codehive.model.enums.AdminUserStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateUserStatusRequest(
        @NotNull AdminUserStatus status,
        @NotBlank @Size(min = 10, max = 500) String reason) {
}
