package com.github.codehive.service.assistant;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentAiPolicy;
import com.github.codehive.model.entity.AssistantConversation;
import com.github.codehive.model.entity.AssistantInteraction;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.dto.assistant.AssistantAvailabilityDTO;
import com.github.codehive.model.enums.AiAssistanceLevel;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.AssistantInteractionStatus;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.repository.AssignmentAiPolicyRepository;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.AssistantConversationRepository;
import com.github.codehive.repository.AssistantInteractionRepository;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.UserRepository;

import jakarta.persistence.EntityManager;

/** Short database transactions only. Model calls and guardrail review belong outside this service. */
@Service
public class AssistantTransactionService {
    private static final Duration DEFAULT_LEASE = Duration.ofMinutes(3);

    private final AssignmentRepository assignmentRepository;
    private final AssignmentAiPolicyRepository policyRepository;
    private final AssistantConversationRepository conversationRepository;
    private final AssistantInteractionRepository interactionRepository;
    private final ClassGroupRepository groupRepository;
    private final GroupEnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final EntityManager entityManager;
    private final Clock clock;

    public AssistantTransactionService(AssignmentRepository assignmentRepository,
            AssignmentAiPolicyRepository policyRepository, AssistantConversationRepository conversationRepository,
            AssistantInteractionRepository interactionRepository, ClassGroupRepository groupRepository,
            GroupEnrollmentRepository enrollmentRepository, UserRepository userRepository,
            EntityManager entityManager, @Qualifier("assistantClock") Clock clock) {
        this.assignmentRepository = assignmentRepository;
        this.policyRepository = policyRepository;
        this.conversationRepository = conversationRepository;
        this.interactionRepository = interactionRepository;
        this.groupRepository = groupRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.entityManager = entityManager;
        this.clock = clock;
    }

    public record Request(UUID assignmentId, UUID studentId, UUID clientRequestId, String message,
                          Language language, boolean includeEditorCode, String editorCode,
                          boolean includeExecutionContext) {}

    public record Reservation(UUID interactionId, UUID conversationId, AssistantInteractionStatus status,
                              boolean replay, long used, int maximum, long policyVersion) {}

    public enum Completion { DELIVERED, ALREADY_FINISHED, CANCELLED, POLICY_CHANGED }

    public record PolicySnapshot(boolean enabled, int maximum, AiAssistanceLevel level, long version) {}

    @Transactional(readOnly = true)
    public UUID executionContextId(UUID interactionId) {
        return interactionRepository.findById(interactionId)
                .orElseThrow(() -> new EntityNotFoundException("Assistant interaction not found"))
                .getExecutionId();
    }

    @Transactional
    public boolean markContext(UUID interactionId, UUID executionId) {
        AssistantInteraction interaction = activeInteraction(interactionId);
        if (interaction == null) return false;
        interaction.setExecutionId(executionId);
        return true;
    }

    @Transactional
    public boolean eligibleForModel(UUID interactionId) {
        return activeInteraction(interactionId) != null;
    }

    private AssistantInteraction activeInteraction(UUID interactionId) {
        AssistantInteraction interaction = interactionRepository.findById(interactionId)
                .orElseThrow(() -> new EntityNotFoundException("Assistant interaction not found"));
        Assignment assignment = interaction.getConversation().getAssignment();
        ClassGroup group = lockGroup(assignment.getGroup().getId());
        conversationRepository.findLockedById(interaction.getConversation().getId()).orElseThrow();
        entityManager.refresh(interaction);
        entityManager.refresh(group);
        entityManager.refresh(assignment);
        if (interaction.getStatus() != AssistantInteractionStatus.PENDING
                || interaction.getLeaseExpiresAt() == null
                || !interaction.getLeaseExpiresAt().isAfter(clock.instant())
                || !eligible(assignment, group, interaction.getConversation().getStudent().getId(),
                        interaction.getLanguage())) return null;
        AssignmentAiPolicy policy = policyRepository.findByIdForUpdate(assignment.getId()).orElse(null);
        if (policy == null) return null;
        entityManager.refresh(policy);
        return policy.isEnabled() && interactionRepository.countByConversationIdAndQuotaChargedTrue(
                interaction.getConversation().getId()) < policy.getMaxAiRequests() ? interaction : null;
    }

    @Transactional(readOnly = true)
    public PolicySnapshot policySnapshot(UUID assignmentId) {
        AssignmentAiPolicy policy = policyRepository.findById(assignmentId)
                .orElseThrow(() -> new AssistantStateException("POLICY_CHANGED"));
        entityManager.refresh(policy);
        return new PolicySnapshot(policy.isEnabled(), policy.getMaxAiRequests(),
                policy.getLevel(), policy.getVersion());
    }

