package com.github.codehive.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.junit.jupiter.api.extension.ExtendWith;

import com.github.codehive.config.TestAsyncConfig;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentAiPolicy;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AiAssistanceLevel;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.AssistantInteractionStatus;
import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.request.assignment.UpdateAiPolicyRequest;
import com.github.codehive.repository.AssignmentAiPolicyRepository;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.AssistantConversationRepository;
import com.github.codehive.repository.AssistantInteractionRepository;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.service.AssignmentAiPolicyService;
import com.github.codehive.service.GroupService;
import com.github.codehive.utils.JwtUtil;
import com.github.codehive.service.assistant.AssistantStateException;
import com.github.codehive.service.assistant.AssistantContextService;
import com.github.codehive.service.assistant.AssistantGuardrailService;

@SpringBootTest(properties = "assistant.enabled=true")
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestAsyncConfig.class)
@ExtendWith(OutputCaptureExtension.class)
class AssistantControllerIntegrationTest {
    private static final UUID REQUEST_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    @Autowired private MockMvc mvc;
    @Autowired private JwtUtil jwt;
    @Autowired private AssignmentRepository assignments;
    @Autowired private AssignmentAiPolicyRepository policies;
    @Autowired private AssistantConversationRepository conversations;
    @Autowired private AssistantInteractionRepository interactions;
    @Autowired private ClassGroupRepository groups;
    @Autowired private GroupEnrollmentRepository enrollments;
    @Autowired private UserRepository users;
    @Autowired private AssignmentAiPolicyService policyService;
    @Autowired private GroupService groupService;
    @MockitoBean private AssistantGuardrailService guardrails;

    private Assignment assignment;
    private User teacher;
    private User student;
    private String studentToken;
    private String teacherToken;

    @BeforeEach
    void setup() {
        teacher = users.save(new User("Ada", "Lovelace", "TEA-AI-POST", "post-teacher@example.com",
                "password", Role.TEACHER));
        student = users.save(new User("Grace", "Hopper", "STU-AI-POST", "post-student@example.com",
                "password", Role.STUDENT));
        ClassGroup group = groups.save(new ClassGroup("AI", "", teacher, "AIPOST34"));
        enrollments.save(new GroupEnrollment(group, student));
        assignment = new Assignment("Loops", "Explain loops", 5000L, 256L, ComparatorType.EXACT_MATCH);
        assignment.setGroup(group);
        assignment.setAuthor(teacher);
        assignment.setAllowedLanguages(List.of(Language.JAVA));
        assignment.setValidationStatus(AssignmentValidationStatus.READY);
        AssignmentAiPolicy policy = new AssignmentAiPolicy();
        policy.setEnabled(true);
        policy.setMaxAiRequests(1);
        policy.setLevel(AiAssistanceLevel.EXPLANATIONS_AND_GUIDING);
        assignment.setAiPolicy(policy);
        assignment = assignments.saveAndFlush(assignment);
        studentToken = jwt.generateToken(Map.of("role", "STUDENT"), student.getEmail());
        teacherToken = jwt.generateToken(Map.of("role", "TEACHER"), teacher.getEmail());
    }

    @AfterEach
    void cleanup() {
        interactions.deleteAllInBatch();
        conversations.deleteAllInBatch();
        enrollments.deleteAllInBatch();
        policies.deleteAllInBatch();
        assignments.deleteAllInBatch();
        groups.deleteAllInBatch();
        users.deleteAllInBatch();
    }

