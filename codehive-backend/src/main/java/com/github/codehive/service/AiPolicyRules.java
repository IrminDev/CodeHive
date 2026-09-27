package com.github.codehive.service;

import com.github.codehive.model.entity.AssignmentAiPolicy;
import com.github.codehive.model.enums.AiAssistanceLevel;
import com.github.codehive.model.exception.ValidationException;

public final class AiPolicyRules {
    private AiPolicyRules() {
    }

    public static AssignmentAiPolicy create(Boolean enabled, Integer maximum, AiAssistanceLevel level) {
        validate(enabled, maximum, level);
        AssignmentAiPolicy policy = new AssignmentAiPolicy();
        apply(policy, enabled, maximum, level);
        return policy;
    }

    public static void apply(AssignmentAiPolicy policy, Boolean enabled, Integer maximum,
                             AiAssistanceLevel level) {
        validate(enabled, maximum, level);
        policy.setEnabled(enabled);
        policy.setMaxAiRequests(maximum);
        policy.setLevel(level);
    }

    private static void validate(Boolean enabled, Integer maximum, AiAssistanceLevel level) {
        if (enabled == null || maximum == null || level == null) {
            throw new ValidationException("AI assistance policy requires enabled, maxAiRequests, and level");
        }
        if (enabled && (maximum < 1 || maximum > 10)) {
            throw new ValidationException("Enabled AI assistance requires 1 to 10 requests");
        }
        if (!enabled && maximum != 0) {
            throw new ValidationException("Disabled AI assistance requires zero requests");
        }
    }
}