    @Transactional(readOnly = true)
    public AssistantAvailabilityDTO availability(UUID assignmentId, UUID studentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found"));
        ClassGroup group = assignment.getGroup();
        AssistantConversation conversation = conversationRepository
                .findByAssignmentIdAndStudentId(assignmentId, studentId).orElse(null);
        User student = userRepository.findById(studentId).orElse(null);
        if (student == null || student.getRole() != Role.STUDENT
                || (conversation == null && !enrollmentRepository.existsByGroupIdAndStudentIdAndStatus(
                        group.getId(), studentId, EnrollmentStatus.ACTIVE))) {
            throw new EntityNotFoundException("Assignment not found");
        }
        AssignmentAiPolicy policy = policyRepository.findById(assignmentId).orElse(null);
        if (policy != null) entityManager.refresh(policy);
        int maximum = policy == null ? 0 : policy.getMaxAiRequests();
        long used = conversation == null ? 0 : interactionRepository
                .countByConversationIdAndQuotaChargedTrue(conversation.getId());
        AssistantInteraction pending = conversation == null ? null : interactionRepository
                .findFirstByConversationIdAndStatus(conversation.getId(), AssistantInteractionStatus.PENDING)
                .filter(item -> item.getLeaseExpiresAt() != null
                        && item.getLeaseExpiresAt().isAfter(clock.instant())).orElse(null);
        boolean eligible = eligible(assignment, group, studentId, null);
        String reason = !eligible ? "ASSISTANCE_UNAVAILABLE"
                : policy == null || !policy.isEnabled() ? "ASSISTANT_DISABLED"
                : used >= maximum ? "QUOTA_EXHAUSTED"
                : pending != null ? "REQUEST_PENDING" : null;
        return new AssistantAvailabilityDTO(reason == null, reason, maximum, used,
                pending == null ? 0 : 1, Math.max(0, maximum - used - (pending == null ? 0 : 1)),
                policy == null ? null : policy.getLevel(), policy == null ? 0 : policy.getVersion(),
                pending == null ? null : pending.getId());
    }

    @Transactional
    public Reservation reserve(Request request) {
        validate(request);
        Assignment assignment = assignmentRepository.findById(request.assignmentId())
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found"));
        // Group lock serializes first-conversation creation, archive purge, and finalization.
        ClassGroup group = lockGroup(assignment.getGroup().getId());
        AssistantConversation conversation = conversationRepository
                .findByAssignmentIdAndStudentId(assignment.getId(), request.studentId()).orElse(null);
        String fingerprint = AssistantRequestFingerprint.of(request.message(), request.language(),
                request.includeEditorCode(), request.editorCode(), request.includeExecutionContext());
        if (conversation != null) {
            conversation = conversationRepository.findLockedById(conversation.getId()).orElseThrow();
            AssistantInteraction prior = interactionRepository
                    .findByConversationIdAndClientRequestId(conversation.getId(), request.clientRequestId()).orElse(null);
            if (prior != null) {
                if (!prior.getRequestFingerprint().equals(fingerprint)) {
                    throw new AssistantStateException("IDEMPOTENCY_CONFLICT");
                }
                AssignmentAiPolicy current = policyRepository.findById(assignment.getId()).orElse(null);
                return snapshot(prior, conversation.getId(), true,
                        current == null ? 0 : current.getMaxAiRequests(),
                        current == null ? 0 : current.getVersion());
            }
        }
        requireEligible(assignment, group, request.studentId(), request.language());
        AssignmentAiPolicy policy = policyRepository.findByIdForUpdate(assignment.getId())
                .orElseThrow(() -> new AssistantStateException("ASSISTANT_DISABLED"));
        entityManager.refresh(policy);
        if (!policy.isEnabled()) throw new AssistantStateException("ASSISTANT_DISABLED");
        if (conversation == null) {
            conversation = new AssistantConversation();
            conversation.setAssignment(assignment);
            conversation.setStudent(userRepository.getReferenceById(request.studentId()));
            conversation = conversationRepository.saveAndFlush(conversation);
        }
        expirePending(conversation.getId());
        long used = interactionRepository.countByConversationIdAndQuotaChargedTrue(conversation.getId());
        if (used >= policy.getMaxAiRequests()) throw new AssistantStateException("QUOTA_EXHAUSTED");
        if (interactionRepository.findFirstByConversationIdAndStatus(
                conversation.getId(), AssistantInteractionStatus.PENDING).isPresent()) {
            throw new AssistantStateException("REQUEST_PENDING");
        }
        AssistantInteraction interaction = new AssistantInteraction();
        interaction.setConversation(conversation);
        interaction.setSequence(conversation.getNextSequence());
        interaction.setClientRequestId(request.clientRequestId());
        interaction.setRequestFingerprint(fingerprint);
        interaction.setStudentMessage(request.message());
        interaction.setLanguage(request.language());
        interaction.setEditorContextIncluded(request.includeEditorCode());
        interaction.setExecutionContextIncluded(request.includeExecutionContext());
        interaction.setRequestedPolicyVersion(policy.getVersion());
        interaction.setRequestedAssistanceLevel(policy.getLevel());
        interaction.setLeaseExpiresAt(clock.instant().plus(DEFAULT_LEASE));
        conversation.setNextSequence(conversation.getNextSequence() + 1);
        conversation.setUpdatedAt(clock.instant());
        interactionRepository.saveAndFlush(interaction);
        return new Reservation(interaction.getId(), conversation.getId(), AssistantInteractionStatus.PENDING,
                false, used, policy.getMaxAiRequests(), policy.getVersion());
    }

