package com.github.codehive.model.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.github.codehive.model.enums.StudentWorkStatus;

public record StudentAssignmentWorkDTO(
        UUID id,
        UUID assignmentId,
        UUID studentId,
        UUID currentSubmissionId,
        StudentWorkStatus status,
        AssignmentGradeDTO grade,
        List<SubmissionDTO> submissions,
        Instant updatedAt
) {
}
