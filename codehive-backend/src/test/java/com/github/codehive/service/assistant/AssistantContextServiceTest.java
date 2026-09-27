package com.github.codehive.service.assistant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssistantConversation;
import com.github.codehive.model.entity.AssistantInteraction;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AiAssistanceLevel;
import com.github.codehive.model.enums.AssistantInteractionStatus;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.model.enums.Language;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.AssistantConversationRepository;
import com.github.codehive.repository.AssistantInteractionRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.service.ObjectStorageService;

class AssistantContextServiceTest {
    private static final UUID ASSIGNMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID STUDENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID EXECUTION_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final UUID CONVERSATION_ID = UUID.fromString("00000000-0000-0000-0000-000000000004");

    private AssignmentRepository assignments;
    private ExecutionRepository executions;
    private AssistantInteractionRepository interactions;
    private AssistantConversationRepository conversations;
    private ObjectStorageService storage;
    private AssistantContextService service;
    private Assignment assignment;

    @BeforeEach
    void setup() {
        assignments = mock(AssignmentRepository.class);
        executions = mock(ExecutionRepository.class);
        interactions = mock(AssistantInteractionRepository.class);
        conversations = mock(AssistantConversationRepository.class);
        storage = mock(ObjectStorageService.class);
        Clock clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
        service = new AssistantContextService(assignments, executions, interactions, conversations,
                storage, new ObjectMapper(), clock);
        assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        assignment.setTitle("Public title");
        assignment.setDescription("Public description");
        assignment.setAllowedLanguages(List.of(Language.JAVA));
        when(assignments.findById(ASSIGNMENT_ID)).thenReturn(Optional.of(assignment));
    }

    @Test
    void optOutSendsOnlyPublicAssignmentAndDoesNotReadExecutionArtifacts() {
        var context = service.build(ASSIGNMENT_ID, STUDENT_ID, null, false, null, false,
                AiAssistanceLevel.CONCEPTUAL_ONLY);
        assertThat(context.assignment().description()).isEqualTo("Public description");
        assertThat(context.editorCode()).isNull();
        assertThat(context.execution()).isNull();
        verifyNoInteractions(executions, storage);
    }

    @Test
    void optedInDefinitiveResultNeverExposesHiddenOutputOrStderr() throws Exception {
        Execution execution = execution(ExecutionType.DEFINITIVE);
        when(executions.findLatestStudentInitiated(eq(ASSIGNMENT_ID), eq(STUDENT_ID), any(Pageable.class)))
                .thenReturn(List.of(execution));
        String report = """
                {"executionId":"00000000-0000-0000-0000-000000000003","overallStatus":"WA",
                 "compilationError":null,"testCaseResults":[{"testCaseNumber":1,"status":"WA",
                 "expectedOutput":"PRIVATE EXPECTED","actualOutput":"PRIVATE ACTUAL",
                 "stderr":"PRIVATE HIDDEN INPUT","feedback":"PRIVATE FEEDBACK"}]}
                """;
        when(storage.download(any())).thenReturn(new ByteArrayInputStream(report.getBytes(StandardCharsets.UTF_8)));
        var context = service.build(ASSIGNMENT_ID, STUDENT_ID, null, true, "my editor code", true,
                AiAssistanceLevel.EXPLANATIONS_AND_GUIDING);
        assertThat(context.editorCode()).isEqualTo("my editor code");
        assertThat(context.execution().reportState()).isEqualTo("AVAILABLE");
        assertThat(context.execution().practiceDiagnostics()).isEmpty();
        assertThat(new ObjectMapper().findAndRegisterModules().writeValueAsString(context))
                .doesNotContain("PRIVATE");
    }

    @Test
    void expiredLatestExecutionKeepsSummaryWithoutFetchingOlderArtifact() {
        Execution execution = execution(ExecutionType.PRACTICE);
        execution.setArtifactsExpireAt(Instant.parse("2025-12-31T00:00:00Z"));
        when(executions.findLatestStudentInitiated(eq(ASSIGNMENT_ID), eq(STUDENT_ID), any(Pageable.class)))
                .thenReturn(List.of(execution));
        var context = service.build(ASSIGNMENT_ID, STUDENT_ID, null, false, null, true,
                AiAssistanceLevel.CONCEPTUAL_ONLY);
        assertThat(context.execution().reportState()).isEqualTo("EXPIRED");
        assertThat(context.execution().status()).isEqualTo(ExecutionStatus.WA);
        verifyNoInteractions(storage);
    }

    @Test
    void erasedAndMorePermissiveHistoryNeverReentersPrompt() {
        AssistantConversation conversation = mock(AssistantConversation.class);
        User student = new User();
        student.setId(STUDENT_ID);
        when(conversation.getAssignment()).thenReturn(assignment);
        when(conversation.getStudent()).thenReturn(student);
        when(conversations.findById(CONVERSATION_ID)).thenReturn(Optional.of(conversation));
        AssistantInteraction approved = new AssistantInteraction();
        approved.setStudentMessage("Approved concept question");
        approved.setAssistantResponse("{\"explanation\":\"Approved concept\"}");
        approved.setCompletedAssistanceLevel(AiAssistanceLevel.CONCEPTUAL_ONLY);
        approved.setStatus(AssistantInteractionStatus.COMPLETED);
        AssistantInteraction erased = new AssistantInteraction();
        erased.setContentErased(true);
        erased.setStudentMessage("Erased secret");
        erased.setAssistantResponse("Erased answer");
        erased.setCompletedAssistanceLevel(AiAssistanceLevel.CONCEPTUAL_ONLY);
        AssistantInteraction oldPermissive = new AssistantInteraction();
        oldPermissive.setStudentMessage("Old code hint");
        oldPermissive.setAssistantResponse("Old snippet");
        oldPermissive.setCompletedAssistanceLevel(AiAssistanceLevel.EXPLANATIONS_GUIDING_AND_SNIPPETS);
        when(interactions.findByConversationIdAndStatusInOrderBySequenceDesc(
                eq(CONVERSATION_ID), any(), any(Pageable.class)))
                .thenReturn(List.of(erased, oldPermissive, approved));
        var context = service.build(ASSIGNMENT_ID, STUDENT_ID, CONVERSATION_ID, false, null, false,
                AiAssistanceLevel.CONCEPTUAL_ONLY);
        assertThat(context.history()).hasSize(1);
        assertThat(context.history().getFirst().studentMessage()).isEqualTo("Approved concept question");
    }

    private Execution execution(ExecutionType type) {
        Execution execution = new Execution(type);
        execution.setId(EXECUTION_ID);
        execution.setStatus(ExecutionStatus.WA);
        execution.setTimeMs(12L);
        execution.setMemoryMb(5L);
        execution.setArtifactsExpireAt(Instant.parse("2026-02-01T00:00:00Z"));
        return execution;
    }
}
