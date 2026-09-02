package com.github.codehive.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.metrics.AssignmentMetricsDTO;
import com.github.codehive.model.dto.metrics.AssignmentMetricsDetailDTO;
import com.github.codehive.model.dto.metrics.CurrentSubmissionRow;
import com.github.codehive.model.dto.metrics.EnrollmentStatusCount;
import com.github.codehive.model.dto.metrics.GroupMetricsOverviewDTO;
import com.github.codehive.model.dto.metrics.StudentAssignmentMetricsDTO;
import com.github.codehive.model.dto.metrics.StudentGradeRow;
import com.github.codehive.model.dto.metrics.StudentMetricsDTO;
import com.github.codehive.model.dto.metrics.SubmissionAttemptCount;
import com.github.codehive.model.dto.metrics.SubmissionResultRow;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.GradeStatus;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.StudentWorkStatus;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.repository.AssignmentGradeRepository;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.StudentAssignmentWorkRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.UserRepository;

/**
 * Teacher-facing performance metrics (llms/backend/metrics). Only the group
 * owner may query them, regardless of role, and owners keep access to archived
 * and logically deleted groups as read-only history. Aggregates are restricted
 * to active enrollments and logically active assignments; averages are null
 * when there is no data.
 */
@Service
public class GroupMetricsService {
    private final ClassGroupRepository groupRepository;
    private final UserRepository userRepository;
    private final GroupEnrollmentRepository enrollmentRepository;
    private final AssignmentRepository assignmentRepository;
    private final StudentAssignmentWorkRepository workRepository;
    private final SubmissionRepository submissionRepository;
    private final ExecutionRepository executionRepository;
    private final AssignmentGradeRepository gradeRepository;

