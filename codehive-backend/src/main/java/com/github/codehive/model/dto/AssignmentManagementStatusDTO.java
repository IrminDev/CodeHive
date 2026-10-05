package com.github.codehive.model.dto;

import java.util.List;
import java.util.UUID;

import com.github.codehive.model.enums.AssignmentValidationStatus;

public record AssignmentManagementStatusDTO(
        UUID assignmentId,
        AssignmentValidationStatus validationStatus,
        String validationFailureMessage,
        List<AssignmentUpdateDTO> updates,
        ReevaluationBatchDTO reevaluation) {
}
