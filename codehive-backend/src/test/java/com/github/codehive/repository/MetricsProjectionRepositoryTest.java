package com.github.codehive.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.github.codehive.model.dto.metrics.CurrentSubmissionRow;
import com.github.codehive.model.dto.metrics.EnrollmentStatusCount;
import com.github.codehive.model.dto.metrics.StudentGradeRow;
import com.github.codehive.model.dto.metrics.SubmissionAttemptCount;
import com.github.codehive.model.dto.metrics.SubmissionResultRow;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentGrade;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.model.enums.GradeStatus;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.StudentWorkStatus;
import com.github.codehive.model.enums.SubmissionStatus;

import jakarta.persistence.EntityManager;

@DataJpaTest
class MetricsProjectionRepositoryTest {
    private static final LocalDateTime BASE = LocalDateTime.of(2026, 1, 15, 12, 0);

    @Autowired private UserRepository userRepository;
    @Autowired private ClassGroupRepository groupRepository;
    @Autowired private GroupEnrollmentRepository enrollmentRepository;
    @Autowired private AssignmentRepository assignmentRepository;
    @Autowired private StudentAssignmentWorkRepository workRepository;
    @Autowired private SubmissionRepository submissionRepository;
    @Autowired private ExecutionRepository executionRepository;
    @Autowired private AssignmentGradeRepository gradeRepository;
    @Autowired private EntityManager entityManager;

    private ClassGroup group;
    private User ada;
    private User grace;
    private Assignment activeAssignment;
    private Assignment inactiveAssignment;
    private Submission adaCurrentSubmission;

    @BeforeEach
    void setUp() {
        User teacher = userRepository.save(new User(
                "Grace", "Hopper", "T-0001", "teacher@codehive-test.com", "encoded", Role.TEACHER));
        ada = userRepository.save(new User(
                "Ada", "Lovelace", "S-0001", "ada@codehive-test.com", "encoded", Role.STUDENT));
        grace = userRepository.save(new User(
                "Grace", "Murray", "S-0002", "grace@codehive-test.com", "encoded", Role.STUDENT));
        User alan = userRepository.save(new User(
                "Alan", "Turing", "S-0003", "alan@codehive-test.com", "encoded", Role.STUDENT));

        group = groupRepository.save(new ClassGroup("Algorithms", null, teacher, "METRICS1"));
        enrollmentRepository.save(new GroupEnrollment(group, ada));
        enrollmentRepository.save(new GroupEnrollment(group, grace));
        GroupEnrollment leftEnrollment = new GroupEnrollment(group, alan);
        leftEnrollment.setStatus(EnrollmentStatus.LEFT);
        leftEnrollment.setEndedAt(BASE);
        enrollmentRepository.save(leftEnrollment);

        activeAssignment = newAssignment(teacher, "Graphs", true, BASE.minusDays(2));
        inactiveAssignment = newAssignment(teacher, "Deleted homework", false, BASE.minusDays(3));

        // Ada: two attempts on the active assignment; the second is current and late.
        StudentAssignmentWork adaWork = newWork(activeAssignment, ada, StudentWorkStatus.SUBMITTED);
        Submission adaFirst = newSubmission(activeAssignment, ada, adaWork,
                SubmissionStatus.SUPERSEDED, false, BASE.minusHours(30));
        adaCurrentSubmission = newSubmission(activeAssignment, ada, adaWork,
                SubmissionStatus.SUBMITTED, true, BASE.minusHours(2));
        adaWork.setCurrentSubmission(adaCurrentSubmission);
        workRepository.save(adaWork);

        // Grace: submitted once and withdrew, so she has no current submission.
        StudentAssignmentWork graceWork = newWork(activeAssignment, grace, StudentWorkStatus.WITHDRAWN);
        newSubmission(activeAssignment, grace, graceWork,
                SubmissionStatus.WITHDRAWN, false, BASE.minusHours(20));

        // A submission on the logically deleted assignment must never be counted.
        newSubmission(inactiveAssignment, ada, null,
                SubmissionStatus.SUBMITTED, false, BASE.minusHours(10));

        // Executions of Ada's current submission: an outdated one, an old WA, and the latest AC.
        newExecution(adaFirst, ExecutionStatus.WA, false, BASE.minusHours(29), 500L, 40L);
        newExecution(adaCurrentSubmission, ExecutionStatus.AC, true, BASE.minusMinutes(90), 450L, 35L);
        newExecution(adaCurrentSubmission, ExecutionStatus.WA, false, BASE.minusMinutes(80), 480L, 33L);
        newExecution(adaCurrentSubmission, ExecutionStatus.AC, false, BASE.minusMinutes(60), 320L, 30L);

        AssignmentGrade grade = new AssignmentGrade();
        grade.setStudentWork(adaWork);
        grade.setValue(new BigDecimal("95.00"));
        grade.setMaxPointsSnapshot(new BigDecimal("100.00"));
        grade.setStatus(GradeStatus.RETURNED);
        grade.setReturnedAt(Instant.now());
        grade.setGradedBy(teacher);
        grade.setGradedSubmission(adaCurrentSubmission);
        gradeRepository.save(grade);

        entityManager.flush();
        entityManager.clear();
    }

