package com.github.codehive.service.assistant;
/** Text remains untrusted. Null usage means unmeasured, never zero. */
public record AssistantModelResult(String text, String reportedModelId, Long inputTokens,
        Long outputTokens, Long totalTokens) {}
