package com.github.codehive.service.assistant;
import java.util.UUID;
import com.github.codehive.model.enums.AssistantModelCallStage;
public record AssistantModelCallContext(UUID interactionId, AssistantModelCallStage stage,
        Integer generationAttempt, String promptVersion) {}
