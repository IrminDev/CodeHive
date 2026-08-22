package com.github.codehive.service;

import java.time.Instant;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.RecentSubmissionDTO;
import com.github.codehive.model.dto.StudentGroupSubmissionDTO;
import com.github.codehive.model.dto.StudentSubmissionHistoryDTO;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.SubmissionStatus;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.UserRepository;

@Service
public class StudentSubmissionQueryService {
    private final SubmissionRepository submissionRepository;
    private final ExecutionRepository executionRepository;
    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final GroupService groupService;

    public StudentSubmissionQueryService(SubmissionRepository submissionRepository,
                                         ExecutionRepository executionRepository,
                                         AssignmentRepository assignmentRepository,
                                         UserRepository userRepository,
                                         GroupService groupService) {
        this.submissionRepository = submissionRepository;
        this.executionRepository = executionRepository;
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.groupService = groupService;
    }

    @Transactional(readOnly = true)
    public List<StudentSubmissionHistoryDTO> listAssignmentHistory(
            UUID assignmentId, String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found: " + assignmentId));
        groupService.getGroupForAssignmentAccess(assignment.getGroup().getId(), student);
        if (!Boolean.TRUE.equals(assignment.getIsActive())) {
            throw new EntityNotFoundException("Assignment not found: " + assignmentId);
        }

        List<Submission> submissions = submissionRepository
                .findByAssignmentAndStudentOrderByCreatedAtDesc(assignment, student);
        Map<UUID, Execution> executionBySubmission = latestExecutions(submissions);
        Instant now = Instant.now();
        return submissions.stream().map(submission -> {
            Execution execution = executionBySubmission.get(submission.getId());
            ExecutionStatus executionStatus = execution != null
                    ? execution.getStatus() : ExecutionStatus.PENDING;
            boolean reportAvailable = execution != null
                    && executionStatus != ExecutionStatus.PENDING
                    && execution.getArtifactsPurgedAt() == null
                    && (execution.getArtifactsExpireAt() == null
                        || now.isBefore(execution.getArtifactsExpireAt()));
            return new StudentSubmissionHistoryDTO(
                    submission.getId(), assignmentId, submission.getLanguage(), submission.getStatus(),
                    submission.getCreatedAt(), Boolean.TRUE.equals(submission.getDeliveredLate()),
                    submission.getWithdrawnAt(), execution != null ? execution.getId() : null,
                    executionStatus, execution != null ? execution.getTimeMs() : null,
                    execution != null ? execution.getMemoryMb() : null, reportAvailable);
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<RecentSubmissionDTO> listRecent(String email, int limit) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
        int boundedLimit = Math.clamp(limit, 1, 20);
        return submissionRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()).stream()
                .limit(boundedLimit)
                .map(submission -> executionRepository.findTopBySubmissionIdOrderByCreatedAtDesc(submission.getId())
                        .map(execution -> new RecentSubmissionDTO(
                                submission.getId(), submission.getAssignment().getId(),
                                submission.getAssignment().getTitle(), submission.getLanguage(),
                                execution.getStatus(), execution.getTimeMs(), submission.getCreatedAt()))
                        .orElseGet(() -> new RecentSubmissionDTO(
                                submission.getId(), submission.getAssignment().getId(),
                                submission.getAssignment().getTitle(), submission.getLanguage(),
                                ExecutionStatus.PENDING, null, submission.getCreatedAt())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentGroupSubmissionDTO> listGroupSubmissions(UUID groupId, String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
        groupService.getGroupForAssignmentAccess(groupId, student);

        List<Submission> submissions = submissionRepository
                .findByStudentIdAndAssignmentGroupIdAndStatusOrderByCreatedAtDesc(
                        student.getId(), groupId, SubmissionStatus.SUBMITTED);
        Map<UUID, ExecutionStatus> statuses = latestExecutionStatuses(submissions);
        return submissions
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                        submission -> submission.getAssignment().getId(),
                        submission -> new StudentGroupSubmissionDTO(
                                submission.getAssignment().getId(), submission.getId(), submission.getCreatedAt(),
                                Boolean.TRUE.equals(submission.getDeliveredLate()),
                                statuses.getOrDefault(submission.getId(), ExecutionStatus.PENDING)),
                        (latest, ignored) -> latest,
                        LinkedHashMap::new))
                .values().stream().toList();
    }

    private Map<UUID, Execution> latestExecutions(Collection<Submission> submissions) {
        List<UUID> submissionIds = submissions.stream().map(Submission::getId).toList();
        if (submissionIds.isEmpty()) return Map.of();
        return executionRepository.findLatestCandidatesBySubmissionIds(submissionIds).stream()
                .collect(Collectors.toMap(
                        execution -> execution.getSubmission().getId(), Function.identity(),
                        (latest, ignored) -> latest, LinkedHashMap::new));
    }

    private Map<UUID, ExecutionStatus> latestExecutionStatuses(Collection<Submission> submissions) {
        List<UUID> submissionIds = submissions.stream().map(Submission::getId).toList();
        if (submissionIds.isEmpty()) return Map.of();
        Map<UUID, ExecutionStatus> statuses = new LinkedHashMap<>();
        executionRepository.findResultRowsBySubmissionIds(submissionIds)
                .forEach(row -> statuses.putIfAbsent(row.submissionId(), row.status()));
        return statuses;
    }
}