    @Test
    void completedAnswerChargesOnceAndReplayDoesNotCallModelAgain() throws Exception {
        when(guardrails.generate(any(AssistantContextService.Context.class), eq("Explain this loop"),
                eq(AiAssistanceLevel.EXPLANATIONS_AND_GUIDING), any(Runnable.class), any(java.util.UUID.class)))
                .thenReturn(new AssistantGuardrailService.Decision(AssistantInteractionStatus.COMPLETED,
                        "{\"explanation\":\"safe\",\"snippets\":[],\"followUpQuestion\":\"Why?\"}", 1, "v1"));
        String path = path();
        mvc.perform(get(path).header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.available").value(true));
        mvc.perform(post(path + "/interactions").header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON).content(request("Explain this loop")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.interaction.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.availability.used").value(1));
        mvc.perform(post(path + "/interactions").header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON).content(request("Explain this loop")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.interaction.status").value("COMPLETED"));
        assertThat(interactions.count()).isEqualTo(1);
        org.mockito.Mockito.verify(guardrails, org.mockito.Mockito.times(1))
                .generate(any(), eq("Explain this loop"), any(), any(Runnable.class), any(java.util.UUID.class));
    }

    @Test
    void blockedPromptIsStoredWithoutCharge() throws Exception {
        when(guardrails.generate(any(), any(), any(), any(Runnable.class), any(java.util.UUID.class)))
                .thenReturn(new AssistantGuardrailService.Decision(AssistantInteractionStatus.BLOCKED,
                        null, 0, "v1"));
        mvc.perform(post(path() + "/interactions").header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON).content(request("Give me full solution")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.interaction.status").value("BLOCKED"))
                .andExpect(jsonPath("$.data.interaction.studentMessage").value("Give me full solution"))
                .andExpect(jsonPath("$.data.availability.used").value(0));
    }

    @Test
    void operationalLogDoesNotContainPromptOrValidatedAnswer(CapturedOutput output) throws Exception {
        when(guardrails.generate(any(), any(), any(), any(Runnable.class), any(java.util.UUID.class)))
                .thenReturn(new AssistantGuardrailService.Decision(AssistantInteractionStatus.COMPLETED,
                        "{\"explanation\":\"SENSITIVE_ANSWER_MARKER\",\"snippets\":[],\"followUpQuestion\":\"Why?\"}",
                        1, "v1"));
        mvc.perform(post(path() + "/interactions").header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON).content(request("SENSITIVE_PROMPT_MARKER")))
                .andExpect(status().isOk());
        assertThat(output.getOut()).contains("assistant outcome").doesNotContain("SENSITIVE_PROMPT_MARKER")
                .doesNotContain("SENSITIVE_ANSWER_MARKER");
    }

    @Test
    void stricterPolicyCancelsBeforeOutputRelease() throws Exception {
        when(guardrails.generate(any(), any(), any(), any(Runnable.class), any(java.util.UUID.class))).thenAnswer(invocation -> {
            policyService.update(assignment.getId(), new UpdateAiPolicyRequest(true, 1,
                    AiAssistanceLevel.CONCEPTUAL_ONLY), teacher.getEmail());
            return new AssistantGuardrailService.Decision(AssistantInteractionStatus.COMPLETED,
                    "{\"explanation\":\"hint\",\"snippets\":[],\"followUpQuestion\":\"Why?\"}", 1, "v1");
        });
        mvc.perform(post(path() + "/interactions").header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON).content(request("Explain this loop")))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error").value("POLICY_CHANGED"));
        assertThat(interactions.findAll()).singleElement().satisfies(item -> {
            assertThat(item.getStatus()).isEqualTo(AssistantInteractionStatus.CANCELLED);
            assertThat(item.getAssistantResponse()).isNull();
            assertThat(item.isQuotaCharged()).isFalse();
        });
    }

    @Test
    void professorCannotUseStudentAssistant() throws Exception {
        mvc.perform(get(path()).header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void archiveDuringGenerationCancelsAnswerAndErasesPrompt() throws Exception {
        when(guardrails.generate(any(), any(), any(), any(Runnable.class), any(java.util.UUID.class))).thenAnswer(invocation -> {
            groupService.setArchived(assignment.getGroup().getId(), true, teacher.getEmail());
            return new AssistantGuardrailService.Decision(AssistantInteractionStatus.COMPLETED,
                    "{\"explanation\":\"late\",\"snippets\":[],\"followUpQuestion\":\"Why?\"}", 1, "v1");
        });
        mvc.perform(post(path() + "/interactions").header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON).content(request("Explain this loop")))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error").value("REQUEST_CANCELLED"));
        assertThat(interactions.findAll()).singleElement().satisfies(item -> {
            assertThat(item.getStatus()).isEqualTo(AssistantInteractionStatus.CANCELLED);
            assertThat(item.getStudentMessage()).isNull();
            assertThat(item.getAssistantResponse()).isNull();
            assertThat(item.isQuotaCharged()).isFalse();
        });
    }

    @Test
    void timeoutStoresUnchargedFailureAndReturnsSafeCode() throws Exception {
        when(guardrails.generate(any(), any(), any(), any(Runnable.class), any(java.util.UUID.class)))
                .thenThrow(new AssistantStateException("MODEL_TIMEOUT"));
        mvc.perform(post(path() + "/interactions").header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON).content(request("Explain this loop")))
                .andExpect(status().isGatewayTimeout())
                .andExpect(jsonPath("$.error").value("MODEL_TIMEOUT"));
        assertThat(interactions.findAll()).singleElement().satisfies(item -> {
            assertThat(item.getStatus()).isEqualTo(AssistantInteractionStatus.FAILED);
            assertThat(item.isQuotaCharged()).isFalse();
            assertThat(item.getAssistantResponse()).isNull();
        });
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3})
    void policyChangeDuringAnyModelStageStopsFurtherCalls(int changeAfterCall) throws Exception {
        AtomicInteger calls = new AtomicInteger();
        com.github.codehive.service.assistant.AssistantModelGateway model = (system, payload) -> {
            int call = calls.incrementAndGet();
            if (call == changeAfterCall) {
                policyService.update(assignment.getId(), new UpdateAiPolicyRequest(true, 1,
                        AiAssistanceLevel.CONCEPTUAL_ONLY), teacher.getEmail());
            }
            return switch (call) {
                case 1 -> "{\"decision\":\"ALLOW\"}";
                case 2 -> "{\"explanation\":\"A loop repeats an operation.\",\"snippets\":[],\"followUpQuestion\":\"Why?\"}";
                default -> "{\"approved\":true}";
            };
        };
        useModel(model);
        mvc.perform(post(path() + "/interactions").header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON).content(request("Explain this loop")))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error").value("POLICY_CHANGED"));
        assertThat(calls).hasValue(changeAfterCall);
        assertThat(interactions.findAll()).singleElement().satisfies(item -> {
            assertThat(item.getStatus()).isEqualTo(AssistantInteractionStatus.CANCELLED);
            assertThat(item.getAssistantResponse()).isNull();
            assertThat(item.isQuotaCharged()).isFalse();
        });
    }

