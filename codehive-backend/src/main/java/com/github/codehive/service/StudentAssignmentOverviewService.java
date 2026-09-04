package com.github.codehive.service;

import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.AssignmentGradeDTO;
import com.github.codehive.model.dto.StudentAssignmentOverviewDTO;
import com.github.codehive.model.dto.StudentGroupSubmissionDTO;
import com.github.codehive.model.dto.metrics.SubmissionResultRow;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentFeedback;
import com.github.codehive.model.entity.AssignmentGrade;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.GradeStatus;
import com.github.codehive.model.enums.StudentWorkStatus;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.mapper.AssignmentMapper;
import com.github.codehive.repository.AssignmentFeedbackRepository;
import com.github.codehive.repository.AssignmentGradeRepository;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.StudentAssignmentWorkRepository;
import com.github.codehive.repository.UserRepository;

@Service
public class StudentAssignmentOverviewService {
    private final AssignmentRepository assignmentRepository;
    private final GroupEnrollmentRepository enrollmentRepository;
    private final StudentAssignmentWorkRepository workRepository;
    private final AssignmentGradeRepository gradeRepository;
    private final AssignmentFeedbackRepository feedbackRepository;
    private final ExecutionRepository executionRepository;
    private final UserRepository userRepository;

    public StudentAssignmentOverviewService(
            AssignmentRepository assignmentRepository,
            GroupEnrollmentRepository enrollmentRepository,
            StudentAssignmentWorkRepository workRepository,
            AssignmentGradeRepository gradeRepository,
            AssignmentFeedbackRepository feedbackRepository,
            ExecutionRepository executionRepository,
            UserRepository userRepository) {
        this.assignmentRepository = assignmentRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.workRepository = workRepository;
        this.gradeRepository = gradeRepository;
        this.feedbackRepository = feedbackRepository;
        this.executionRepository = executionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<StudentAssignmentOverviewDTO> listMine(String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
        List<UUID> groupIds = enrollmentRepository
                .findByStudentIdAndStatus(student.getId(), EnrollmentStatus.ACTIVE).stream()
                .map(GroupEnrollment::getGroup)
                .filter(group -> Boolean.TRUE.equals(group.getIsActive()))
                .map(group -> group.getId())
                .distinct()
                .toList();
        if (groupIds.isEmpty()) return List.of();

        List<Assignment> assignments = assignmentRepository.findStudentVisibleForGroups(
                groupIds, AssignmentValidationStatus.READY, Instant.now());
        if (assignments.isEmpty()) return List.of();

        List<UUID> assignmentIds = assignments.stream().map(Assignment::getId).toList();
        Map<UUID, StudentAssignmentWork> workByAssignment = workRepository
                .findByStudentIdAndAssignmentIdIn(student.getId(), assignmentIds).stream()
                .collect(Collectors.toMap(work -> work.getAssignment().getId(), Function.identity()));
        List<UUID> workIds = workByAssignment.values().stream().map(StudentAssignmentWork::getId).toList();
        Map<UUID, AssignmentGrade> gradeByWork = returnedGrades(workIds);
        Map<UUID, Long> feedbackCountByWork = visibleFeedbackCounts(workIds);
        Map<UUID, SubmissionResultRow> resultBySubmission = currentExecutionResults(workByAssignment.values());

        return assignments.stream().map(assignment -> {
            StudentAssignmentWork work = workByAssignment.get(assignment.getId());
            Submission current = work != null ? work.getCurrentSubmission() : null;
            StudentGroupSubmissionDTO currentDTO = null;
            if (current != null) {
                SubmissionResultRow result = resultBySubmission.get(current.getId());
                currentDTO = new StudentGroupSubmissionDTO(
                        assignment.getId(), current.getId(), current.getCreatedAt(),
                        Boolean.TRUE.equals(current.getDeliveredLate()),
                        result != null ? result.status() : ExecutionStatus.PENDING);
            }
            AssignmentGrade grade = work != null ? gradeByWork.get(work.getId()) : null;
            return new StudentAssignmentOverviewDTO(
                    AssignmentMapper.toDTO(assignment),
                    assignment.getGroup().getId(),
                    assignment.getGroup().getName(),
                    Boolean.TRUE.equals(assignment.getGroup().getArchived()),
                    work != null ? work.getStatus() : StudentWorkStatus.NOT_SUBMITTED,
                    currentDTO,
                    grade != null ? toGradeDTO(grade) : null,
                    work != null ? feedbackCountByWork.getOrDefault(work.getId(), 0L) : 0L);
        }).toList();
    }

    private Map<UUID, AssignmentGrade> returnedGrades(List<UUID> workIds) {
        if (workIds.isEmpty()) return Map.of();
        return gradeRepository.findByStudentWorkIdIn(workIds).stream()
                .filter(grade -> grade.getStatus() == GradeStatus.RETURNED)
                .collect(Collectors.toMap(grade -> grade.getStudentWork().getId(), Function.identity()));
    }

    private Map<UUID, Long> visibleFeedbackCounts(List<UUID> workIds) {
        if (workIds.isEmpty()) return Map.of();
        Map<UUID, Long> counts = new HashMap<>();
        for (AssignmentFeedback feedback : feedbackRepository.findByStudentWorkIdIn(workIds)) {
            counts.merge(feedback.getStudentWork().getId(), 1L, Long::sum);
        }
        return counts;
    }

    private Map<UUID, SubmissionResultRow> currentExecutionResults(
            Collection<StudentAssignmentWork> works) {
        List<UUID> submissionIds = works.stream()
                .map(StudentAssignmentWork::getCurrentSubmission)
                .filter(java.util.Objects::nonNull)
                .map(Submission::getId)
                .toList();
        if (submissionIds.isEmpty()) return Map.of();
        Map<UUID, SubmissionResultRow> results = new LinkedHashMap<>();
        executionRepository.findResultRowsBySubmissionIds(submissionIds)
                .forEach(row -> results.putIfAbsent(row.submissionId(), row));
        return results;
    }

    private AssignmentGradeDTO toGradeDTO(AssignmentGrade grade) {
        StudentAssignmentWork work = grade.getStudentWork();
        return new AssignmentGradeDTO(
                grade.getId(), work.getAssignment().getId(), work.getStudent().getId(),
                grade.getGradedSubmission() != null ? grade.getGradedSubmission().getId() : null,
                grade.getValue(), grade.getMaxPointsSnapshot(), grade.getStatus(),
                grade.getUpdatedAt(), grade.getReturnedAt());
    }
}
