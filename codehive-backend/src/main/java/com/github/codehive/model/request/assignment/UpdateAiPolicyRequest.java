package com.github.codehive.model.request.assignment;

import com.github.codehive.model.enums.AiAssistanceLevel;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateAiPolicyRequest(
        @NotNull Boolean aiAssistanceEnabled,
        @NotNull @Min(0) @Max(10) Integer maxAiRequests,
        @NotNull AiAssistanceLevel aiAssistanceLevel) {
}
