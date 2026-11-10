package com.github.codehive.service.assistant;

import java.util.concurrent.atomic.AtomicInteger;

/** Shared across all model stages of one interaction; never replenished by a retry. */
final class AssistantModelCallBudget implements Runnable {
    private static final int MAXIMUM = 5;
    private final AtomicInteger calls = new AtomicInteger();

    @Override
    public void run() {
        if (calls.incrementAndGet() > MAXIMUM) {
            throw new AssistantStateException("MODEL_CALL_BUDGET_EXCEEDED");
        }
    }
}
