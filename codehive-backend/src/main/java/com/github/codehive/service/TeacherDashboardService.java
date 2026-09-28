package com.github.codehive.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;

import com.github.codehive.model.dto.TeacherDashboardDTO;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentGrade;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.GradeStatus;
import com.github.codehive.model.enums.StudentWorkStatus;
import com.github.codehive.model.enums.SubmissionStatus;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.repository.AssignmentGradeRepository;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.StudentAssignmentWorkRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.UserRepository;

@Service
public class TeacherDashboardService {
    private final UserRepository userRepository;
    private final ClassGroupRepository groupRepository;
    private final GroupEnrollmentRepository enrollmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final StudentAssignmentWorkRepository workRepository;
    private final AssignmentGradeRepository gradeRepository;
    private final SubmissionRepository submissionRepository;
    private final ExecutionRepository executionRepository;

    public TeacherDashboardService(
            UserRepository userRepository, ClassGroupRepository groupRepository,
            GroupEnrollmentRepository enrollmentRepository, AssignmentRepository assignmentRepository,
            StudentAssignmentWorkRepository workRepository, AssignmentGradeRepository gradeRepository,
            SubmissionRepository submissionRepository, ExecutionRepository executionRepository) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.assignmentRepository = assignmentRepository;
        this.workRepository = workRepository;
        this.gradeRepository = gradeRepository;
        this.submissionRepository = submissionRepository;
        this.executionRepository = executionRepository;
    }

    @Transactional(readOnly = true)
    public TeacherDashboardDTO get(String email) {
        User teacher = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
        List<ClassGroup> groups = groupRepository.findByOwnerIdAndIsActiveTrueOrderByCreatedAtDesc(teacher.getId())
                .stream().filter(group -> !Boolean.TRUE.equals(group.getArchived())).toList();
        List<Assignment> assignments = groups.stream()
                .flatMap(group -> assignmentRepository.findByGroupIdAndIsActiveTrueOrderByCreatedAtDesc(group.getId()).stream())
                .toList();
        List<UUID> assignmentIds = assignments.stream().map(Assignment::getId).toList();
        List<StudentAssignmentWork> works = assignmentIds.isEmpty()
                ? List.of() : workRepository.findByAssignmentIdIn(assignmentIds);
        Map<UUID, AssignmentGrade> grades = new HashMap<>();
        if (!works.isEmpty()) gradeRepository.findByStudentWorkIdIn(works.stream().map(StudentAssignmentWork::getId).toList())
                .forEach(grade -> grades.put(grade.getStudentWork().getId(), grade));

        long activeStudents = groups.stream().mapToLong(group -> enrollmentRepository
                .findByGroupIdAndStatusOrderByJoinedAtAsc(group.getId(), EnrollmentStatus.ACTIVE).size()).sum();
        long needsGrading = works.stream().filter(work -> work.getStatus() == StudentWorkStatus.SUBMITTED)
                .filter(work -> {
                    AssignmentGrade grade = grades.get(work.getId());
                    return grade == null || grade.getStatus() != GradeStatus.RETURNED;
                }).count();

        List<TeacherDashboardDTO.ValidationItem> validation = assignments.stream()
                .filter(assignment -> assignment.getValidationStatus() != AssignmentValidationStatus.READY)
                .map(assignment -> new TeacherDashboardDTO.ValidationItem(
                        assignment.getId(), assignment.getGroup().getId(), assignment.getGroup().getName(),
                        assignment.getTitle(), assignment.getValidationStatus()))
                .limit(8).toList();

        List<TeacherDashboardDTO.GradingItem> grading = new ArrayList<>();
        for (Assignment assignment : assignments) {
            List<StudentAssignmentWork> assignmentWorks = works.stream()
                    .filter(work -> work.getAssignment().getId().equals(assignment.getId())).toList();
            long submitted = assignmentWorks.stream().filter(work -> work.getCurrentSubmission() != null).count();
            long pending = assignmentWorks.stream().filter(work -> work.getStatus() == StudentWorkStatus.SUBMITTED)
                    .filter(work -> {
                        AssignmentGrade grade = grades.get(work.getId());
                        return grade == null || grade.getStatus() != GradeStatus.RETURNED;
                    }).count();
            if (pending > 0) grading.add(new TeacherDashboardDTO.GradingItem(
                    assignment.getId(), assignment.getGroup().getId(), assignment.getGroup().getName(),
                    assignment.getTitle(), submitted, pending));
        }
        grading.sort(Comparator.comparingLong(TeacherDashboardDTO.GradingItem::needsGrading).reversed());

        Instant now = Instant.now();
        List<TeacherDashboardDTO.DeadlineItem> deadlines = assignments.stream()
                .filter(assignment -> future(assignment.getLaunchDate(), now)
                        || future(assignment.getDueDate(), now) || future(assignment.getCloseDate(), now))
                .sorted(Comparator.comparing(this::nextDate))
                .limit(8)
                .map(assignment -> new TeacherDashboardDTO.DeadlineItem(
                        assignment.getId(), assignment.getGroup().getId(), assignment.getTitle(),
                        assignment.getLaunchDate(), assignment.getDueDate(), assignment.getCloseDate()))
                .toList();

        List<TeacherDashboardDTO.RecentSubmission> recent = submissionRepository
                .findLatestSubmittedByAssignmentGroupOwnerId(
                        teacher.getId(), SubmissionStatus.SUBMITTED, PageRequest.of(0, 10)).stream()
                .map(this::recentSubmission).toList();

        return new TeacherDashboardDTO(
                new TeacherDashboardDTO.Summary(groups.size(), activeStudents, assignments.size(),
                        needsGrading, validation.size()),
                validation, grading.stream().limit(8).toList(), deadlines, recent);
    }

    private TeacherDashboardDTO.RecentSubmission recentSubmission(Submission submission) {
        Execution execution = executionRepository.findTopBySubmissionIdOrderByCreatedAtDesc(submission.getId())
                .orElse(null);
        User student = submission.getStudent();
        return new TeacherDashboardDTO.RecentSubmission(
                submission.getId(), submission.getAssignment().getId(), submission.getAssignment().getGroup().getId(),
                submission.getAssignment().getTitle(), student.getId(),
                (student.getName() + " " + student.getLastName()).trim(), submission.getLanguage(),
                submission.getCreatedAt(), execution == null ? null : execution.getStatus());
    }

    private boolean future(Instant value, Instant now) { return value != null && value.isAfter(now); }

    private Instant nextDate(Assignment assignment) {
        Instant now = Instant.now();
        return Stream.of(assignment.getLaunchDate(), assignment.getDueDate(), assignment.getCloseDate())
                .filter(value -> value != null && value.isAfter(now)).min(Instant::compareTo).orElse(Instant.MAX);
    }
}