    @Test
    void countsEnrollmentsGroupedByStatus() {
        List<EnrollmentStatusCount> counts = enrollmentRepository.countByGroupIdGroupedByStatus(group.getId());

        assertThat(counts).extracting(EnrollmentStatusCount::status, EnrollmentStatusCount::total)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple(EnrollmentStatus.ACTIVE, 2L),
                        org.assertj.core.groups.Tuple.tuple(EnrollmentStatus.LEFT, 1L));
    }

    @Test
    void currentSubmissionRowsExcludeWithdrawnWorkAndInactiveAssignments() {
        List<CurrentSubmissionRow> rows = workRepository.findCurrentSubmissionRowsByGroupId(group.getId());

        assertThat(rows).hasSize(1);
        CurrentSubmissionRow row = rows.get(0);
        assertThat(row.assignmentId()).isEqualTo(activeAssignment.getId());
        assertThat(row.studentId()).isEqualTo(ada.getId());
        assertThat(row.workStatus()).isEqualTo(StudentWorkStatus.SUBMITTED);
        assertThat(row.submissionId()).isEqualTo(adaCurrentSubmission.getId());
        assertThat(row.deliveredLate()).isTrue();
        assertThat(row.language()).isEqualTo(Language.JAVA);

        assertThat(workRepository.findCurrentSubmissionRowsByAssignmentId(activeAssignment.getId()))
                .usingRecursiveFieldByFieldElementComparator()
                .containsExactlyElementsOf(rows);
    }

    @Test
    void attemptCountsIncludeAllSubmissionStatusesButSkipInactiveAssignments() {
        List<SubmissionAttemptCount> counts = submissionRepository.countAttemptsByGroupId(group.getId());

        assertThat(counts).extracting(
                        SubmissionAttemptCount::assignmentId,
                        SubmissionAttemptCount::studentId,
                        SubmissionAttemptCount::attempts)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple(activeAssignment.getId(), ada.getId(), 2L),
                        org.assertj.core.groups.Tuple.tuple(activeAssignment.getId(), grace.getId(), 1L));

        assertThat(submissionRepository.countAttemptsByAssignmentId(activeAssignment.getId()))
                .usingRecursiveFieldByFieldElementComparator()
                .containsExactlyInAnyOrderElementsOf(counts);
    }

    @Test
    void resultRowsSkipOutdatedExecutionsAndReturnNewestFirst() {
        List<SubmissionResultRow> rows = executionRepository
                .findResultRowsBySubmissionIds(List.of(adaCurrentSubmission.getId()));

        assertThat(rows).hasSize(2);
        assertThat(rows.get(0).status()).isEqualTo(ExecutionStatus.AC);
        assertThat(rows.get(0).timeMs()).isEqualTo(320L);
        assertThat(rows.get(0).memoryMb()).isEqualTo(30L);
        assertThat(rows.get(1).status()).isEqualTo(ExecutionStatus.WA);
    }

    @Test
    void gradeRowsExposeNormalizableValues() {
        List<StudentGradeRow> rows = gradeRepository.findGradeRowsByGroupId(group.getId());

        assertThat(rows).hasSize(1);
        StudentGradeRow row = rows.get(0);
        assertThat(row.assignmentId()).isEqualTo(activeAssignment.getId());
        assertThat(row.studentId()).isEqualTo(ada.getId());
        assertThat(row.value()).isEqualByComparingTo("95.00");
        assertThat(row.maxPoints()).isEqualByComparingTo("100.00");
        assertThat(row.status()).isEqualTo(GradeStatus.RETURNED);

        assertThat(gradeRepository.findGradeRowsByAssignmentId(activeAssignment.getId()))
                .usingRecursiveFieldByFieldElementComparator()
                .containsExactlyElementsOf(rows);
    }

    @Test
    void activeAssignmentListingSkipsLogicallyDeletedOnes() {
        List<Assignment> assignments =
                assignmentRepository.findByGroupIdAndIsActiveTrueOrderByCreatedAtDesc(group.getId());

        assertThat(assignments).extracting(Assignment::getId)
                .containsExactly(activeAssignment.getId());
    }

    private Assignment newAssignment(User author, String title, boolean active, LocalDateTime createdAt) {
        Assignment assignment = new Assignment(title, "description", 2000L, 256L, ComparatorType.EXACT_MATCH);
        assignment.setGroup(group);
        assignment.setAuthor(author);
        assignment.setValidationStatus(AssignmentValidationStatus.READY);
        assignment.setAllowedLanguages(List.of(Language.JAVA));
        assignment.setIsActive(active);
        assignment.setCreatedAt(createdAt);
        assignment.setDueDate(BASE.minusHours(12).atZone(java.time.ZoneId.systemDefault()).toInstant());
        return assignmentRepository.save(assignment);
    }

    private StudentAssignmentWork newWork(Assignment assignment, User student, StudentWorkStatus status) {
        StudentAssignmentWork work = new StudentAssignmentWork();
        work.setAssignment(assignment);
        work.setStudent(student);
        work.setStatus(status);
        return workRepository.save(work);
    }

    private Submission newSubmission(Assignment assignment, User student, StudentAssignmentWork work,
                                     SubmissionStatus status, boolean deliveredLate, LocalDateTime createdAt) {
        Submission submission = new Submission(assignment, student, Language.JAVA, deliveredLate);
        submission.setStudentWork(work);
        submission.setStatus(status);
        submission.setCreatedAt(createdAt);
        return submissionRepository.save(submission);
    }

    private Execution newExecution(Submission submission, ExecutionStatus status, boolean outdated,
                                   LocalDateTime createdAt, Long timeMs, Long memoryMb) {
        Execution execution = new Execution(submission, ExecutionType.DEFINITIVE);
        execution.setStatus(status);
        execution.setIsOutdated(outdated);
        execution.setCreatedAt(createdAt);
        execution.setTimeMs(timeMs);
        execution.setMemoryMb(memoryMb);
        return executionRepository.save(execution);
    }
}
