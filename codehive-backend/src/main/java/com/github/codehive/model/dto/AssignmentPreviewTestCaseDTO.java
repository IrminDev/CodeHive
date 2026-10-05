package com.github.codehive.model.dto;

public record AssignmentPreviewTestCaseDTO(
        Integer order,
        String input,
        String expectedOutput,
        Boolean sample
) {}
