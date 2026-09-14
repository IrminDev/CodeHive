package com.github.codehive.model.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.Language;

public record CloneAssignmentFormDTO(
        UUID sourceGroupId,
        String title,
        String description,
        List<String> constraints,
        List<String> hints,
        List<String> tags,
        Long timeLimitMs,
        Long memoryLimitMb,
        ComparatorType comparatorType,
        List<Language> allowedLanguages,
        Language referenceLanguage,
        String referenceSolution,
        List<AssignmentExampleDTO> examples,
        List<CloneAssignmentTestCaseDTO> testCases,
        BigDecimal maxPoints
) {}
