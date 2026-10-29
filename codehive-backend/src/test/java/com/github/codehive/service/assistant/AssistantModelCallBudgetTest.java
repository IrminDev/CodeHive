package com.github.codehive.service.assistant;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class AssistantModelCallBudgetTest {
    @Test
    void permitsFiveCallsButCannotBeReplenishedAfterExhaustion() {
        var budget = new AssistantModelCallBudget();
        for (int i = 0; i < 5; i++) assertThatCode(budget::run).doesNotThrowAnyException();
        for (int i = 0; i < 2; i++) {
            assertThatThrownBy(budget::run).isInstanceOf(AssistantStateException.class)
                    .hasMessage("MODEL_CALL_BUDGET_EXCEEDED");
        }
    }
}
