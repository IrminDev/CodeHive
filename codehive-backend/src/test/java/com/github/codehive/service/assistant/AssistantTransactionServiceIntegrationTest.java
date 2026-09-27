package com.github.codehive.service.assistant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.github.codehive.config.TestAsyncConfig;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentAiPolicy;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AiAssistanceLevel;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.AssistantInteractionStatus;
import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.ExecutionTrigger;
import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.model.enums.Role;
import com.github.codehive.repository.AssignmentAiPolicyRepository;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.AssistantConversationRepository;
import com.github.codehive.repository.AssistantInteractionRepository;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.repository.ExecutionRepository;
import org.springframework.data.domain.PageRequest;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestAsyncConfig.class)
class AssistantTransactionServiceIntegrationTest {
    private static final UUID REQUEST_ONE = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID REQUEST_TWO = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @Autowired private AssistantTransactionService transactions;
    @Autowired private com.github.codehive.service.GroupService groupService;
    @Autowired private AssignmentRepository assignments;
    @Autowired private AssignmentAiPolicyRepository policies;
    @Autowired private AssistantConversationRepository conversations;
    @Autowired private AssistantInteractionRepository interactions;
    @Autowired private ClassGroupRepository groups;
    @Autowired private GroupEnrollmentRepository enrollments;
    @Autowired private ExecutionRepository executions;
    @Autowired private UserRepository users;

    private Assignment assignment;
    private User student;
    private User teacher;

    @BeforeEach
    void setup() {
        teacher = users.save(new User("Ada", "Lovelace", "TEA-AI-TX", "tx-teacher@example.com",
                "password", Role.TEACHER));
        student = users.save(new User("Grace", "Hopper", "STU-AI-TX", "tx-student@example.com",
                "password", Role.STUDENT));
        ClassGroup group = groups.save(new ClassGroup("AI", "", teacher, "AITX1234"));
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
    }

    @AfterEach
    void cleanup() {
        interactions.deleteAllInBatch();
        conversations.deleteAllInBatch();
        executions.deleteAllInBatch();
        enrollments.deleteAllInBatch();
        policies.deleteAllInBatch();
        assignments.deleteAllInBatch();
        groups.deleteAllInBatch();
        users.deleteAllInBatch();
    }

    @Test
    void retryIsIdempotentAndBlockedRequestsDoNotCharge() {
        var request = request(REQUEST_ONE, "What is a loop?");
        var reserved = transactions.reserve(request);
        assertThat(reserved.replay()).isFalse();
        assertThat(transactions.reserve(request).interactionId()).isEqualTo(reserved.interactionId());
        assertThatThrownBy(() -> transactions.reserve(request(REQUEST_ONE, "Different payload")))
                .isInstanceOf(AssistantStateException.class).hasMessage("IDEMPOTENCY_CONFLICT");
        transactions.stop(reserved.interactionId(), AssistantInteractionStatus.BLOCKED, "INPUT_BLOCKED");
        assertThat(interactions.countByConversationIdAndQuotaChargedTrue(reserved.conversationId())).isZero();
        assertThat(transactions.reserve(request(REQUEST_TWO, "Can you guide me?"))).isNotNull();
    }

    @Test
    void deliveredRedirectionChargesOnceAndQuotaNeverResets() {
        var reserved = transactions.reserve(request(REQUEST_ONE, "Write the answer"));
        assertThat(transactions.deliver(reserved.interactionId(), reserved.policyVersion(),
                AssistantInteractionStatus.REDIRECTED, "{\"explanation\":\"Ask a focused question\"}", 1))
                .isEqualTo(AssistantTransactionService.Completion.DELIVERED);
        assertThat(transactions.deliver(reserved.interactionId(), reserved.policyVersion(),
                AssistantInteractionStatus.REDIRECTED, "{\"explanation\":\"Duplicate\"}", 1))
                .isEqualTo(AssistantTransactionService.Completion.ALREADY_FINISHED);
        assertThat(interactions.countByConversationIdAndQuotaChargedTrue(reserved.conversationId())).isEqualTo(1);
        assertThatThrownBy(() -> transactions.reserve(request(REQUEST_TWO, "Another question")))
                .isInstanceOf(AssistantStateException.class).hasMessage("QUOTA_EXHAUSTED");
        AssignmentAiPolicy policy = policies.findById(assignment.getId()).orElseThrow();
        policy.setEnabled(false);
        policy.setMaxAiRequests(0);
        policies.saveAndFlush(policy);
        assertThat(interactions.countByConversationIdAndQuotaChargedTrue(reserved.conversationId())).isEqualTo(1);
    }

    @Test
    void expiredLeaseCannotReceiveLateAnswer() {
        var reserved = transactions.reserve(request(REQUEST_ONE, "Explain the condition"));
        var interaction = interactions.findById(reserved.interactionId()).orElseThrow();
        interaction.setLeaseExpiresAt(java.time.Instant.parse("2000-01-01T00:00:00Z"));
        interactions.saveAndFlush(interaction);
        assertThat(interactions.findById(reserved.interactionId()).orElseThrow().getLeaseExpiresAt())
                .isBefore(java.time.Instant.now());
        transactions.recoverOne(reserved.interactionId());
        assertThat(interactions.findById(reserved.interactionId()).orElseThrow().getStatus())
                .isEqualTo(AssistantInteractionStatus.FAILED);
        assertThat(transactions.deliver(reserved.interactionId(), reserved.policyVersion(),
                AssistantInteractionStatus.COMPLETED, "{\"explanation\":\"Late\"}", 1))
                .isEqualTo(AssistantTransactionService.Completion.ALREADY_FINISHED);
    }

