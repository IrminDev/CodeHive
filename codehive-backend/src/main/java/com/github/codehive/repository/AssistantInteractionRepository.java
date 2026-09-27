package com.github.codehive.repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.github.codehive.model.entity.AssistantInteraction;

public interface AssistantInteractionRepository extends JpaRepository<AssistantInteraction, UUID> {
    Page<AssistantInteraction> findByConversationIdOrderBySequenceDesc(UUID conversationId, Pageable pageable);
    Optional<AssistantInteraction> findByIdAndConversationId(UUID interactionId, UUID conversationId);
    Optional<AssistantInteraction> findByConversationIdAndClientRequestId(UUID conversationId, UUID clientRequestId);
    long countByConversationIdAndQuotaChargedTrue(UUID conversationId);
    Optional<AssistantInteraction> findFirstByConversationIdAndStatus(
            UUID conversationId, com.github.codehive.model.enums.AssistantInteractionStatus status);
    java.util.List<AssistantInteraction> findByStatusAndLeaseExpiresAtBefore(
            com.github.codehive.model.enums.AssistantInteractionStatus status, Instant cutoff,
            org.springframework.data.domain.Pageable pageable);
    java.util.List<AssistantInteraction> findByConversationIdAndStatusInOrderBySequenceDesc(
            UUID conversationId, java.util.Collection<com.github.codehive.model.enums.AssistantInteractionStatus> statuses,
            org.springframework.data.domain.Pageable pageable);

    @Modifying(flushAutomatically = true)
    @Query("""
            update AssistantInteraction interaction
            set interaction.status = com.github.codehive.model.enums.AssistantInteractionStatus.CANCELLED,
                interaction.failureCode = 'GROUP_ARCHIVED', interaction.completedAt = :now
            where interaction.conversation.id in (
                select conversation.id from AssistantConversation conversation
                where conversation.assignment.group.id = :groupId)
              and interaction.status = com.github.codehive.model.enums.AssistantInteractionStatus.PENDING
            """)
    int cancelPendingForGroup(@Param("groupId") UUID groupId, @Param("now") Instant now);

    @Modifying(flushAutomatically = true)
    @Query("""
            update AssistantInteraction interaction
            set interaction.studentMessage = null, interaction.assistantResponse = null,
                interaction.executionId = null,
                interaction.contentErased = true
            where interaction.conversation.id in (
                select conversation.id from AssistantConversation conversation
                where conversation.assignment.group.id = :groupId)
            """)
    int eraseContentForGroup(@Param("groupId") UUID groupId);
}
