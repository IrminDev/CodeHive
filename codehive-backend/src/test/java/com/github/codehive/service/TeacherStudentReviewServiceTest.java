package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.model.enums.Language;
import com.github.codehive.repository.AssignmentGradeHistoryRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.StudentAssignmentWorkRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.UserRepository;

class TeacherStudentReviewServiceTest {
    private static final UUID SUBMISSION_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID ASSIGNMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID OWNER_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final UUID STUDENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000004");

    private SubmissionRepository submissionRepository;
    private ExecutionRepository executionRepository;
    private UserRepository userRepository;
    private ObjectStorageService objectStorageService;
    private TeacherStudentReviewService service;
    private Submission submission;

    @BeforeEach
    void setUp() {
        submissionRepository = mock(SubmissionRepository.class);
        executionRepository = mock(ExecutionRepository.class);
        userRepository = mock(UserRepository.class);
        objectStorageService = mock(ObjectStorageService.class);
        service = new TeacherStudentReviewService(mock(StudentWorkQueryService.class),
                mock(StudentAssignmentWorkRepository.class), submissionRepository, executionRepository,
                mock(AssignmentGradeHistoryRepository.class), userRepository, objectStorageService);

        User owner = user(OWNER_ID, "owner@example.com");
        owner.setRole(com.github.codehive.model.enums.Role.TEACHER);
        owner.setIsActive(true);
        owner.setBlocked(false);
        owner.addScope(com.github.codehive.model.enums.Scope.CREATE_GROUP);
        User student = user(STUDENT_ID, "student@example.com");
        ClassGroup group = new ClassGroup();
        group.setOwner(owner);
        Assignment assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        assignment.setGroup(group);
        submission = new Submission(assignment, student, Language.CPP, false);
        submission.setId(SUBMISSION_ID);
        submission.setSourceCodeKey("assignments/source.cpp");
        when(submissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.of(submission));
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
    }

    @Test
    void returnsSourceButMarksReportUnavailableWhenRetentionTimestampIsMissing() throws Exception {
        Execution execution = new Execution(submission, ExecutionType.DEFINITIVE);
        execution.setArtifactsExpireAt(null);
        when(executionRepository.findTopBySubmissionIdOrderByCreatedAtDesc(SUBMISSION_ID))
                .thenReturn(Optional.of(execution));
        when(objectStorageService.download("assignments/source.cpp"))
                .thenReturn(new ByteArrayInputStream("int main() {}".getBytes()));

        var result = service.getSubmission(SUBMISSION_ID, "owner@example.com");

        assertThat(result.sourceCode()).isEqualTo("int main() {}");
        assertThat(result.reportAvailable()).isFalse();
        assertThat(result.execution()).isNotNull();
    }

    @Test
    void rejectsNonOwnerWithoutReadingSourceArtifact() throws Exception {
        User other = user(UUID.fromString("00000000-0000-0000-0000-000000000005"), "other@example.com");
        when(userRepository.findByEmail(other.getEmail())).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> service.getSubmission(SUBMISSION_ID, other.getEmail()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("owner");

        verify(objectStorageService, never()).download("assignments/source.cpp");
    }

    private User user(UUID id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        return user;
    }
}