    @Transactional
    public Completion deliver(UUID interactionId, long checkedPolicyVersion,
                              AssistantInteractionStatus status, String validatedResponseJson,
                              int generationAttempts) {
        if (status != AssistantInteractionStatus.COMPLETED && status != AssistantInteractionStatus.REDIRECTED) {
            throw new ValidationException("Only validated answers and redirections can be delivered");
        }
        if (validatedResponseJson == null || validatedResponseJson.isBlank()
                || generationAttempts < 0 || generationAttempts > 2) {
            throw new ValidationException("Invalid validated assistant response");
        }
        AssistantInteraction interaction = interactionRepository.findById(interactionId)
                .orElseThrow(() -> new EntityNotFoundException("Assistant interaction not found"));
        Assignment assignment = interaction.getConversation().getAssignment();
        ClassGroup group = lockGroup(assignment.getGroup().getId());
        AssistantConversation conversation = conversationRepository
                .findLockedById(interaction.getConversation().getId()).orElseThrow();
        entityManager.refresh(interaction);
        if (interaction.getStatus() != AssistantInteractionStatus.PENDING) return Completion.ALREADY_FINISHED;
        if (interaction.getLeaseExpiresAt() == null || !interaction.getLeaseExpiresAt().isAfter(clock.instant())) {
            failPending(interaction, "LEASE_EXPIRED");
            return Completion.CANCELLED;
        }
        if (!eligible(assignment, group, conversation.getStudent().getId(), interaction.getLanguage())) {
            failPending(interaction, "ELIGIBILITY_CHANGED");
            return Completion.CANCELLED;
        }
        AssignmentAiPolicy policy = policyRepository.findByIdForUpdate(assignment.getId()).orElse(null);
        if (policy != null) entityManager.refresh(policy);
        if (policy == null || !policy.isEnabled()) {
            failPending(interaction, "POLICY_CHANGED");
            return Completion.CANCELLED;
        }
        if (policy.getVersion() != checkedPolicyVersion) return Completion.POLICY_CHANGED;
        long used = interactionRepository.countByConversationIdAndQuotaChargedTrue(conversation.getId());
        if (used >= policy.getMaxAiRequests()) {
            failPending(interaction, "QUOTA_EXHAUSTED");
            return Completion.CANCELLED;
        }
        interaction.setAssistantResponse(validatedResponseJson);
        interaction.setStatus(status);
        interaction.setQuotaCharged(true);
        interaction.setCompletedPolicyVersion(policy.getVersion());
        interaction.setCompletedAssistanceLevel(policy.getLevel());
        interaction.setGenerationAttempts(generationAttempts);
        interaction.setLeaseExpiresAt(null);
        interaction.setCompletedAt(clock.instant());
        return Completion.DELIVERED;
    }

    @Transactional
    public void stop(UUID interactionId, AssistantInteractionStatus status, String safeCode) {
        if (status != AssistantInteractionStatus.BLOCKED && status != AssistantInteractionStatus.FAILED
                && status != AssistantInteractionStatus.CANCELLED) {
            throw new ValidationException("Invalid terminal assistant status");
        }
        if (safeCode == null || !safeCode.matches("[A-Z0-9_]{1,60}")) {
            throw new ValidationException("Invalid assistant failure code");
        }
        AssistantInteraction interaction = interactionRepository.findById(interactionId)
                .orElseThrow(() -> new EntityNotFoundException("Assistant interaction not found"));
        lockGroup(interaction.getConversation().getAssignment().getGroup().getId());
        conversationRepository.findLockedById(interaction.getConversation().getId()).orElseThrow();
        entityManager.refresh(interaction);
        if (interaction.getStatus() == AssistantInteractionStatus.PENDING) failPending(interaction, safeCode, status);
    }

