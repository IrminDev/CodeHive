package com.github.codehive.model.dto;

import java.util.List;

import com.github.codehive.model.enums.Language;

public record AssignmentPreviewDTO(
        AssignmentDTO assignment,
        Language referenceLanguage,
        String referenceSolution,
        List<AssignmentPreviewTestCaseDTO> testCases
) {}
