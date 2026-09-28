package com.github.codehive.model.dto;

import java.util.UUID;

public record BulkGradeReturnDTO(UUID assignmentId, long returnedCount) {
}
