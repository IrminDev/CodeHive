package com.github.codehive.model.dto.assistant;

public record AssistantMessageResultDTO(AssistantInteractionDTO interaction,
        AssistantAvailabilityDTO availability, boolean editorIncluded,
        boolean executionRequested, boolean executionIncluded,
        boolean executionUnavailable, boolean historyTruncated) {}
