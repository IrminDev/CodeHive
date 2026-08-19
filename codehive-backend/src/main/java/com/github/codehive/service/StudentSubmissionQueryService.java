package com.github.codehive.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.RecentSubmissionDTO;
import com.github.codehive.model.dto.StudentGroupSubmissionDTO;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.SubmissionStatus;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.UserRepository;

import java.util.LinkedHashMap;
import java.util.UUID;

@Service
public class StudentSubmissionQueryService {
    private final SubmissionRepository submissionRepository;
    private final ExecutionRepository executionRepository;
    private final UserRepository userRepository;
    private final GroupService groupService;

    public StudentSubmissionQueryService(SubmissionRepository submissionRepository,
                                         ExecutionRepository executionRepository,
                                         UserRepository userRepository,
                                         GroupService groupService) {
        this.submissionRepository = submissionRepository;
        this.executionRepository = executionRepository;
        this.userRepository = userRepository;
        this.groupService = groupService;
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

        return submissionRepository
                .findByStudentIdAndAssignmentGroupIdAndStatusOrderByCreatedAtDesc(
                        student.getId(), groupId, SubmissionStatus.SUBMITTED)
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                        submission -> submission.getAssignment().getId(),
                        submission -> new StudentGroupSubmissionDTO(
                                submission.getAssignment().getId(), submission.getId(),
                                submission.getCreatedAt(), Boolean.TRUE.equals(submission.getDeliveredLate())),
                        (latest, ignored) -> latest,
                        LinkedHashMap::new))
                .values().stream().toList();
    }
}