    public GroupMetricsService(ClassGroupRepository groupRepository,
                               UserRepository userRepository,
                               GroupEnrollmentRepository enrollmentRepository,
                               AssignmentRepository assignmentRepository,
                               StudentAssignmentWorkRepository workRepository,
                               SubmissionRepository submissionRepository,
                               ExecutionRepository executionRepository,
                               AssignmentGradeRepository gradeRepository) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.assignmentRepository = assignmentRepository;
        this.workRepository = workRepository;
        this.submissionRepository = submissionRepository;
        this.executionRepository = executionRepository;
        this.gradeRepository = gradeRepository;
    }

    @Transactional(readOnly = true)
    public GroupMetricsOverviewDTO overview(UUID groupId, String email) {
        ClassGroup group = requireOwnedGroup(groupId, email);
        GroupSnapshot snapshot = loadGroupSnapshot(group);
        Instant now = Instant.now();

        long active = 0;
        long left = 0;
        long removed = 0;
        for (EnrollmentStatusCount count : enrollmentRepository.countByGroupIdGroupedByStatus(groupId)) {
            switch (count.status()) {
                case ACTIVE -> active = count.total();
                case LEFT -> left = count.total();
                case REMOVED -> removed = count.total();
            }
        }

        List<Assignment> published = publishedAssignments(snapshot.assignments(), now);
        long processing = snapshot.assignments().stream()
                .filter(a -> a.getValidationStatus() == AssignmentValidationStatus.PROCESSING).count();
        long failed = snapshot.assignments().stream()
                .filter(a -> a.getValidationStatus() == AssignmentValidationStatus.FAILED).count();

        Set<UUID> publishedIds = published.stream().map(Assignment::getId).collect(Collectors.toSet());
        long submittedOnPublished = snapshot.currentRows().stream()
                .filter(row -> publishedIds.contains(row.assignmentId())).count();
        long submittedTotal = snapshot.currentRows().size();
        long lateTotal = snapshot.currentRows().stream()
                .filter(row -> Boolean.TRUE.equals(row.deliveredLate())).count();

        return new GroupMetricsOverviewDTO(
                groupId,
                now,
                new GroupMetricsOverviewDTO.EnrollmentBreakdown(active, left, removed),
                new GroupMetricsOverviewDTO.AssignmentBreakdown(
                        snapshot.assignments().size(), published.size(), processing, failed),
                percent(submittedOnPublished, active * published.size()),
                averageNormalizedScore(snapshot.gradeRows()),
                percent(submittedTotal - lateTotal, submittedTotal),
                new GroupMetricsOverviewDTO.GradingProgress(
                        submittedTotal,
                        snapshot.gradeRows().size(),
                        snapshot.gradeRows().stream()
                                .filter(row -> row.status() == GradeStatus.RETURNED).count()));
    }

    @Transactional(readOnly = true)
    public List<AssignmentMetricsDTO> assignmentMetrics(UUID groupId, String email) {
        ClassGroup group = requireOwnedGroup(groupId, email);
        GroupSnapshot snapshot = loadGroupSnapshot(group);
        Instant now = Instant.now();

        Map<UUID, List<CurrentSubmissionRow>> rowsByAssignment = snapshot.currentRows().stream()
                .collect(Collectors.groupingBy(CurrentSubmissionRow::assignmentId));
        Map<UUID, List<SubmissionAttemptCount>> attemptsByAssignment = snapshot.attempts().stream()
                .collect(Collectors.groupingBy(SubmissionAttemptCount::assignmentId));
        Map<UUID, List<StudentGradeRow>> gradesByAssignment = snapshot.gradeRows().stream()
                .collect(Collectors.groupingBy(StudentGradeRow::assignmentId));

        return snapshot.assignments().stream()
                .map(assignment -> buildAssignmentMetrics(
                        assignment,
                        snapshot.activeEnrollments().size(),
                        rowsByAssignment.getOrDefault(assignment.getId(), List.of()),
                        attemptsByAssignment.getOrDefault(assignment.getId(), List.of()),
                        gradesByAssignment.getOrDefault(assignment.getId(), List.of()),
                        snapshot.latestResultBySubmission(),
                        now))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentMetricsDTO> studentMetrics(UUID groupId, String email) {
        ClassGroup group = requireOwnedGroup(groupId, email);
        GroupSnapshot snapshot = loadGroupSnapshot(group);
        List<Assignment> published = publishedAssignments(snapshot.assignments(), Instant.now());
        List<UUID> publishedIds = published.stream().map(Assignment::getId).toList();

        Map<UUID, List<CurrentSubmissionRow>> rowsByStudent = snapshot.currentRows().stream()
                .collect(Collectors.groupingBy(CurrentSubmissionRow::studentId));
        Map<UUID, List<StudentGradeRow>> gradesByStudent = snapshot.gradeRows().stream()
                .collect(Collectors.groupingBy(StudentGradeRow::studentId));
        Map<UUID, Long> attemptsByStudent = snapshot.attempts().stream()
                .collect(Collectors.groupingBy(SubmissionAttemptCount::studentId,
                        Collectors.summingLong(SubmissionAttemptCount::attempts)));

        return sortedByStudentName(snapshot.activeEnrollments()).stream()
                .map(enrollment -> {
                    User student = enrollment.getStudent();
                    List<CurrentSubmissionRow> rows = rowsByStudent
                            .getOrDefault(student.getId(), List.of()).stream()
                            .filter(row -> publishedIds.contains(row.assignmentId()))
                            .toList();
                    Set<UUID> submittedAssignmentIds = rows.stream()
                            .map(CurrentSubmissionRow::assignmentId).collect(Collectors.toSet());
                    List<StudentGradeRow> grades = gradesByStudent
                            .getOrDefault(student.getId(), List.of());
                    return new StudentMetricsDTO(
                            student.getId(),
                            fullName(student),
                            student.getEnrollmentNumber(),
                            enrollment.getJoinedAt(),
                            publishedIds.size(),
                            rows.size(),
                            percent(rows.size(), publishedIds.size()),
                            rows.stream().filter(row -> Boolean.TRUE.equals(row.deliveredLate())).count(),
                            averageNormalizedScore(grades),
                            grades.size(),
                            attemptsByStudent.getOrDefault(student.getId(), 0L),
                            publishedIds.stream()
                                    .filter(id -> !submittedAssignmentIds.contains(id))
                                    .toList());
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public StudentMetricsDTO myGroupMetrics(UUID groupId, String email) {
        StudentContext context = requireActiveEnrollment(groupId, email);
        User student = context.student();
        GroupSnapshot snapshot = loadGroupSnapshot(context.group());
        List<UUID> publishedIds = publishedAssignments(snapshot.assignments(), Instant.now())
                .stream().map(Assignment::getId).toList();

        List<CurrentSubmissionRow> rows = snapshot.currentRows().stream()
                .filter(row -> row.studentId().equals(student.getId()))
                .filter(row -> publishedIds.contains(row.assignmentId()))
                .toList();
        Set<UUID> submittedAssignmentIds = rows.stream()
                .map(CurrentSubmissionRow::assignmentId).collect(Collectors.toSet());
        // Only RETURNED grades are visible to the student; drafts stay hidden.
        List<StudentGradeRow> grades = snapshot.gradeRows().stream()
                .filter(row -> row.studentId().equals(student.getId()))
                .filter(row -> row.status() == GradeStatus.RETURNED)
                .toList();
        long attempts = snapshot.attempts().stream()
                .filter(count -> count.studentId().equals(student.getId()))
                .mapToLong(SubmissionAttemptCount::attempts).sum();
        LocalDateTime joinedAt = snapshot.activeEnrollments().stream()
                .filter(enrollment -> enrollment.getStudent().getId().equals(student.getId()))
                .map(GroupEnrollment::getJoinedAt).findFirst().orElse(null);

        return new StudentMetricsDTO(
                student.getId(),
                fullName(student),
                student.getEnrollmentNumber(),
                joinedAt,
                publishedIds.size(),
                rows.size(),
                percent(rows.size(), publishedIds.size()),
                rows.stream().filter(row -> Boolean.TRUE.equals(row.deliveredLate())).count(),
                averageNormalizedScore(grades),
                grades.size(),
                attempts,
                publishedIds.stream().filter(id -> !submittedAssignmentIds.contains(id)).toList());
    }

    @Transactional(readOnly = true)
    public List<StudentAssignmentMetricsDTO> myAssignmentMetrics(UUID groupId, String email) {
        StudentContext context = requireActiveEnrollment(groupId, email);
        User student = context.student();
        GroupSnapshot snapshot = loadGroupSnapshot(context.group());

        Map<UUID, CurrentSubmissionRow> rowByAssignment = snapshot.currentRows().stream()
                .filter(row -> row.studentId().equals(student.getId()))
                .collect(Collectors.toMap(CurrentSubmissionRow::assignmentId, Function.identity(), (a, b) -> a));
        Map<UUID, Long> attemptsByAssignment = snapshot.attempts().stream()
                .filter(count -> count.studentId().equals(student.getId()))
                .collect(Collectors.toMap(SubmissionAttemptCount::assignmentId,
                        SubmissionAttemptCount::attempts, Long::sum));
        // Only RETURNED grades are visible to the student; drafts stay hidden.
        Map<UUID, StudentGradeRow> gradeByAssignment = snapshot.gradeRows().stream()
                .filter(row -> row.studentId().equals(student.getId()))
                .filter(row -> row.status() == GradeStatus.RETURNED)
                .collect(Collectors.toMap(StudentGradeRow::assignmentId, Function.identity(), (a, b) -> a));

        return publishedAssignments(snapshot.assignments(), Instant.now()).stream()
                .map(assignment -> {
                    CurrentSubmissionRow row = rowByAssignment.get(assignment.getId());
                    SubmissionResultRow result = row != null
                            ? snapshot.latestResultBySubmission().get(row.submissionId()) : null;
                    StudentGradeRow grade = gradeByAssignment.get(assignment.getId());
                    return new StudentAssignmentMetricsDTO(
                            assignment.getId(),
                            assignment.getTitle(),
                            assignment.getDueDate(),
                            assignment.getCloseDate(),
                            assignment.getMaxPoints(),
                            row != null ? row.workStatus() : StudentWorkStatus.NOT_SUBMITTED,
                            row != null ? row.submissionId() : null,
                            row != null ? row.deliveredLate() : null,
                            attemptsByAssignment.getOrDefault(assignment.getId(), 0L),
                            row != null ? (result != null ? result.status() : ExecutionStatus.PENDING) : null,
                            result != null ? result.timeMs() : null,
                            result != null ? result.memoryMb() : null,
                            grade != null
                                    ? new AssignmentMetricsDetailDTO.GradeSummary(
                                            grade.value(), grade.maxPoints(), grade.status())
                                    : null);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public AssignmentMetricsDetailDTO assignmentDetail(UUID assignmentId, String email) {
        Assignment assignment = requireOwnedActiveAssignment(assignmentId, email);
        Instant now = Instant.now();

        List<GroupEnrollment> activeEnrollments = enrollmentRepository
                .findByGroupIdAndStatusOrderByJoinedAtAsc(
                        assignment.getGroup().getId(), EnrollmentStatus.ACTIVE);
        Set<UUID> activeStudentIds = activeEnrollments.stream()
                .map(enrollment -> enrollment.getStudent().getId()).collect(Collectors.toSet());

        List<CurrentSubmissionRow> rows = workRepository
                .findCurrentSubmissionRowsByAssignmentId(assignmentId).stream()
                .filter(row -> activeStudentIds.contains(row.studentId())).toList();
        List<SubmissionAttemptCount> attempts = submissionRepository
                .countAttemptsByAssignmentId(assignmentId).stream()
                .filter(count -> activeStudentIds.contains(count.studentId())).toList();
        List<StudentGradeRow> grades = gradeRepository
                .findGradeRowsByAssignmentId(assignmentId).stream()
                .filter(row -> activeStudentIds.contains(row.studentId())).toList();
        Map<UUID, SubmissionResultRow> latestResults = latestResultsFor(rows);

        AssignmentMetricsDTO base = buildAssignmentMetrics(assignment, activeEnrollments.size(),
                rows, attempts, grades, latestResults, now);

        Map<Language, Long> languages = new EnumMap<>(Language.class);
        rows.forEach(row -> languages.merge(row.language(), 1L, Long::sum));

        List<SubmissionResultRow> acceptedResults = rows.stream()
                .map(row -> latestResults.get(row.submissionId()))
                .filter(result -> result != null && result.status() == ExecutionStatus.AC)
                .toList();

        Map<UUID, CurrentSubmissionRow> rowByStudent = rows.stream()
                .collect(Collectors.toMap(CurrentSubmissionRow::studentId, Function.identity()));
        Map<UUID, Long> attemptsByStudent = attempts.stream()
                .collect(Collectors.toMap(SubmissionAttemptCount::studentId,
                        SubmissionAttemptCount::attempts));
        Map<UUID, StudentGradeRow> gradeByStudent = grades.stream()
                .collect(Collectors.toMap(StudentGradeRow::studentId, Function.identity()));
        Map<UUID, StudentAssignmentWork> workByStudent = workRepository
                .findByAssignmentId(assignmentId).stream()
                .collect(Collectors.toMap(work -> work.getStudent().getId(),
                        Function.identity()));

        List<GroupEnrollment> sortedEnrollments = sortedByStudentName(activeEnrollments);
        List<AssignmentMetricsDetailDTO.StudentRef> missingStudents = sortedEnrollments.stream()
                .filter(enrollment -> !rowByStudent.containsKey(enrollment.getStudent().getId()))
                .map(enrollment -> new AssignmentMetricsDetailDTO.StudentRef(
                        enrollment.getStudent().getId(),
                        fullName(enrollment.getStudent()),
                        enrollment.getStudent().getEnrollmentNumber()))
                .toList();

        List<AssignmentMetricsDetailDTO.StudentBreakdown> perStudent = sortedEnrollments.stream()
                .map(enrollment -> studentBreakdown(enrollment.getStudent(),
                        rowByStudent, attemptsByStudent, gradeByStudent,
                        workByStudent, latestResults))
                .toList();

        return new AssignmentMetricsDetailDTO(
                base.assignmentId(), base.title(), base.validationStatus(),
                base.dueDate(), base.closeDate(), base.maxPoints(),
                base.activeStudents(), base.submittedCount(), base.submissionRate(),
                base.lateCount(), base.onTimeRate(), base.averageScore(), base.averagePoints(),
                base.draftGrades(), base.returnedGrades(), base.averageAttempts(),
                base.averageDeliveryMarginHours(), base.verdictDistribution(),
                base.missingCount(), base.overdue(),
                languages,
                new AssignmentMetricsDetailDTO.AcceptedPerformance(
                        averageOfLongs(acceptedResults.stream()
                                .map(SubmissionResultRow::timeMs).filter(Objects::nonNull).toList()),
                        averageOfLongs(acceptedResults.stream()
                                .map(SubmissionResultRow::memoryMb).filter(Objects::nonNull).toList()),
                        assignment.getTimeLimitMs(),
                        assignment.getMemoryLimitMb()),
                missingStudents,
                perStudent);
    }

    private AssignmentMetricsDetailDTO.StudentBreakdown studentBreakdown(
            User student,
            Map<UUID, CurrentSubmissionRow> rowByStudent,
            Map<UUID, Long> attemptsByStudent,
            Map<UUID, StudentGradeRow> gradeByStudent,
            Map<UUID, StudentAssignmentWork> workByStudent,
            Map<UUID, SubmissionResultRow> latestResults) {
        CurrentSubmissionRow row = rowByStudent.get(student.getId());
        SubmissionResultRow result = row != null ? latestResults.get(row.submissionId()) : null;
        StudentGradeRow grade = gradeByStudent.get(student.getId());
        StudentAssignmentWork work = workByStudent.get(student.getId());
        return new AssignmentMetricsDetailDTO.StudentBreakdown(
                student.getId(),
                fullName(student),
                student.getEnrollmentNumber(),
                work != null ? work.getId() : null,
                work != null ? work.getStatus() : StudentWorkStatus.NOT_SUBMITTED,
                row != null ? row.submissionId() : null,
                row != null ? row.deliveredLate() : null,
                attemptsByStudent.getOrDefault(student.getId(), 0L),
                row != null ? (result != null ? result.status() : ExecutionStatus.PENDING) : null,
                result != null ? result.timeMs() : null,
                result != null ? result.memoryMb() : null,
                grade != null
                        ? new AssignmentMetricsDetailDTO.GradeSummary(
                                grade.value(), grade.maxPoints(), grade.status())
                        : null);
    }

    private AssignmentMetricsDTO buildAssignmentMetrics(Assignment assignment,
                                                        long activeStudents,
                                                        List<CurrentSubmissionRow> rows,
                                                        List<SubmissionAttemptCount> attempts,
                                                        List<StudentGradeRow> grades,
                                                        Map<UUID, SubmissionResultRow> latestResults,
                                                        Instant now) {
        long submitted = rows.size();
        long late = rows.stream().filter(row -> Boolean.TRUE.equals(row.deliveredLate())).count();

        Map<ExecutionStatus, Long> verdicts = new EnumMap<>(ExecutionStatus.class);
        for (CurrentSubmissionRow row : rows) {
            SubmissionResultRow result = latestResults.get(row.submissionId());
            ExecutionStatus status = result != null ? result.status() : ExecutionStatus.PENDING;
            verdicts.merge(status, 1L, Long::sum);
        }

        BigDecimal averageAttempts = attempts.isEmpty() ? null
                : BigDecimal.valueOf(attempts.stream()
                                .mapToLong(SubmissionAttemptCount::attempts).sum())
                        .divide(BigDecimal.valueOf(attempts.size()), 2, RoundingMode.HALF_UP);

        BigDecimal deliveryMargin = null;
        if (assignment.getDueDate() != null && !rows.isEmpty()) {
            long totalMinutes = rows.stream()
                    .mapToLong(row -> Duration.between(
                            toInstant(row.submittedAt()), assignment.getDueDate()).toMinutes())
                    .sum();
            deliveryMargin = BigDecimal.valueOf(totalMinutes)
                    .divide(BigDecimal.valueOf(rows.size() * 60L), 2, RoundingMode.HALF_UP);
        }

        return new AssignmentMetricsDTO(
                assignment.getId(),
                assignment.getTitle(),
                assignment.getValidationStatus(),
                assignment.getDueDate(),
                assignment.getCloseDate(),
                assignment.getMaxPoints(),
                activeStudents,
                submitted,
                percent(submitted, activeStudents),
                late,
                percent(submitted - late, submitted),
                averageNormalizedScore(grades),
                averagePoints(grades),
                grades.stream().filter(row -> row.status() == GradeStatus.DRAFT).count(),
                grades.stream().filter(row -> row.status() == GradeStatus.RETURNED).count(),
                averageAttempts,
                deliveryMargin,
                verdicts,
                activeStudents - submitted,
                assignment.getDueDate() != null && now.isAfter(assignment.getDueDate()));
    }

    /**
     * Loads every flat projection the group endpoints need with a fixed number
     * of queries, restricting student-linked rows to active enrollments.
     */
    private GroupSnapshot loadGroupSnapshot(ClassGroup group) {
        List<GroupEnrollment> activeEnrollments = enrollmentRepository
                .findByGroupIdAndStatusOrderByJoinedAtAsc(group.getId(), EnrollmentStatus.ACTIVE);
        Set<UUID> activeStudentIds = activeEnrollments.stream()
                .map(enrollment -> enrollment.getStudent().getId()).collect(Collectors.toSet());

        List<Assignment> assignments = assignmentRepository
                .findByGroupIdAndIsActiveTrueOrderByCreatedAtDesc(group.getId());
        List<CurrentSubmissionRow> currentRows = workRepository
                .findCurrentSubmissionRowsByGroupId(group.getId()).stream()
                .filter(row -> activeStudentIds.contains(row.studentId())).toList();
        List<SubmissionAttemptCount> attempts = submissionRepository
                .countAttemptsByGroupId(group.getId()).stream()
                .filter(count -> activeStudentIds.contains(count.studentId())).toList();
        List<StudentGradeRow> gradeRows = gradeRepository
                .findGradeRowsByGroupId(group.getId()).stream()
                .filter(row -> activeStudentIds.contains(row.studentId())).toList();

        return new GroupSnapshot(activeEnrollments, assignments, currentRows, attempts,
                gradeRows, latestResultsFor(currentRows));
    }

    /** Newest non-outdated execution per submission; rows arrive newest first. */
    private Map<UUID, SubmissionResultRow> latestResultsFor(List<CurrentSubmissionRow> rows) {
        if (rows.isEmpty()) return Map.of();
        List<UUID> submissionIds = rows.stream().map(CurrentSubmissionRow::submissionId).toList();
        Map<UUID, SubmissionResultRow> latest = new java.util.LinkedHashMap<>();
        for (SubmissionResultRow result : executionRepository.findResultRowsBySubmissionIds(submissionIds)) {
            latest.putIfAbsent(result.submissionId(), result);
        }
        return latest;
    }

    private List<Assignment> publishedAssignments(List<Assignment> assignments, Instant now) {
        return assignments.stream()
                .filter(a -> a.getValidationStatus() == AssignmentValidationStatus.READY)
                .filter(a -> a.getLaunchDate() == null || !now.isBefore(a.getLaunchDate()))
                .toList();
    }

    private ClassGroup requireOwnedGroup(UUID groupId, String email) {
        User user = requireUser(email);
        ClassGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new EntityNotFoundException("Group not found: " + groupId));
        if (!group.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("Only the group owner can view its metrics");
        }
        return group;
    }

    private StudentContext requireActiveEnrollment(UUID groupId, String email) {
        User student = requireUser(email);
        ClassGroup group = groupRepository.findById(groupId)
                .filter(found -> Boolean.TRUE.equals(found.getIsActive()))
                .orElseThrow(() -> new EntityNotFoundException("Group not found: " + groupId));
        if (!enrollmentRepository.existsByGroupIdAndStudentIdAndStatus(
                groupId, student.getId(), EnrollmentStatus.ACTIVE)) {
            throw new AccessDeniedException("Active enrollment is required to view these metrics");
        }
        return new StudentContext(group, student);
    }

    private Assignment requireOwnedActiveAssignment(UUID assignmentId, String email) {
        User user = requireUser(email);
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .filter(found -> Boolean.TRUE.equals(found.getIsActive()))
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found: " + assignmentId));
        if (!assignment.getGroup().getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("Only the group owner can view assignment metrics");
        }
        return assignment;
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
    }

    private static List<GroupEnrollment> sortedByStudentName(List<GroupEnrollment> enrollments) {
        List<GroupEnrollment> sorted = new ArrayList<>(enrollments);
        sorted.sort(Comparator
                .comparing((GroupEnrollment enrollment) -> enrollment.getStudent().getLastName(),
                        String.CASE_INSENSITIVE_ORDER)
                .thenComparing(enrollment -> enrollment.getStudent().getName(),
                        String.CASE_INSENSITIVE_ORDER));
        return sorted;
    }

    private static String fullName(User user) {
        return user.getName() + " " + user.getLastName();
    }

    /** part/whole as a 0-100 percentage with 2 decimals; null when whole is 0. */
    private static BigDecimal percent(long part, long whole) {
        if (whole <= 0) return null;
        return BigDecimal.valueOf(part * 100L)
                .divide(BigDecimal.valueOf(whole), 2, RoundingMode.HALF_UP);
    }

    /** Average of value/maxPoints normalized to 0-100; skips grades with a zero snapshot. */
    private static BigDecimal averageNormalizedScore(List<StudentGradeRow> grades) {
        List<BigDecimal> normalized = grades.stream()
                .filter(row -> row.maxPoints() != null && row.maxPoints().signum() > 0)
                .map(row -> row.value()
                        .multiply(BigDecimal.valueOf(100))
                        .divide(row.maxPoints(), 6, RoundingMode.HALF_UP))
                .toList();
        return averageOf(normalized);
    }

    private static BigDecimal averagePoints(List<StudentGradeRow> grades) {
        return averageOf(grades.stream().map(StudentGradeRow::value).toList());
    }

    private static BigDecimal averageOf(List<BigDecimal> values) {
        if (values.isEmpty()) return null;
        BigDecimal sum = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
    }

    private static BigDecimal averageOfLongs(List<Long> values) {
        if (values.isEmpty()) return null;
        long sum = values.stream().mapToLong(Long::longValue).sum();
        return BigDecimal.valueOf(sum)
                .divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
    }

    /** Submission timestamps are LocalDateTime written with the server zone. */
    private static Instant toInstant(LocalDateTime dateTime) {
        return dateTime.atZone(ZoneId.systemDefault()).toInstant();
    }

    private record StudentContext(ClassGroup group, User student) {
    }

    private record GroupSnapshot(
            List<GroupEnrollment> activeEnrollments,
            List<Assignment> assignments,
            List<CurrentSubmissionRow> currentRows,
            List<SubmissionAttemptCount> attempts,
            List<StudentGradeRow> gradeRows,
            Map<UUID, SubmissionResultRow> latestResultBySubmission) {
    }
}
