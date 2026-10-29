package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;

import com.github.codehive.model.enums.AiAssistanceLevel;
import com.github.codehive.model.exception.ValidationException;

class AiPolicyRulesTest {
    @ParameterizedTest
    @ValueSource(ints = {1, 10})
    void enabledPolicyAcceptsBothQuotaBoundaries(int quota) {
        var policy = AiPolicyRules.create(true, quota, AiAssistanceLevel.EXPLANATIONS_AND_GUIDING);
        assertThat(policy.isEnabled()).isTrue();
        assertThat(policy.getMaxAiRequests()).isEqualTo(quota);
        assertThat(policy.getLevel()).isEqualTo(AiAssistanceLevel.EXPLANATIONS_AND_GUIDING);
    }

    @Test
    void disablingRequiresZeroQuotaAndPreservesChosenLevel() {
        var policy = AiPolicyRules.create(false, 0, AiAssistanceLevel.EXPLANATIONS_GUIDING_AND_SNIPPETS);
        assertThat(policy.isEnabled()).isFalse();
        assertThat(policy.getMaxAiRequests()).isZero();
        assertThat(policy.getLevel()).isEqualTo(AiAssistanceLevel.EXPLANATIONS_GUIDING_AND_SNIPPETS);
    }

    @ParameterizedTest
    @MethodSource("invalidPolicies")
    void invalidPolicyDoesNotPartiallyMutateExistingValues(Boolean enabled, Integer quota,
            AiAssistanceLevel level) {
        var policy = AiPolicyRules.create(true, 3, AiAssistanceLevel.CONCEPTUAL_ONLY);
        assertThatThrownBy(() -> AiPolicyRules.apply(policy, enabled, quota, level))
                .isInstanceOf(ValidationException.class);
        assertThat(policy.isEnabled()).isTrue();
        assertThat(policy.getMaxAiRequests()).isEqualTo(3);
        assertThat(policy.getLevel()).isEqualTo(AiAssistanceLevel.CONCEPTUAL_ONLY);
    }

    static Stream<Arguments> invalidPolicies() {
        var level = AiAssistanceLevel.EXPLANATIONS_AND_GUIDING;
        return Stream.of(Arguments.of(true, 0, level), Arguments.of(true, -1, level),
                Arguments.of(true, 11, level), Arguments.of(false, 1, level),
                Arguments.of(false, -1, level), Arguments.of(null, 1, level),
                Arguments.of(true, null, level), Arguments.of(true, 1, null));
    }
}
