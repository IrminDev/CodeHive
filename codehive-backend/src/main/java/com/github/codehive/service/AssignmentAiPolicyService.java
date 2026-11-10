package com.github.codehive.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.AiPolicyDTO;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentAiPolicy;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.request.assignment.UpdateAiPolicyRequest;
import com.github.codehive.repository.AssignmentAiPolicyRepository;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.UserRepository;

@Service
public class AssignmentAiPolicyService {
    private final AssignmentRepository assignmentRepository;
    private final AssignmentAiPolicyRepository policyRepository;
    private final UserRepository userRepository;
    private final GroupService groupService;

    public AssignmentAiPolicyService(AssignmentRepository assignmentRepository,
                                     AssignmentAiPolicyRepository policyRepository,
                                     UserRepository userRepository, GroupService groupService) {
        this.assignmentRepository = assignmentRepository;
        this.policyRepository = policyRepository;
        this.userRepository = userRepository;
        this.groupService = groupService;
    }

    @Transactional
    public AiPolicyDTO update(UUID assignmentId, UpdateAiPolicyRequest request, String email) {
        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found: " + assignmentId));
        groupService.requireOwnedWritableGroupForUpdate(assignment.getGroup().getId(), owner);
        AssignmentAiPolicy policy = policyRepository.findByIdForUpdate(assignmentId).orElseGet(() -> {
            AssignmentAiPolicy created = new AssignmentAiPolicy();
            created.setAssignment(assignment);
            return created;
        });
        AiPolicyRules.apply(policy, request.aiAssistanceEnabled(), request.maxAiRequests(),
                request.aiAssistanceLevel());
        policy = policyRepository.saveAndFlush(policy);
        return new AiPolicyDTO(policy.isEnabled(), policy.getMaxAiRequests(), policy.getLevel(),
                policy.getVersion());
    }
}
