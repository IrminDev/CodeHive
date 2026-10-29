package com.github.codehive.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.assistant.AssistantInteractionDTO;
import com.github.codehive.model.entity.AssistantConversation;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.repository.AssistantConversationRepository;
import com.github.codehive.repository.AssistantInteractionRepository;
import com.github.codehive.repository.UserRepository;

@Service
public class AssistantHistoryService {
    private final AssistantConversationRepository conversationRepository;
    private final AssistantInteractionRepository interactionRepository;
    private final UserRepository userRepository;

    public AssistantHistoryService(AssistantConversationRepository conversationRepository,
                                   AssistantInteractionRepository interactionRepository,
                                   UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.interactionRepository = interactionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<AssistantInteractionDTO> history(UUID assignmentId, int page, int size, String email) {
        if (page < 0 || size < 1 || size > 50) {
            throw new ValidationException("History page must be nonnegative and size must be 1 to 50");
        }
        User student = requireStudent(email);
        AssistantConversation conversation = requireConversation(assignmentId, student.getId());
        return interactionRepository.findByConversationIdOrderBySequenceDesc(
                conversation.getId(), PageRequest.of(page, size)).map(AssistantInteractionDTO::from);
    }

    @Transactional(readOnly = true)
    public AssistantInteractionDTO get(UUID assignmentId, UUID interactionId, String email) {
        User student = requireStudent(email);
        AssistantConversation conversation = requireConversation(assignmentId, student.getId());
        return interactionRepository.findByIdAndConversationId(interactionId, conversation.getId())
                .map(AssistantInteractionDTO::from)
                .orElseThrow(() -> new EntityNotFoundException("Assistant interaction not found"));
    }

    private AssistantConversation requireConversation(UUID assignmentId, UUID studentId) {
        return conversationRepository.findByAssignmentIdAndStudentId(assignmentId, studentId)
                .orElseThrow(() -> new EntityNotFoundException("Assistant conversation not found"));
    }

    private User requireStudent(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
        if (user.getRole() != Role.STUDENT) {
            throw new AccessDeniedException("Only students can read assistant history");
        }
        return user;
    }
}