    @Test
    void changedPolicyRequiresNewValidationBeforeDelivery() {
        var reserved = transactions.reserve(request(REQUEST_ONE, "Explain conditionals"));
        AssignmentAiPolicy policy = policies.findById(assignment.getId()).orElseThrow();
        policy.setMaxAiRequests(2);
        policies.saveAndFlush(policy);
        assertThat(transactions.deliver(reserved.interactionId(), reserved.policyVersion(),
                AssistantInteractionStatus.COMPLETED, "{\"explanation\":\"Candidate\"}", 1))
                .isEqualTo(AssistantTransactionService.Completion.POLICY_CHANGED);
        assertThat(interactions.findById(reserved.interactionId()).orElseThrow().getStatus())
                .isEqualTo(AssistantInteractionStatus.PENDING);
        assertThat(interactions.countByConversationIdAndQuotaChargedTrue(reserved.conversationId())).isZero();
    }

    @Test
    void archiveCancelsPendingAndPreventsLateDelivery() {
        var reserved = transactions.reserve(request(REQUEST_ONE, "Explain conditionals"));
        groupService.setArchived(assignment.getGroup().getId(), true, teacher.getEmail());
        assertThat(transactions.deliver(reserved.interactionId(), reserved.policyVersion(),
                AssistantInteractionStatus.COMPLETED, "{\"explanation\":\"Late\"}", 1))
                .isEqualTo(AssistantTransactionService.Completion.ALREADY_FINISHED);
        var row = interactions.findById(reserved.interactionId()).orElseThrow();
        assertThat(row.getStatus()).isEqualTo(AssistantInteractionStatus.CANCELLED);
        assertThat(row.getStudentMessage()).isNull();
        assertThat(row.isQuotaCharged()).isFalse();
    }

    @Test
    void latestExecutionQueryIgnoresPendingAndAutomaticReevaluation() {
        Execution practice = new Execution(ExecutionType.PRACTICE, student);
        practice.setAssignment(assignment);
        practice.setStatus(ExecutionStatus.WA);
        practice.setCreatedAt(java.time.LocalDateTime.of(2026, 1, 1, 10, 0));
        practice = executions.saveAndFlush(practice);
        Execution pending = new Execution(ExecutionType.PRACTICE, student);
        pending.setAssignment(assignment);
        pending.setCreatedAt(java.time.LocalDateTime.of(2026, 1, 1, 11, 0));
        executions.saveAndFlush(pending);
        Execution automatic = new Execution(ExecutionType.DEFINITIVE, student);
        automatic.setAssignment(assignment);
        automatic.setTrigger(ExecutionTrigger.ASSIGNMENT_UPDATE);
        automatic.setStatus(ExecutionStatus.AC);
        automatic.setCreatedAt(java.time.LocalDateTime.of(2026, 1, 1, 12, 0));
        executions.saveAndFlush(automatic);
        assertThat(executions.findLatestStudentInitiated(assignment.getId(), student.getId(),
                PageRequest.of(0, 1))).extracting(Execution::getId).containsExactly(practice.getId());
    }

    @Test
    void concurrentFirstRequestsCreateOneConversationAndOnePendingSlot() throws Exception {
        CountDownLatch go = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var first = pool.submit(() -> attemptAfter(go, REQUEST_ONE));
            var second = pool.submit(() -> attemptAfter(go, REQUEST_TWO));
            go.countDown();
            List<String> outcomes = List.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS));
            assertThat(outcomes).containsExactlyInAnyOrder("PENDING", "REQUEST_PENDING");
            assertThat(conversations.count()).isEqualTo(1);
            assertThat(interactions.count()).isEqualTo(1);
        }
    }

    @Test
    void concurrentFinalizationChargesOnlyOnce() throws Exception {
        var reserved = transactions.reserve(request(REQUEST_ONE, "Explain loops"));
        CountDownLatch go = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var first = pool.submit(() -> deliverAfter(go, reserved));
            var second = pool.submit(() -> deliverAfter(go, reserved));
            go.countDown();
            assertThat(List.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(AssistantTransactionService.Completion.DELIVERED,
                            AssistantTransactionService.Completion.ALREADY_FINISHED);
            assertThat(interactions.countByConversationIdAndQuotaChargedTrue(reserved.conversationId()))
                    .isEqualTo(1);
        }
    }

    private AssistantTransactionService.Completion deliverAfter(CountDownLatch latch,
            AssistantTransactionService.Reservation reserved) {
        try {
            latch.await();
            return transactions.deliver(reserved.interactionId(), reserved.policyVersion(),
                    AssistantInteractionStatus.COMPLETED, "{\"explanation\":\"Safe hint\"}", 1);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
    }

    private String attemptAfter(CountDownLatch latch, UUID clientRequestId) {
        try {
            latch.await();
            return transactions.reserve(request(clientRequestId, "Explain loops")).status().name();
        } catch (AssistantStateException exception) {
            return exception.getCode();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
    }

    private AssistantTransactionService.Request request(UUID id, String message) {
        return new AssistantTransactionService.Request(assignment.getId(), student.getId(), id,
                message, Language.JAVA, false, null, false);
    }
}
