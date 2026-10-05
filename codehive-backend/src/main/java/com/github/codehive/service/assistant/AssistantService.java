package com.github.codehive.service.assistant;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.github.codehive.model.dto.assistant.AssistantAvailabilityDTO;
import com.github.codehive.model.dto.assistant.AssistantMessageResultDTO;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AssistantInteractionStatus;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.request.assistant.AssistantMessageRequest;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.service.AssistantHistoryService;

/** Coordinates short ledger transactions with model calls outside any transaction. */
@Service
public class AssistantService {
    private static final Logger logger = LoggerFactory.getLogger(AssistantService.class);
    private final AssistantTransactionService transactions;
    private final AssistantContextService contexts;
    private final AssistantGuardrailService guardrails;
    private final AssistantHistoryService history;
    private final UserRepository users;
    private final boolean enabled;

    public AssistantService(AssistantTransactionService transactions, AssistantContextService contexts,
            AssistantGuardrailService guardrails, AssistantHistoryService history,
            UserRepository users,
            @Value("${assistant.enabled:false}") boolean enabled) {
        this.transactions = transactions;
        this.contexts = contexts;
        this.guardrails = guardrails;
        this.history = history;
        this.users = users;
        this.enabled = enabled;
    }

    public AssistantAvailabilityDTO availability(UUID assignmentId, String email) {
        AssistantAvailabilityDTO state = transactions.availability(assignmentId, student(email).getId());
        return enabled ? state : new AssistantAvailabilityDTO(false, "GLOBAL_DISABLED", state.maximum(),
                state.used(), state.reserved(), state.remaining(), state.assistanceLevel(),
                state.policyVersion(), state.pendingInteractionId());
    }