    public List<UUID> expiredIds() {
        return interactionRepository.findByStatusAndLeaseExpiresAtBefore(
                AssistantInteractionStatus.PENDING, clock.instant(), PageRequest.of(0, 100))
                .stream().map(AssistantInteraction::getId).toList();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recoverOne(UUID interactionId) {
        AssistantInteraction interaction = interactionRepository.findById(interactionId).orElse(null);
        if (interaction == null) return;
        lockGroup(interaction.getConversation().getAssignment().getGroup().getId());
        conversationRepository.findLockedById(interaction.getConversation().getId()).orElseThrow();
        entityManager.refresh(interaction);
        if (interaction.getStatus() == AssistantInteractionStatus.PENDING
                && interaction.getLeaseExpiresAt() != null
                && !interaction.getLeaseExpiresAt().isAfter(clock.instant())) {
            failPending(interaction, "LEASE_EXPIRED");
        }
    }

    private void expirePending(UUID conversationId) {
        interactionRepository.findFirstByConversationIdAndStatus(conversationId, AssistantInteractionStatus.PENDING)
                .filter(item -> item.getLeaseExpiresAt() != null
                        && !item.getLeaseExpiresAt().isAfter(clock.instant()))
                .ifPresent(item -> failPending(item, "LEASE_EXPIRED"));
        entityManager.flush();
    }

    private void failPending(AssistantInteraction interaction, String code) {
        failPending(interaction, code, AssistantInteractionStatus.FAILED);
    }

    private void failPending(AssistantInteraction interaction, String code, AssistantInteractionStatus status) {
        interaction.setStatus(status);
        interaction.setFailureCode(code);
        interaction.setQuotaCharged(false);
        interaction.setAssistantResponse(null);
        interaction.setExecutionId(null);
        interaction.setLeaseExpiresAt(null);
        interaction.setCompletedAt(clock.instant());
    }

    private Reservation snapshot(AssistantInteraction interaction, UUID conversationId,
                                 boolean replay, int maximum, long policyVersion) {
        return new Reservation(interaction.getId(), conversationId, interaction.getStatus(), replay,
                interactionRepository.countByConversationIdAndQuotaChargedTrue(conversationId),
                maximum, policyVersion);
    }

    private ClassGroup lockGroup(UUID id) {
        return groupRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new EntityNotFoundException("Group not found"));
    }

    private void requireEligible(Assignment assignment, ClassGroup group, UUID studentId, Language language) {
        if (!eligible(assignment, group, studentId, language)) {
            throw new AssistantStateException("ASSISTANCE_UNAVAILABLE");
        }
    }

    private boolean eligible(Assignment assignment, ClassGroup group, UUID studentId, Language language) {
        User user = userRepository.findById(studentId).orElse(null);
        if (user != null) entityManager.refresh(user);
        Instant now = clock.instant();
        return user != null && user.getRole() == Role.STUDENT && user.canParticipate()
                && Boolean.TRUE.equals(group.getIsActive()) && !Boolean.TRUE.equals(group.getArchived())
                && Boolean.TRUE.equals(assignment.getIsActive())
                && assignment.getValidationStatus() == AssignmentValidationStatus.READY
                && (language == null || assignment.getAllowedLanguages().contains(language))
                && (assignment.getLaunchDate() == null || !assignment.getLaunchDate().isAfter(now))
                && (assignment.getCloseDate() == null || assignment.getCloseDate().isAfter(now))
                && enrollmentRepository.existsByGroupIdAndStudentIdAndStatus(
                        group.getId(), studentId, EnrollmentStatus.ACTIVE);
    }

    private void validate(Request request) {
        if (request == null || request.assignmentId() == null || request.studentId() == null
                || request.clientRequestId() == null || request.language() == null
                || request.message() == null || request.message().isBlank() || request.message().length() > 2000
                || (request.includeEditorCode() && (request.editorCode() == null
                        || request.editorCode().isBlank() || request.editorCode().length() > 32768))
                || (!request.includeEditorCode() && request.editorCode() != null
                        && !request.editorCode().isEmpty())) {
            throw new ValidationException("Invalid assistant request");
        }
    }
}
