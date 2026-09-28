package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.github.codehive.model.dto.metrics.SubmissionResultRow;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentFeedback;
import com.github.codehive.model.entity.AssignmentGrade;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.FeedbackStatus;
import com.github.codehive.model.enums.GradeStatus;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.StudentWorkStatus;
import com.github.codehive.repository.AssignmentFeedbackRepository;
import com.github.codehive.repository.AssignmentGradeRepository;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.StudentAssignmentWorkRepository;
import com.github.codehive.repository.UserRepository;

class StudentAssignmentOverviewServiceTest {
    private static final UUID STUDENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID GROUP_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID ASSIGNMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final UUID WORK_ID = UUID.fromString("00000000-0000-0000-0000-000000000004");
    private static final UUID SUBMISSION_ID = UUID.fromString("00000000-0000-0000-0000-000000000005");
    private static final UUID GRADE_ID = UUID.fromString("00000000-0000-0000-0000-000000000006");

    @Test
    void includesArchivedActiveGroupsAndReturnedStudentState() {
        Fixture fixture = new Fixture();
        User student = fixture.student();
        ClassGroup group = fixture.group(true);
        Assignment assignment = fixture.assignment(group);
        GroupEnrollment enrollment = fixture.enrollment(student, group);
        Submission submission = fixture.submission(student, assignment);
        StudentAssignmentWork work = fixture.work(student, assignment, submission);
        AssignmentGrade grade = fixture.grade(work, GradeStatus.RETURNED);
        AssignmentFeedback feedback = fixture.feedback(work, FeedbackStatus.PUBLISHED);

        when(fixture.userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        when(fixture.enrollmentRepository.findByStudentIdAndStatus(STUDENT_ID, EnrollmentStatus.ACTIVE))
                .thenReturn(List.of(enrollment));
        when(fixture.assignmentRepository.findStudentVisibleForGroups(
                org.mockito.ArgumentMatchers.eq(List.of(GROUP_ID)),
                org.mockito.ArgumentMatchers.eq(AssignmentValidationStatus.READY),
                org.mockito.ArgumentMatchers.any(Instant.class)))
                .thenReturn(List.of(assignment));
        when(fixture.workRepository.findByStudentIdAndAssignmentIdIn(STUDENT_ID, List.of(ASSIGNMENT_ID)))
                .thenReturn(List.of(work));
        when(fixture.gradeRepository.findByStudentWorkIdIn(List.of(WORK_ID))).thenReturn(List.of(grade));
        when(fixture.feedbackRepository.findByStudentWorkIdIn(List.of(WORK_ID)))
                .thenReturn(List.of(feedback));
        when(fixture.executionRepository.findResultRowsBySubmissionIds(List.of(SUBMISSION_ID)))
                .thenReturn(List.of(new SubmissionResultRow(
                        SUBMISSION_ID, ExecutionStatus.AC, 12L, 20L,
                        LocalDateTime.of(2026, 8, 18, 22, 0))));

        var result = fixture.service.listMine(student.getEmail());

        assertThat(result).singleElement().satisfies(item -> {
            assertThat(item.assignment().getId()).isEqualTo(ASSIGNMENT_ID);
            assertThat(item.groupArchived()).isTrue();
            assertThat(item.workStatus()).isEqualTo(StudentWorkStatus.SUBMITTED);
            assertThat(item.currentSubmission().executionStatus()).isEqualTo(ExecutionStatus.AC);
            assertThat(item.grade().value()).isEqualByComparingTo("92.50");
            assertThat(item.feedbackCount()).isEqualTo(1);
        });
    }

    @Test
    void hidesDraftGradeAndUsesNotSubmittedWhenNoWorkExists() {
        Fixture fixture = new Fixture();
        User student = fixture.student();
        ClassGroup group = fixture.group(false);
        Assignment assignment = fixture.assignment(group);
        GroupEnrollment enrollment = fixture.enrollment(student, group);

        when(fixture.userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        when(fixture.enrollmentRepository.findByStudentIdAndStatus(STUDENT_ID, EnrollmentStatus.ACTIVE))
                .thenReturn(List.of(enrollment));
        when(fixture.assignmentRepository.findStudentVisibleForGroups(
                org.mockito.ArgumentMatchers.eq(List.of(GROUP_ID)),
                org.mockito.ArgumentMatchers.eq(AssignmentValidationStatus.READY),
                org.mockito.ArgumentMatchers.any(Instant.class)))
                .thenReturn(List.of(assignment));
        when(fixture.workRepository.findByStudentIdAndAssignmentIdIn(STUDENT_ID, List.of(ASSIGNMENT_ID)))
                .thenReturn(List.of());

        var result = fixture.service.listMine(student.getEmail());

        assertThat(result).singleElement().satisfies(item -> {
            assertThat(item.workStatus()).isEqualTo(StudentWorkStatus.NOT_SUBMITTED);
            assertThat(item.currentSubmission()).isNull();
            assertThat(item.grade()).isNull();
            assertThat(item.feedbackCount()).isZero();
        });
    }

    private static final class Fixture {
        private final AssignmentRepository assignmentRepository = mock(AssignmentRepository.class);
        private final GroupEnrollmentRepository enrollmentRepository = mock(GroupEnrollmentRepository.class);
        private final StudentAssignmentWorkRepository workRepository = mock(StudentAssignmentWorkRepository.class);
        private final AssignmentGradeRepository gradeRepository = mock(AssignmentGradeRepository.class);
        private final AssignmentFeedbackRepository feedbackRepository = mock(AssignmentFeedbackRepository.class);
        private final ExecutionRepository executionRepository = mock(ExecutionRepository.class);
        private final UserRepository userRepository = mock(UserRepository.class);
        private final StudentAssignmentOverviewService service = new StudentAssignmentOverviewService(
                assignmentRepository, enrollmentRepository, workRepository, gradeRepository,
                feedbackRepository, executionRepository, userRepository);

        private User student() {
            User student = new User();
            student.setId(STUDENT_ID);
            student.setEmail("student@example.com");
            return student;
        }

        private ClassGroup group(boolean archived) {
            ClassGroup group = new ClassGroup();
            group.setId(GROUP_ID);
            group.setName("Algorithms");
            group.setArchived(archived);
            group.setIsActive(true);
            return group;
        }

        private Assignment assignment(ClassGroup group) {
            Assignment assignment = new Assignment("Sliding Window", "Find maximum range.", 1000L, 256L,
                    ComparatorType.EXACT_MATCH);
            assignment.setId(ASSIGNMENT_ID);
            assignment.setGroup(group);
            assignment.setAllowedLanguages(List.of(Language.CPP));
            assignment.setValidationStatus(AssignmentValidationStatus.READY);
            return assignment;
        }

        private GroupEnrollment enrollment(User student, ClassGroup group) {
            GroupEnrollment enrollment = new GroupEnrollment();
            enrollment.setStudent(student);
            enrollment.setGroup(group);
            enrollment.setStatus(EnrollmentStatus.ACTIVE);
            return enrollment;
        }

        private Submission submission(User student, Assignment assignment) {
            Submission submission = new Submission();
            submission.setId(SUBMISSION_ID);
            submission.setStudent(student);
            submission.setAssignment(assignment);
            submission.setLanguage(Language.CPP);
            return submission;
        }

        private StudentAssignmentWork work(User student, Assignment assignment, Submission submission) {
            StudentAssignmentWork work = new StudentAssignmentWork();
            ReflectionTestUtils.setField(work, "id", WORK_ID);
            work.setStudent(student);
            work.setAssignment(assignment);
            work.setCurrentSubmission(submission);
            work.setStatus(StudentWorkStatus.SUBMITTED);
            return work;
        }

        private AssignmentGrade grade(StudentAssignmentWork work, GradeStatus status) {
            AssignmentGrade grade = new AssignmentGrade();
            ReflectionTestUtils.setField(grade, "id", GRADE_ID);
            grade.setStudentWork(work);
            grade.setValue(new BigDecimal("92.50"));
            grade.setMaxPointsSnapshot(new BigDecimal("100.00"));
            grade.setStatus(status);
            return grade;
        }

        private AssignmentFeedback feedback(StudentAssignmentWork work, FeedbackStatus status) {
            AssignmentFeedback feedback = new AssignmentFeedback();
            feedback.setStudentWork(work);
            feedback.setStatus(status);
            feedback.setBody("Good complexity analysis.");
            return feedback;
        }
    }
}
