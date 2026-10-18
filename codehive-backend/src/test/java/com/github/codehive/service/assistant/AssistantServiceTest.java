package com.github.codehive.service.assistant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import com.github.codehive.model.dto.assistant.AssistantAvailabilityDTO;
import com.github.codehive.model.dto.assistant.AssistantInteractionDTO;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.*;
import com.github.codehive.model.request.assistant.AssistantMessageRequest;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.service.AssistantHistoryService;

@ExtendWith(MockitoExtension.class)
class AssistantServiceTest {
    private static final UUID ASSIGNMENT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID STUDENT = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID INTERACTION = UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final UUID CONVERSATION = UUID.fromString("00000000-0000-0000-0000-000000000004");
    private static final UUID REQUEST = UUID.fromString("00000000-0000-0000-0000-000000000005");
    private static final String EMAIL = "student@example.com";
    private static final AiAssistanceLevel LEVEL = AiAssistanceLevel.CONCEPTUAL_ONLY;
    @Mock private AssistantTransactionService transactions;
    @Mock private AssistantContextService contexts;
    @Mock private AssistantGuardrailService guardrails;
    @Mock private AssistantHistoryService history;
    @Mock private UserRepository users;
    private AssistantService service;
    private User student;

    @BeforeEach
    void setup() {
        student = new User();
        student.setId(STUDENT);
        student.setRole(Role.STUDENT);
        when(users.findByEmail(EMAIL)).thenReturn(Optional.of(student));
        service = service(true);
    }

