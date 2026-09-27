package com.github.codehive.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.github.codehive.model.entity.AssistantConversation;


public interface AssistantConversationRepository extends JpaRepository<AssistantConversation, UUID> {
    Optional<AssistantConversation> findByAssignmentIdAndStudentId(UUID assignmentId, UUID studentId);

    @Query(value = "select * from assistant_conversations where id = :id for update", nativeQuery = true)
    Optional<AssistantConversation> findLockedById(@Param("id") UUID id);
}
