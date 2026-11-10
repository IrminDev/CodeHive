package com.github.codehive.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.repository.AssistantInteractionRepository;

@Service
public class AssistantTextPurgeService {
    private final AssistantInteractionRepository interactionRepository;

    public AssistantTextPurgeService(AssistantInteractionRepository interactionRepository) {
        this.interactionRepository = interactionRepository;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void eraseGroup(UUID groupId) {
        interactionRepository.cancelPendingForGroup(groupId, Instant.now());
        interactionRepository.eraseContentForGroup(groupId);
    }
}