    @Test
    void globalSwitchPreservesQuotaButPreventsReservations() {
        service = service(false);
        var state = new AssistantAvailabilityDTO(true, null, 5, 2, 1, 2, LEVEL, 7, INTERACTION);
        when(transactions.availability(ASSIGNMENT, STUDENT)).thenReturn(state);
        var result = service.availability(ASSIGNMENT, EMAIL);
        assertThat(result.available()).isFalse();
        assertThat(result.reason()).isEqualTo("GLOBAL_DISABLED");
        assertThat(result.used()).isEqualTo(2);
        assertThat(result.reserved()).isEqualTo(1);
        assertThat(result.remaining()).isEqualTo(2);
        assertThat(result.pendingInteractionId()).isEqualTo(INTERACTION);
        assertThatThrownBy(() -> service.ask(ASSIGNMENT, request(), EMAIL)).hasMessage("GLOBAL_DISABLED");
        verify(transactions, never()).reserve(any());
        verifyNoInteractions(contexts, guardrails);
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"TEACHER", "ADMIN"})
    void nonStudentsCannotReadAvailabilityOrAsk(Role role) {
        student.setRole(role);
        assertThatThrownBy(() -> service.availability(ASSIGNMENT, EMAIL)).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> service.ask(ASSIGNMENT, request(), EMAIL)).isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(transactions, contexts, guardrails, history);
    }

    @Test
    void nullRequestCannotReserveQuota() {
        assertThatThrownBy(() -> service.ask(ASSIGNMENT, null, EMAIL)).hasMessage("INVALID_REQUEST");
        verifyNoInteractions(transactions, contexts, guardrails);
    }

    @ParameterizedTest
    @EnumSource(AssistantInteractionStatus.class)
    void replayReturnsPersistedStateWithoutStartingNewModelWork(AssistantInteractionStatus status) {
        when(transactions.reserve(any())).thenReturn(reservation(true));
        var persisted = interaction(status);
        when(history.get(ASSIGNMENT, INTERACTION, EMAIL)).thenReturn(persisted);
        when(transactions.availability(ASSIGNMENT, STUDENT)).thenReturn(available());
        assertThat(service.ask(ASSIGNMENT, request(), EMAIL).interaction()).isEqualTo(persisted);
        verify(transactions, never()).policySnapshot(any());
        verifyNoInteractions(contexts, guardrails);
    }

    @Test
    void changedInitialPolicyCancelsBeforeBuildingOrSendingContext() {
        when(transactions.reserve(any())).thenReturn(reservation(false));
        when(transactions.policySnapshot(ASSIGNMENT))
                .thenReturn(new AssistantTransactionService.PolicySnapshot(true, 5, LEVEL, 8));
        assertThatThrownBy(() -> service.ask(ASSIGNMENT, request(), EMAIL)).hasMessage("POLICY_CHANGED");
        verify(transactions).stop(INTERACTION, AssistantInteractionStatus.CANCELLED, "POLICY_CHANGED");
        verifyNoInteractions(contexts, guardrails);
    }

    @Test
    void rejectedContextReservationPreventsModelTransmission() {
        givenContext(false);
        assertThatThrownBy(() -> service.ask(ASSIGNMENT, request(), EMAIL)).hasMessage("REQUEST_CANCELLED");
        verify(transactions).stop(INTERACTION, AssistantInteractionStatus.CANCELLED, "REQUEST_CANCELLED");
        verifyNoInteractions(guardrails);
    }

    @Test
    void unexpectedProviderFailureIsSanitizedAndStopsWithoutDelivery() {
        givenContext(true);
        when(guardrails.generate(any(), anyString(), eq(LEVEL), any(Runnable.class), eq(INTERACTION)))
                .thenThrow(new IllegalStateException("Provider secret and raw prompt"));
        assertThatThrownBy(() -> service.ask(ASSIGNMENT, request(), EMAIL))
                .isInstanceOf(AssistantStateException.class).hasMessage("MODEL_FAILURE");
        verify(transactions).stop(INTERACTION, AssistantInteractionStatus.FAILED, "MODEL_FAILURE");
        verify(transactions, never()).deliver(any(), anyLong(), any(), anyString(), anyInt());
    }

    @Test
    void knownProviderTimeoutKeepsSafeCodeAndStopsWithoutDelivery() {
        givenContext(true);
        when(guardrails.generate(any(), anyString(), eq(LEVEL), any(Runnable.class), eq(INTERACTION)))
                .thenThrow(new AssistantStateException("MODEL_TIMEOUT"));
        assertThatThrownBy(() -> service.ask(ASSIGNMENT, request(), EMAIL)).hasMessage("MODEL_TIMEOUT");
        verify(transactions).stop(INTERACTION, AssistantInteractionStatus.FAILED, "MODEL_TIMEOUT");
        verify(transactions, never()).deliver(any(), anyLong(), any(), anyString(), anyInt());
    }

    @Test
    void terminalHistoryMismatchNeverReleasesGeneratedCandidate() {
        givenContext(true);
        when(guardrails.generate(any(), anyString(), eq(LEVEL), any(Runnable.class), eq(INTERACTION)))
                .thenReturn(new AssistantGuardrailService.Decision(AssistantInteractionStatus.COMPLETED,
                        "candidate", 1, "v1"));
        when(transactions.deliver(INTERACTION, 7, AssistantInteractionStatus.COMPLETED, "candidate", 1))
                .thenReturn(AssistantTransactionService.Completion.DELIVERED);
        when(history.get(ASSIGNMENT, INTERACTION, EMAIL)).thenReturn(interaction(AssistantInteractionStatus.CANCELLED));
        assertThatThrownBy(() -> service.ask(ASSIGNMENT, request(), EMAIL)).hasMessage("REQUEST_CANCELLED");
    }

    private void givenContext(boolean accepted) {
        when(transactions.reserve(any())).thenReturn(reservation(false));
        when(transactions.policySnapshot(ASSIGNMENT))
                .thenReturn(new AssistantTransactionService.PolicySnapshot(true, 5, LEVEL, 7));
        var assignment = new AssistantContextService.PublicAssignment(ASSIGNMENT, "Loops", "Public",
                List.of(), List.of(), List.of(), List.of(Language.JAVA), List.of());
        when(contexts.build(ASSIGNMENT, STUDENT, CONVERSATION, false, null, false, LEVEL))
                .thenReturn(new AssistantContextService.Context(assignment, null, null, false, List.of(), false));
        when(transactions.markContext(INTERACTION, null)).thenReturn(accepted);
    }

    private AssistantService service(boolean enabled) {
        return new AssistantService(transactions, contexts, guardrails, history, users, enabled);
    }

    private AssistantTransactionService.Reservation reservation(boolean replay) {
        return new AssistantTransactionService.Reservation(INTERACTION, CONVERSATION,
                AssistantInteractionStatus.PENDING, replay, 0, 5, 7);
    }

    private AssistantAvailabilityDTO available() {
        return new AssistantAvailabilityDTO(true, null, 5, 0, 0, 5, LEVEL, 7, null);
    }

    private AssistantInteractionDTO interaction(AssistantInteractionStatus status) {
        return new AssistantInteractionDTO(INTERACTION, 1, status, "What is a loop?", null,
                false, false, null, Instant.parse("2026-01-01T00:00:00Z"), null);
    }

    private AssistantMessageRequest request() {
        return new AssistantMessageRequest(REQUEST, "What is a loop?", Language.JAVA, false, false, null);
    }
}
