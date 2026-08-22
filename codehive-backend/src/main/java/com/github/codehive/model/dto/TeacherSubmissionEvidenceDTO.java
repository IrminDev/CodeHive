package com.github.codehive.model.dto;

import java.time.LocalDateTime;
import java.time.Instant;
import java.util.UUID;

import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.SubmissionStatus;

public record TeacherSubmissionEvidenceDTO(
        UUID submissionId,
        UUID assignmentId,
        UUID studentId,
        Language language,
        LocalDateTime submittedAt,
        Boolean deliveredLate,
        SubmissionStatus status,
        Instant withdrawnAt,
        String sourceCode,
        ExecutionDTO execution,
        boolean reportAvailable) {
}
