package com.github.codehive.service;

import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.AssignmentManagementStatusDTO;
import com.github.codehive.model.dto.AssignmentUpdateDTO;
import com.github.codehive.model.dto.ReevaluationBatchDTO;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentUpdate;
import com.github.codehive.model.entity.ReevaluationBatch;
import com.github.codehive.model.entity.TestSuiteRevision;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.AssignmentUpdateRepository;
import com.github.codehive.repository.ReevaluationBatchRepository;
import com.github.codehive.repository.TestSuiteRevisionRepository;
import com.github.codehive.repository.UserRepository;

@Service
public class TeacherAssignmentStatusService {
    private final AssignmentRepository assignmentRepository;
    private final AssignmentUpdateRepository updateRepository;
    private final ReevaluationBatchRepository reevaluationRepository;
    private final TestSuiteRevisionRepository testSuiteRevisionRepository;
    private final UserRepository userRepository;

    public TeacherAssignmentStatusService(
            AssignmentRepository assignmentRepository,
            AssignmentUpdateRepository updateRepository,
            ReevaluationBatchRepository reevaluationRepository,
            TestSuiteRevisionRepository testSuiteRevisionRepository,
            UserRepository userRepository) {
        this.assignmentRepository = assignmentRepository;
        this.updateRepository = updateRepository;
        this.reevaluationRepository = reevaluationRepository;
        this.testSuiteRevisionRepository = testSuiteRevisionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public AssignmentManagementStatusDTO get(UUID assignmentId, String email) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found: " + assignmentId));
        User teacher = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
        if (!teacher.canManageGroups() || !assignment.getGroup().getOwner().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("Only the assignment owner can view management status");
        }

        String failure = testSuiteRevisionRepository
                .findTopByAssignmentIdOrderByRevisionNumberDesc(assignmentId)
                .map(TestSuiteRevision::getFailureMessage)
                .orElse(null);
        return new AssignmentManagementStatusDTO(
                assignmentId,
                assignment.getValidationStatus(),
                failure,
                updateRepository.findTop10ByAssignmentIdOrderByCreatedAtDesc(assignmentId)
                        .stream().map(this::updateDTO).toList(),
                reevaluationRepository.findTopByAssignmentIdOrderByCreatedAtDesc(assignmentId)
                        .map(this::reevaluationDTO).orElse(null));
    }

    private AssignmentUpdateDTO updateDTO(AssignmentUpdate update) {
        return new AssignmentUpdateDTO(
                update.getId(), update.getAssignment().getId(), update.getKind(), update.getStatus(),
                update.getFailureMessage(), update.getCreatedAt(), update.getCompletedAt());
    }

    private ReevaluationBatchDTO reevaluationDTO(ReevaluationBatch batch) {
        return new ReevaluationBatchDTO(
                batch.getId(), batch.getAssignment().getId(), batch.getTestSuiteRevision().getId(),
                batch.getStatus(), batch.getTotal(), batch.getQueued(), batch.getCompleted(),
                batch.getFailed(), batch.getCreatedAt(), batch.getCompletedAt());
    }
}
