package com.github.codehive.model.request.assistant;

import java.util.UUID;

import com.github.codehive.model.enums.Language;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AssistantMessageRequest(
        @NotNull UUID clientRequestId,
        @NotBlank @Size(max = 2000) String message,
        @NotNull Language language,
        boolean includeEditorCode,
        boolean includeExecutionContext,
        String editorCode) {}
