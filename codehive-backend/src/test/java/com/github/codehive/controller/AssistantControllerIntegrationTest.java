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
        when(guardrails.revalidate(any(), any(), eq(AiAssistanceLevel.CONCEPTUAL_ONLY), any(),
                any(Runnable.class), any(java.util.UUID.class)))
                .thenReturn(false);
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

    private String path() { return "/api/assignments/" + assignment.getId() + "/assistant"; }

    private String request(String message) {
        return "{\"clientRequestId\":\"" + REQUEST_ID + "\",\"message\":\"" + message
                + "\",\"language\":\"JAVA\",\"includeEditorCode\":false,"
                + "\"includeExecutionContext\":false}";
    }
}
