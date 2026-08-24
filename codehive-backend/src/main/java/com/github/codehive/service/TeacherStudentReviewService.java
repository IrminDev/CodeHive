package com.github.codehive.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.AssignmentGradeHistoryDTO;
import com.github.codehive.model.dto.TeacherStudentWorkReviewDTO;
import com.github.codehive.model.dto.TeacherSubmissionEvidenceDTO;
import com.github.codehive.model.entity.AssignmentGradeHistory;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.mapper.ExecutionMapper;
import com.github.codehive.repository.AssignmentGradeHistoryRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.StudentAssignmentWorkRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.UserRepository;

@Service
public class TeacherStudentReviewService {
    private final StudentWorkQueryService workQueryService;
    private final StudentAssignmentWorkRepository workRepository;
    private final SubmissionRepository submissionRepository;
    private final ExecutionRepository executionRepository;
    private final AssignmentGradeHistoryRepository gradeHistoryRepository;
    private final UserRepository userRepository;
    private final ObjectStorageService objectStorageService;

    public TeacherStudentReviewService(
            StudentWorkQueryService workQueryService,
            StudentAssignmentWorkRepository workRepository,
            SubmissionRepository submissionRepository,
            ExecutionRepository executionRepository,
            AssignmentGradeHistoryRepository gradeHistoryRepository,
            UserRepository userRepository,
            ObjectStorageService objectStorageService) {
        this.workQueryService = workQueryService;
        this.workRepository = workRepository;
        this.submissionRepository = submissionRepository;
        this.executionRepository = executionRepository;
        this.gradeHistoryRepository = gradeHistoryRepository;
        this.userRepository = userRepository;
        this.objectStorageService = objectStorageService;
    }

    @Transactional(readOnly = true)
    public TeacherStudentWorkReviewDTO get(UUID assignmentId, UUID studentId, String email) {
        User teacher = requireUser(email);
        StudentAssignmentWork work = workRepository.findByAssignmentIdAndStudentId(assignmentId, studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student assignment work not found"));
        if (!work.getStudent().canParticipate()) {
            throw new EntityNotFoundException("Student assignment work not found");
        }
        authorizeOwner(work, teacher);
        List<TeacherSubmissionEvidenceDTO> submissions = submissionRepository
                .findByAssignmentAndStudentOrderByCreatedAtDesc(work.getAssignment(), work.getStudent())
                .stream().map(submission -> evidence(submission, false)).toList();
        List<AssignmentGradeHistoryDTO> history = gradeHistoryRepository
                .findByStudentWorkIdOrderByCreatedAtDesc(work.getId()).stream()
                .map(this::gradeHistory).toList();
        return new TeacherStudentWorkReviewDTO(
                workQueryService.get(assignmentId, studentId, email), history, submissions);
    }

    @Transactional(readOnly = true)
    public TeacherSubmissionEvidenceDTO getSubmission(UUID submissionId, String email) {
        User teacher = requireUser(email);
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new EntityNotFoundException("Submission not found: " + submissionId));
        if (!submission.getStudent().canParticipate()) {
            throw new EntityNotFoundException("Submission not found: " + submissionId);
        }
        if (!teacher.canManageGroups()
                || !submission.getAssignment().getGroup().getOwner().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("Only the assignment owner can inspect this submission");
        }
        return evidence(submission, true);
    }

    private TeacherSubmissionEvidenceDTO evidence(Submission submission, boolean includeSource) {
        Execution execution = executionRepository.findTopBySubmissionIdOrderByCreatedAtDesc(submission.getId())
                .orElse(null);
        boolean reportAvailable = execution != null
                && execution.getArtifactsPurgedAt() == null
                && execution.getArtifactsExpireAt() != null
                && execution.getArtifactsExpireAt().isAfter(Instant.now());
        return new TeacherSubmissionEvidenceDTO(
                submission.getId(), submission.getAssignment().getId(), submission.getStudent().getId(),
                submission.getLanguage(), submission.getCreatedAt(), submission.getDeliveredLate(),
                submission.getStatus(), submission.getWithdrawnAt(),
                includeSource ? readSource(submission) : null,
                execution == null ? null : ExecutionMapper.toDTO(execution), reportAvailable);
    }

    private AssignmentGradeHistoryDTO gradeHistory(AssignmentGradeHistory history) {
        User actor = history.getActor();
        boolean actorVisible = actor != null && actor.isApplicationVisible();
        String actorName = actor == null ? null : actorVisible
                ? (actor.getName() + " " + actor.getLastName()).trim() : "Deleted user";
        return new AssignmentGradeHistoryDTO(
                history.getId(), history.getValue(), history.getMaxPoints(), history.getStatus(),
                history.getReason(), actorVisible ? actor.getId() : null, actorName, history.getCreatedAt());
    }

    private String readSource(Submission submission) {
        if (submission.getSourceCodeKey() == null) return null;
        try (var stream = objectStorageService.download(submission.getSourceCodeKey())) {
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception exception) {
            return null;
        }
    }

    private void authorizeOwner(StudentAssignmentWork work, User teacher) {
        if (!teacher.canManageGroups()
                || !work.getAssignment().getGroup().getOwner().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("Only the assignment owner can inspect student work");
        }
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
    }
}
