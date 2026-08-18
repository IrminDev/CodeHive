package com.github.codehive.model.dto;

import java.util.UUID;

/**
 * Minimal student identity exposed by the group roster. Never include email,
 * scopes, or account flags here: the roster is visible to enrolled classmates.
 */
public record EnrollmentStudentDTO(UUID id, String fullName, String enrollmentNumber) {
}