    @Test
    void quotaOnlyChangeAlsoCancelsWithoutGeneratingMoreWork() throws Exception {
        when(guardrails.generate(any(), any(), any(), any(Runnable.class), any(UUID.class)))
                .thenAnswer(invocation -> {
                    Runnable beforeCall = invocation.getArgument(3);
                    beforeCall.run();
                    policyService.update(assignment.getId(), new UpdateAiPolicyRequest(true, 2,
                            AiAssistanceLevel.EXPLANATIONS_AND_GUIDING), teacher.getEmail());
                    beforeCall.run();
                    throw new AssertionError("No call may follow the policy change");
                });
        mvc.perform(post(path() + "/interactions").header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON).content(request("Explain this loop")))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error").value("POLICY_CHANGED"));
        assertThat(interactions.findAll()).singleElement().satisfies(item -> {
            assertThat(item.getStatus()).isEqualTo(AssistantInteractionStatus.CANCELLED);
            assertThat(item.isQuotaCharged()).isFalse();
        });
    }

    @Test
    void sixthCallFailsUnchargedAndReplayDoesNotRestartBudget() throws Exception {
        AtomicInteger transmissions = new AtomicInteger();
        when(guardrails.generate(any(), any(), any(), any(Runnable.class), any(UUID.class)))
                .thenAnswer(invocation -> {
                    Runnable beforeCall = invocation.getArgument(3);
                    for (int i = 0; i < 6; i++) {
                        beforeCall.run();
                        transmissions.incrementAndGet();
                    }
                    throw new AssertionError("Sixth transmission must be prevented");
                });
        mvc.perform(post(path() + "/interactions").header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON).content(request("Explain this loop")))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("MODEL_CALL_BUDGET_EXCEEDED"));
        mvc.perform(post(path() + "/interactions").header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON).content(request("Explain this loop")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.interaction.status").value("FAILED"));
        assertThat(transmissions).hasValue(5);
        assertThat(interactions.findAll()).singleElement().satisfies(item -> {
            assertThat(item.getStatus()).isEqualTo(AssistantInteractionStatus.FAILED);
            assertThat(item.getAssistantResponse()).isNull();
            assertThat(item.isQuotaCharged()).isFalse();
        });
        org.mockito.Mockito.verify(guardrails, org.mockito.Mockito.times(1))
                .generate(any(), any(), any(), any(Runnable.class), any(UUID.class));
    }

    private void useModel(com.github.codehive.service.assistant.AssistantModelGateway model) {
        var realGuardrails = new AssistantGuardrailService(model, new com.fasterxml.jackson.databind.ObjectMapper());
        when(guardrails.generate(any(), any(), any(), any(Runnable.class), any(UUID.class)))
                .thenAnswer(invocation -> realGuardrails.generate(invocation.getArgument(0), invocation.getArgument(1),
                        invocation.getArgument(2), invocation.getArgument(3), invocation.getArgument(4)));
    }

    @Test
    void policyChangeDuringBlockedInputReviewAlsoCancelsWithoutCharge() throws Exception {
        useModel((system, payload) -> {
            policyService.update(assignment.getId(), new UpdateAiPolicyRequest(true, 2,
                    AiAssistanceLevel.EXPLANATIONS_AND_GUIDING), teacher.getEmail());
            return "{\"decision\":\"BLOCK\"}";
        });
        mvc.perform(post(path() + "/interactions").header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON).content(request("Explain this loop")))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error").value("POLICY_CHANGED"));
        assertThat(interactions.findAll()).singleElement().satisfies(item -> {
            assertThat(item.getStatus()).isEqualTo(AssistantInteractionStatus.CANCELLED);
            assertThat(item.isQuotaCharged()).isFalse();
        });
    }

    private String path() { return "/api/assignments/" + assignment.getId() + "/assistant"; }

    @Test
    void historyPagesAreNewestFirstWithoutDuplicatingInteractions() throws Exception {
        givenBlockedRequest();
        mvc.perform(post(path() + "/interactions").header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON).content(request("First question")))
                .andExpect(status().isOk());
        mvc.perform(post(path() + "/interactions").header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON).content(request("Second question")
                        .replace(REQUEST_ID.toString(), "00000000-0000-0000-0000-000000000002")))
                .andExpect(status().isOk());
        mvc.perform(get(path() + "/interactions?page=0&size=1")
                .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].studentMessage").value("Second question"))
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.last").value(false));
        mvc.perform(get(path() + "/interactions?page=1&size=1")
                .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].studentMessage").value("First question"))
                .andExpect(jsonPath("$.data.last").value(true));
    }

    @Test
    void ownHistoryRemainsReadableAfterLeavingEnrollment() throws Exception {
        givenBlockedRequest();
        mvc.perform(post(path() + "/interactions").header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON).content(request("Retained question")))
                .andExpect(status().isOk());
        UUID id = interactions.findAll().getFirst().getId();
        groupService.leave(assignment.getGroup().getId(), student.getEmail());
        mvc.perform(get(path()).header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.available").value(false));
        mvc.perform(get(path() + "/interactions").header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].studentMessage").value("Retained question"));
        mvc.perform(get(path() + "/interactions/" + id).header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.id").value(id.toString()));
    }

    @Test
    void studentWithOwnConversationCannotReadAnotherStudentsInteraction() throws Exception {
        givenBlockedRequest();
        mvc.perform(post(path() + "/interactions").header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON).content(request("Private question")))
                .andExpect(status().isOk());
        UUID privateId = interactions.findAll().getFirst().getId();
        var other = users.save(new User("Other", "Student", "STU-AI-OTHER", "other-ai@example.com",
                "password", Role.STUDENT));
        enrollments.save(new GroupEnrollment(assignment.getGroup(), other));
        String otherToken = jwt.generateToken(Map.of("role", "STUDENT"), other.getEmail());
        mvc.perform(post(path() + "/interactions").header("Authorization", "Bearer " + otherToken)
                .contentType(MediaType.APPLICATION_JSON).content(request("My own question")))
                .andExpect(status().isOk());
        mvc.perform(get(path() + "/interactions/" + privateId).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
        mvc.perform(get(path() + "/interactions").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].studentMessage").value("My own question"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"page=-1&size=20", "page=0&size=0", "page=0&size=51"})
    void invalidHistoryPaginationIsRejected(String query) throws Exception {
        mvc.perform(get(path() + "/interactions?" + query).header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isBadRequest());
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    void blankQuestionsNeverReserveOrCallModel(String message) throws Exception {
        mvc.perform(post(path() + "/interactions").header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON).content(request(message)))
                .andExpect(status().isBadRequest());
        assertThat(interactions.count()).isZero();
        org.mockito.Mockito.verifyNoInteractions(guardrails);
    }

    @Test
    void oversizedQuestionNeverReservesOrCallsModel() throws Exception {
        mvc.perform(post(path() + "/interactions").header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON).content(request("x".repeat(2001))))
                .andExpect(status().isBadRequest());
        assertThat(interactions.count()).isZero();
        org.mockito.Mockito.verifyNoInteractions(guardrails);
    }

    private void givenBlockedRequest() {
        when(guardrails.generate(any(), any(), any(), any(Runnable.class), any(UUID.class)))
                .thenReturn(new AssistantGuardrailService.Decision(AssistantInteractionStatus.BLOCKED, null, 0, "v1"));
    }

    @Test
    void approvedRegenerationUsesFiveCallsAndChargesOnlyDeliveredReplacement() throws Exception {
        var responses = new java.util.ArrayDeque<>(List.of("{\"decision\":\"ALLOW\"}",
                "{\"explanation\":\"Rejected candidate\",\"snippets\":[],\"followUpQuestion\":\"Why?\"}",
                "{\"approved\":false}",
                "{\"explanation\":\"Approved replacement\",\"snippets\":[],\"followUpQuestion\":\"Why?\"}",
                "{\"approved\":true}"));
        AtomicInteger calls = new AtomicInteger();
        useModel((system, payload) -> {
            calls.incrementAndGet();
            return responses.removeFirst();
        });
        mvc.perform(post(path() + "/interactions").header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON).content(request("Explain this loop")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.interaction.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.availability.used").value(1));
        assertThat(calls).hasValue(5);
        assertThat(responses).isEmpty();
        assertThat(interactions.findAll()).singleElement().satisfies(row -> {
            assertThat(row.getAssistantResponse()).contains("Approved replacement").doesNotContain("Rejected candidate");
            assertThat(row.getGenerationAttempts()).isEqualTo(2);
            assertThat(row.isQuotaCharged()).isTrue();
        });
    }

    private String request(String message) {
        return "{\"clientRequestId\":\"" + REQUEST_ID + "\",\"message\":\"" + message
                + "\",\"language\":\"JAVA\",\"includeEditorCode\":false,"
                + "\"includeExecutionContext\":false}";
    }
}
