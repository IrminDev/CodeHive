package com.github.codehive.model.dto.assistant;

import java.time.Instant;
import java.util.UUID;

import com.github.codehive.model.entity.AssistantInteraction;
import com.github.codehive.model.enums.AssistantInteractionStatus;

public record AssistantInteractionDTO(
        UUID id,
        long sequence,
        AssistantInteractionStatus status,
        String studentMessage,
        String assistantResponse,
        boolean contentErased,
        boolean quotaCharged,
        String failureCode,
        Instant createdAt,
        Instant completedAt) {

    public static AssistantInteractionDTO from(AssistantInteraction interaction) {
        return new AssistantInteractionDTO(
                interaction.getId(), interaction.getSequence(), interaction.getStatus(),
                interaction.getStudentMessage(), interaction.getAssistantResponse(),
                interaction.isContentErased(), interaction.isQuotaCharged(),
                interaction.getFailureCode(), interaction.getCreatedAt(), interaction.getCompletedAt());
    }
}
