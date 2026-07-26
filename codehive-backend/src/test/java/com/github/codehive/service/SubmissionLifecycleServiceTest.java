package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.StudentWorkStatus;
import com.github.codehive.model.enums.SubmissionStatus;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.UserRepository;

class SubmissionLifecycleServiceTest {
    private static final UUID STUDENT_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID SUBMISSION_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000002");

    @Test
    void withdrawsTheCurrentSubmissionBeforeCloseDate() {
        Fixture fixture = fixture(Instant.now().plus(1, ChronoUnit.DAYS));

        fixture.service.withdraw(SUBMISSION_ID, "student@example.com");

        assertThat(fixture.submission.getStatus()).isEqualTo(SubmissionStatus.WITHDRAWN);
        assertThat(fixture.submission.getWithdrawnAt()).isNotNull();
        assertThat(fixture.work.getCurrentSubmission()).isNull();
        assertThat(fixture.work.getStatus()).isEqualTo(StudentWorkStatus.WITHDRAWN);
    }

    @Test
    void rejectsWithdrawalAtOrAfterCloseDate() {
        Fixture fixture = fixture(Instant.now().minus(1, ChronoUnit.MINUTES));

        assertThatThrownBy(() -> fixture.service.withdraw(
                SUBMISSION_ID, "student@example.com"))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("closed");
    }

    private Fixture fixture(Instant closeDate) {
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        User student = new User();
        student.setId(STUDENT_ID);
        Assignment assignment = new Assignment();
        assignment.setCloseDate(closeDate);
        StudentAssignmentWork work = new StudentAssignmentWork();
        Submission submission = new Submission();
        submission.setId(SUBMISSION_ID);
        submission.setStudent(student);
        submission.setAssignment(assignment);
        submission.setStudentWork(work);
        submission.setStatus(SubmissionStatus.SUBMITTED);
        work.setCurrentSubmission(submission);
        work.setStatus(StudentWorkStatus.SUBMITTED);
        when(userRepository.findByEmail("student@example.com")).thenReturn(Optional.of(student));
        when(submissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.of(submission));
        return new Fixture(new SubmissionLifecycleService(submissionRepository, userRepository),
                submission, work);
    }

    private record Fixture(SubmissionLifecycleService service, Submission submission,
                           StudentAssignmentWork work) {
    }
}
