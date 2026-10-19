package com.github.codehive.model.dto;

import java.util.UUID;

import com.github.codehive.model.enums.Language;

public record StudentSubmissionSourceDTO(
        UUID submissionId,
        UUID assignmentId,
        Language language,
        String sourceCode
) {}
