package com.github.codehive.model.dto;

import com.github.codehive.model.enums.AiAssistanceLevel;

public record AiPolicyDTO(boolean aiAssistanceEnabled, int maxAiRequests,
                          AiAssistanceLevel aiAssistanceLevel, long aiPolicyVersion) {
}