    public AssistantMessageResultDTO ask(UUID assignmentId, AssistantMessageRequest request, String email) {
        User student = student(email);
        if (!enabled) throw new AssistantStateException("GLOBAL_DISABLED");
        if (request == null) throw new AssistantStateException("INVALID_REQUEST");
        var reservation = transactions.reserve(new AssistantTransactionService.Request(assignmentId,
                student.getId(), request.clientRequestId(), request.message(), request.language(),
                request.includeEditorCode(), request.editorCode(), request.includeExecutionContext()));
        if (reservation.replay()) return result(assignmentId, reservation.interactionId(), email,
                null, request);

        long startedNanos = System.nanoTime();
        AssistantContextService.Context context = null;
        try {
            var policy = transactions.policySnapshot(assignmentId);
            if (!policy.enabled()) throw new AssistantStateException("POLICY_CHANGED");
            context = contexts.build(assignmentId, student.getId(), reservation.conversationId(),
                    request.includeEditorCode(), request.editorCode(), request.includeExecutionContext(),
                    policy.level());
            if (!transactions.markContext(reservation.interactionId(),
                    context.execution() == null ? null : context.execution().id())) {
                transactions.stop(reservation.interactionId(), AssistantInteractionStatus.CANCELLED,
                        "REQUEST_CANCELLED");
                throw new AssistantStateException("REQUEST_CANCELLED");
            }
            Runnable beforeModelCall = () -> ensureBeforeModel(reservation.interactionId());
            var decision = guardrails.generate(context, request.message(), policy.level(), beforeModelCall, reservation.interactionId());
            if (decision.status() == AssistantInteractionStatus.BLOCKED) {
                transactions.stop(reservation.interactionId(), AssistantInteractionStatus.BLOCKED,
                        "INPUT_BLOCKED");
                if (history.get(assignmentId, reservation.interactionId(), email).status()
                        != AssistantInteractionStatus.BLOCKED) {
                    throw new AssistantStateException("REQUEST_CANCELLED");
                }
                var response = result(assignmentId, reservation.interactionId(), email, context, request);
                logOutcome(assignmentId, reservation.interactionId(), response.interaction().status(),
                        0, startedNanos, "INPUT_BLOCKED");
                return response;
            }
            for (int check = 0; check < 2; check++) {
                var completion = transactions.deliver(reservation.interactionId(), policy.version(),
                        decision.status(), decision.validatedResponseJson(), decision.generationAttempts());
                if (completion == AssistantTransactionService.Completion.DELIVERED
                        || completion == AssistantTransactionService.Completion.ALREADY_FINISHED) {
                    var persisted = history.get(assignmentId, reservation.interactionId(), email);
                    if (persisted.status() != AssistantInteractionStatus.COMPLETED
                            && persisted.status() != AssistantInteractionStatus.REDIRECTED) {
                        throw new AssistantStateException("REQUEST_CANCELLED");
                    }
                    var response = result(assignmentId, reservation.interactionId(), email, context, request);
                    logOutcome(assignmentId, reservation.interactionId(), response.interaction().status(),
                            decision.generationAttempts(), startedNanos, "NONE");
                    return response;
                }
                if (completion == AssistantTransactionService.Completion.CANCELLED) {
                    throw new AssistantStateException("REQUEST_CANCELLED");
                }
                policy = transactions.policySnapshot(assignmentId);
                context = contexts.build(assignmentId, student.getId(), reservation.conversationId(),
                        request.includeEditorCode(), request.editorCode(),
                        request.includeExecutionContext(), policy.level());
                if (!policy.enabled() || !guardrails.revalidate(context, request.message(),
                        policy.level(), decision.validatedResponseJson(), beforeModelCall, reservation.interactionId())) {
                    transactions.stop(reservation.interactionId(), AssistantInteractionStatus.CANCELLED,
                            "POLICY_CHANGED");
                    throw new AssistantStateException("POLICY_CHANGED");
                }
            }
            transactions.stop(reservation.interactionId(), AssistantInteractionStatus.CANCELLED,
                    "POLICY_CHANGED");
            throw new AssistantStateException("POLICY_CHANGED");
        } catch (AssistantStateException exception) {
            if (!exception.getCode().equals("REQUEST_CANCELLED")) {
                AssistantInteractionStatus status = exception.getCode().equals("POLICY_CHANGED")
                        ? AssistantInteractionStatus.CANCELLED : AssistantInteractionStatus.FAILED;
                transactions.stop(reservation.interactionId(), status, exception.getCode());
            }
            logOutcome(assignmentId, reservation.interactionId(),
                    exception.getCode().equals("POLICY_CHANGED") || exception.getCode().equals("REQUEST_CANCELLED")
                            ? AssistantInteractionStatus.CANCELLED : AssistantInteractionStatus.FAILED,
                    0, startedNanos, exception.getCode());
            throw exception;
        } catch (RuntimeException exception) {
            transactions.stop(reservation.interactionId(), AssistantInteractionStatus.FAILED,
                    "MODEL_FAILURE");
            logOutcome(assignmentId, reservation.interactionId(), AssistantInteractionStatus.FAILED,
                    0, startedNanos, "MODEL_FAILURE");
            throw new AssistantStateException("MODEL_FAILURE");
        }
    }

    private void logOutcome(UUID assignmentId, UUID interactionId, AssistantInteractionStatus status,
            int attempts, long startedNanos, String failureCode) {
        logger.info("assistant outcome assignmentId={} interactionId={} status={} attempts={} durationMs={} failureCode={}",
                assignmentId, interactionId, status, attempts,
                java.util.concurrent.TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedNanos), failureCode);
    }

    private AssistantMessageResultDTO result(UUID assignmentId, UUID interactionId, String email,
            AssistantContextService.Context context, AssistantMessageRequest request) {
        boolean executionIncluded = context == null
                ? transactions.executionContextId(interactionId) != null : context.execution() != null;
        return new AssistantMessageResultDTO(history.get(assignmentId, interactionId, email),
                availability(assignmentId, email), request.includeEditorCode(),
                request.includeExecutionContext(), executionIncluded,
                request.includeExecutionContext() && !executionIncluded,
                context != null && context.historyTruncated());
    }

    private void ensureBeforeModel(UUID interactionId) {
        if (!transactions.eligibleForModel(interactionId)) {
            transactions.stop(interactionId, AssistantInteractionStatus.CANCELLED, "REQUEST_CANCELLED");
            throw new AssistantStateException("REQUEST_CANCELLED");
        }
    }

    private User student(String email) {
        User user = users.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
        if (user.getRole() != Role.STUDENT) {
            throw new org.springframework.security.access.AccessDeniedException("Only students may use assistant");
        }
        return user;
    }
}
