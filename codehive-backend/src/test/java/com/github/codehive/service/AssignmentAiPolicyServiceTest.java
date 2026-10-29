package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import com.github.codehive.model.entity.*;
import com.github.codehive.model.enums.AiAssistanceLevel;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.model.request.assignment.UpdateAiPolicyRequest;
import com.github.codehive.repository.*;

@ExtendWith(MockitoExtension.class)
class AssignmentAiPolicyServiceTest {
    private static final UUID ASSIGNMENT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID GROUP = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final String EMAIL = "owner@example.com";
    @Mock private AssignmentRepository assignments;
    @Mock private AssignmentAiPolicyRepository policies;
    @Mock private UserRepository users;
    @Mock private GroupService groups;
    private AssignmentAiPolicyService service;
    private User owner;
    private Assignment assignment;

    @BeforeEach
    void setup() {
        service = new AssignmentAiPolicyService(assignments, policies, users, groups);
        owner = new User();
        var group = new ClassGroup();
        group.setId(GROUP);
        assignment = new Assignment();
        assignment.setId(ASSIGNMENT);
        assignment.setGroup(group);
    }

    private void givenOwnedAssignment() {
        when(users.findByEmail(EMAIL)).thenReturn(Optional.of(owner));
        when(assignments.findById(ASSIGNMENT)).thenReturn(Optional.of(assignment));
    }

    @Test
    void updatesExistingPolicyAfterWritableOwnershipCheck() {
        givenOwnedAssignment();
        var policy = AiPolicyRules.create(false, 0, AiAssistanceLevel.CONCEPTUAL_ONLY);
        when(policies.findByIdForUpdate(ASSIGNMENT)).thenReturn(Optional.of(policy));
        when(policies.saveAndFlush(policy)).thenReturn(policy);
        var result = service.update(ASSIGNMENT, request(true, 10), EMAIL);
        assertThat(result.aiAssistanceEnabled()).isTrue();
        assertThat(result.maxAiRequests()).isEqualTo(10);
        assertThat(result.aiAssistanceLevel()).isEqualTo(AiAssistanceLevel.EXPLANATIONS_AND_GUIDING);
        var order = inOrder(groups, policies);
        order.verify(groups).requireOwnedWritableGroupForUpdate(GROUP, owner);
        order.verify(policies).findByIdForUpdate(ASSIGNMENT);
        order.verify(policies).saveAndFlush(policy);
    }

    @Test
    void createsMissingPolicyAttachedToAssignment() {
        givenOwnedAssignment();
        when(policies.findByIdForUpdate(ASSIGNMENT)).thenReturn(Optional.empty());
        when(policies.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
        var result = service.update(ASSIGNMENT, request(false, 0), EMAIL);
        var captor = org.mockito.ArgumentCaptor.forClass(AssignmentAiPolicy.class);
        verify(policies).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getAssignment()).isSameAs(assignment);
        assertThat(result.aiAssistanceEnabled()).isFalse();
        assertThat(result.maxAiRequests()).isZero();
    }

    @Test
    void unauthorizedOrReadOnlyGroupCannotReadOrWritePolicy() {
        givenOwnedAssignment();
        doThrow(new AccessDeniedException("Group is not writable"))
                .when(groups).requireOwnedWritableGroupForUpdate(GROUP, owner);
        assertThatThrownBy(() -> service.update(ASSIGNMENT, request(true, 1), EMAIL))
                .isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(policies);
    }

    @Test
    void invalidQuotaDoesNotSaveOrMutateExistingPolicy() {
        givenOwnedAssignment();
        var policy = AiPolicyRules.create(true, 3, AiAssistanceLevel.CONCEPTUAL_ONLY);
        when(policies.findByIdForUpdate(ASSIGNMENT)).thenReturn(Optional.of(policy));
        assertThatThrownBy(() -> service.update(ASSIGNMENT, request(true, 11), EMAIL))
                .isInstanceOf(ValidationException.class);
        verify(policies, never()).saveAndFlush(any());
        assertThat(policy.getMaxAiRequests()).isEqualTo(3);
        assertThat(policy.getLevel()).isEqualTo(AiAssistanceLevel.CONCEPTUAL_ONLY);
    }

    @Test
    void missingAuthenticatedUserStopsBeforeAssignmentLookup() {
        assertThatThrownBy(() -> service.update(ASSIGNMENT, request(true, 1), EMAIL))
                .isInstanceOf(EntityNotFoundException.class);
        verifyNoInteractions(assignments, policies, groups);
    }

    @Test
    void missingAssignmentStopsBeforePolicyOrOwnershipWork() {
        when(users.findByEmail(EMAIL)).thenReturn(Optional.of(owner));
        assertThatThrownBy(() -> service.update(ASSIGNMENT, request(true, 1), EMAIL))
                .isInstanceOf(EntityNotFoundException.class);
        verifyNoInteractions(policies, groups);
    }

    private UpdateAiPolicyRequest request(boolean enabled, int quota) {
        return new UpdateAiPolicyRequest(enabled, quota, AiAssistanceLevel.EXPLANATIONS_AND_GUIDING);
    }
}
