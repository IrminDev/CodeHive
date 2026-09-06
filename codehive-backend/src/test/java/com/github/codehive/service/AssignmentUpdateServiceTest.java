package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.codehive.messaging.producer.TestGenerationRequestProducer;
import com.github.codehive.model.dto.queue.TestGenerationResult;
import com.github.codehive.model.dto.queue.TestGenerationJob;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentUpdate;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.ReferenceSolutionRevision;
import com.github.codehive.model.entity.TestCase;
import com.github.codehive.model.entity.TestSuiteRevision;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.AssignmentUpdateKind;
import com.github.codehive.model.enums.AssignmentUpdateStatus;
import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.RevisionStatus;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.TestGenerationMode;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.model.request.assignment.UpdateAssignmentRequest;
import com.github.codehive.notification.NotificationDomainEventPublisher;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.AssignmentUpdateRepository;
import com.github.codehive.repository.ReferenceSolutionRevisionRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.TestCaseRepository;
import com.github.codehive.repository.TestSuiteRevisionRepository;
import com.github.codehive.repository.UserRepository;

class AssignmentUpdateServiceTest {
    private static final UUID ASSIGNMENT_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID UPDATE_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID ACTIVE_REFERENCE_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final UUID CANDIDATE_REFERENCE_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000004");

    @Test
    void failedReferenceValidationLeavesActiveAssignmentUntouched() {
        AssignmentUpdateRepository updateRepository = mock(AssignmentUpdateRepository.class);
        Assignment assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        assignment.setVersion(0L);
        ClassGroup group = new ClassGroup();
        group.setId(UUID.fromString("00000000-0000-0000-0000-000000000005"));
        assignment.setGroup(group);
        User teacher = new User();
        teacher.setId(UUID.fromString("00000000-0000-0000-0000-000000000006"));
        ReferenceSolutionRevision active = new ReferenceSolutionRevision();
        active.setId(ACTIVE_REFERENCE_ID);
        active.setStatus(RevisionStatus.ACTIVE);
        ReferenceSolutionRevision candidate = new ReferenceSolutionRevision();
        candidate.setId(CANDIDATE_REFERENCE_ID);
        candidate.setStatus(RevisionStatus.PROCESSING);
        assignment.setActiveReferenceSolutionRevision(active);

        AssignmentUpdate update = new AssignmentUpdate();
        update.setAssignment(assignment);
        update.setCreatedBy(teacher);
        update.setKind(AssignmentUpdateKind.REFERENCE_ONLY);
        update.setReferenceSolutionRevision(candidate);
        update.setBaseAssignmentVersion(0L);
        update.setProposedMetadataJson("{}");
        when(updateRepository.findByIdAndStatus(
                UPDATE_ID, AssignmentUpdateStatus.VALIDATING)).thenReturn(Optional.of(update));

        AssignmentUpdateService service = new AssignmentUpdateService(
                mock(AssignmentRepository.class), updateRepository,
                mock(ReferenceSolutionRevisionRepository.class),
                mock(TestSuiteRevisionRepository.class), mock(TestCaseRepository.class),
                mock(SubmissionRepository.class),
                mock(UserRepository.class), mock(GroupService.class),
                mock(ObjectStorageService.class), mock(TestGenerationRequestProducer.class),
                new ObjectMapper(), mock(AssignmentGradeService.class),
                mock(NotificationDomainEventPublisher.class),
                mock(ApplicationEventPublisher.class));
        TestGenerationResult result = new TestGenerationResult(
                ASSIGNMENT_ID, false, 0, "Reference failed");
        result.setAssignmentUpdateId(UPDATE_ID);
        result.setReferenceSolutionRevisionId(CANDIDATE_REFERENCE_ID);

        service.processValidationResult(result);

        assertThat(update.getStatus()).isEqualTo(AssignmentUpdateStatus.REJECTED);
        assertThat(candidate.getStatus()).isEqualTo(RevisionStatus.FAILED);
        assertThat(assignment.getActiveReferenceSolutionRevision()).isSameAs(active);
        assertThat(active.getStatus()).isEqualTo(RevisionStatus.ACTIVE);
    }

    @Test
    void successfulAsyncValidationRejectsDateThatExpiredBeforeApply() throws Exception {
        AssignmentUpdateRepository updateRepository = mock(AssignmentUpdateRepository.class);
        Assignment assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        assignment.setVersion(0L);
        ClassGroup group = new ClassGroup();
        group.setId(UUID.fromString("00000000-0000-0000-0000-000000000005"));
        assignment.setGroup(group);
        User teacher = new User();
        teacher.setId(UUID.fromString("00000000-0000-0000-0000-000000000006"));
        ReferenceSolutionRevision active = new ReferenceSolutionRevision();
        active.setId(ACTIVE_REFERENCE_ID);
        active.setStatus(RevisionStatus.ACTIVE);
        ReferenceSolutionRevision candidate = new ReferenceSolutionRevision();
        candidate.setId(CANDIDATE_REFERENCE_ID);
        candidate.setStatus(RevisionStatus.PROCESSING);
        assignment.setActiveReferenceSolutionRevision(active);

        UpdateAssignmentRequest request = new UpdateAssignmentRequest();
        request.setDueDate(Instant.now().minusSeconds(1));
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        AssignmentUpdate update = new AssignmentUpdate();
        update.setAssignment(assignment);
        update.setCreatedBy(teacher);
        update.setKind(AssignmentUpdateKind.REFERENCE_ONLY);
        update.setReferenceSolutionRevision(candidate);
        update.setBaseAssignmentVersion(0L);
        update.setProposedMetadataJson(objectMapper.writeValueAsString(request));
        when(updateRepository.findByIdAndStatus(
                UPDATE_ID, AssignmentUpdateStatus.VALIDATING)).thenReturn(Optional.of(update));

        AssignmentUpdateService service = new AssignmentUpdateService(
                mock(AssignmentRepository.class), updateRepository,
                mock(ReferenceSolutionRevisionRepository.class),
                mock(TestSuiteRevisionRepository.class), mock(TestCaseRepository.class),
                mock(SubmissionRepository.class),
                mock(UserRepository.class), mock(GroupService.class),
                mock(ObjectStorageService.class), mock(TestGenerationRequestProducer.class),
                objectMapper, mock(AssignmentGradeService.class),
                mock(NotificationDomainEventPublisher.class),
                mock(ApplicationEventPublisher.class));
        TestGenerationResult result = new TestGenerationResult(
                ASSIGNMENT_ID, true, 1, null);
        result.setAssignmentUpdateId(UPDATE_ID);
        result.setReferenceSolutionRevisionId(CANDIDATE_REFERENCE_ID);

        service.processValidationResult(result);

        assertThat(update.getStatus()).isEqualTo(AssignmentUpdateStatus.REJECTED);
        assertThat(update.getFailureMessage()).isEqualTo(
                "Due date cannot be before the current time");
        assertThat(assignment.getDueDate()).isNull();
        assertThat(assignment.getActiveReferenceSolutionRevision()).isSameAs(active);
    }

    @Test
    void extendingDueDateMarksQualifyingLateSubmissionsOnTime() {
        UpdateFixture fixture = updateFixture();
        Instant newDueDate = Instant.now().plusSeconds(3600);
        UpdateAssignmentRequest request = new UpdateAssignmentRequest();
        request.setDueDate(newDueDate);

        fixture.service().update(
                ASSIGNMENT_ID, request, null, null, "teacher@test.com");

        assertThat(fixture.assignment().getDueDate()).isEqualTo(newDueDate);
        verify(fixture.submissionRepository()).markLateSubmissionsOnTimeThrough(
                ASSIGNMENT_ID,
                LocalDateTime.ofInstant(newDueDate, ZoneId.systemDefault()));
    }

    @Test
    void clearingDueDateMarksEveryLateSubmissionOnTime() {
        UpdateFixture fixture = updateFixture();
        fixture.assignment().setDueDate(Instant.now().plusSeconds(1800));
        UpdateAssignmentRequest request = new UpdateAssignmentRequest();
        request.setClearDueDate(true);

        fixture.service().update(
                ASSIGNMENT_ID, request, null, null, "teacher@test.com");

        assertThat(fixture.assignment().getDueDate()).isNull();
        verify(fixture.submissionRepository()).markAllLateSubmissionsOnTime(ASSIGNMENT_ID);
    }

    @Test
    void rejectsExplicitPastDates() {
        UpdateFixture fixture = updateFixture();
        UpdateAssignmentRequest request = new UpdateAssignmentRequest();
        request.setDueDate(Instant.now().minusSeconds(60));

        assertThatThrownBy(() -> fixture.service().update(
                ASSIGNMENT_ID, request, null, null, "teacher@test.com"))
                .isInstanceOf(ValidationException.class)
                .hasMessage("Due date cannot be before the current time");
    }

    @Test
    void rejectsTestSuiteUpdateWithMoreThanFiftyTestCases() {
        UpdateFixture fixture = updateFixture();
        List<MultipartFile> testCases = java.util.Collections.nCopies(51, mock(MultipartFile.class));

        assertThatThrownBy(() -> fixture.service().update(
                ASSIGNMENT_ID, new UpdateAssignmentRequest(), null, testCases, "teacher@test.com"))
                .isInstanceOf(ValidationException.class)
                .hasMessage("At most 50 test cases are allowed");
    }

    @Test
    void rejectsUpdatedLimitsAboveBackendMaximum() {
        UpdateFixture fixture = updateFixture();
        UpdateAssignmentRequest request = new UpdateAssignmentRequest();
        request.setTimeLimitMs(10_001L);
        request.setMemoryLimitMb(1_001L);

        assertThatThrownBy(() -> fixture.service().update(
                ASSIGNMENT_ID, request, null, null, "teacher@test.com"))
                .isInstanceOf(ValidationException.class)
                .hasMessage("Time limit must be between 100 and 10000ms");
    }

    @Test
    void retryingFailedAssignmentWithOnlyReferenceSourceRegeneratesStoredInputs() throws Exception {
        AssignmentRepository assignmentRepository = mock(AssignmentRepository.class);
        AssignmentUpdateRepository updateRepository = mock(AssignmentUpdateRepository.class);
        ReferenceSolutionRevisionRepository referenceRepository = mock(ReferenceSolutionRevisionRepository.class);
        TestSuiteRevisionRepository suiteRepository = mock(TestSuiteRevisionRepository.class);
        TestCaseRepository testCaseRepository = mock(TestCaseRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        GroupService groupService = mock(GroupService.class);
        ObjectStorageService storageService = mock(ObjectStorageService.class);
        TestGenerationRequestProducer producer = mock(TestGenerationRequestProducer.class);

        User teacher = new User();
        teacher.setId(UUID.fromString("00000000-0000-0000-0000-000000000006"));
        teacher.setRole(Role.TEACHER);
        ClassGroup group = new ClassGroup();
        group.setId(UUID.fromString("00000000-0000-0000-0000-000000000005"));
        group.setOwner(teacher);
        Assignment assignment = new Assignment(
                "Assignment", "Description", 1000L, 128L, ComparatorType.EXACT_MATCH);
        assignment.setId(ASSIGNMENT_ID);
        assignment.setVersion(0L);
        assignment.setGroup(group);
        assignment.setAuthor(teacher);
        assignment.setValidationStatus(AssignmentValidationStatus.FAILED);

        ReferenceSolutionRevision failedReference = new ReferenceSolutionRevision();
        failedReference.setId(ACTIVE_REFERENCE_ID);
        failedReference.setAssignment(assignment);
        failedReference.setLanguage(Language.PYTHON);
        failedReference.setObjectKey("failed-reference.py");
        failedReference.setStatus(RevisionStatus.FAILED);
        TestSuiteRevision failedSuite = new TestSuiteRevision();
        failedSuite.setId(UUID.fromString("00000000-0000-0000-0000-000000000007"));
        failedSuite.setAssignment(assignment);
        failedSuite.setReferenceSolutionRevision(failedReference);
        failedSuite.setRevisionNumber(1);
        failedSuite.setStatus(RevisionStatus.FAILED);
        TestCase storedInput = new TestCase(assignment, failedSuite, 1, false);
        storedInput.setId(UUID.fromString("00000000-0000-0000-0000-000000000008"));

        when(userRepository.findByEmail("teacher@test.com")).thenReturn(Optional.of(teacher));
        when(assignmentRepository.findById(ASSIGNMENT_ID)).thenReturn(Optional.of(assignment));
        when(groupService.requireOwnedWritableGroup(group.getId(), teacher)).thenReturn(group);
        when(updateRepository.save(any(AssignmentUpdate.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(referenceRepository.save(any(ReferenceSolutionRevision.class))).thenAnswer(invocation -> {
            ReferenceSolutionRevision revision = invocation.getArgument(0);
            revision.setId(CANDIDATE_REFERENCE_ID);
            return revision;
        });
        when(suiteRepository.findTopByAssignmentIdOrderByRevisionNumberDesc(ASSIGNMENT_ID))
                .thenReturn(Optional.of(failedSuite));
        when(suiteRepository.save(any(TestSuiteRevision.class))).thenAnswer(invocation -> {
            TestSuiteRevision revision = invocation.getArgument(0);
            revision.setId(UUID.fromString("00000000-0000-0000-0000-000000000009"));
            return revision;
        });
        when(testCaseRepository.findByTestSuiteRevisionIdOrderByOrderAsc(failedSuite.getId()))
                .thenReturn(List.of(storedInput));
        when(testCaseRepository.save(any(TestCase.class))).thenAnswer(invocation -> {
            TestCase testCase = invocation.getArgument(0);
            testCase.setId(UUID.fromString("00000000-0000-0000-0000-000000000010"));
            return testCase;
        });
        when(storageService.download(any())).thenReturn(new ByteArrayInputStream("1\n".getBytes()));

        AssignmentUpdateService service = new AssignmentUpdateService(
                assignmentRepository, updateRepository, referenceRepository, suiteRepository,
                testCaseRepository, mock(SubmissionRepository.class), userRepository, groupService,
                storageService, producer, new ObjectMapper().findAndRegisterModules(),
                mock(AssignmentGradeService.class), mock(NotificationDomainEventPublisher.class),
                mock(ApplicationEventPublisher.class));
        UpdateAssignmentRequest request = new UpdateAssignmentRequest();
        request.setReferenceLanguage(Language.PYTHON);
        MultipartFile source = mock(MultipartFile.class);
        when(source.getBytes()).thenReturn("print('fixed')\n".getBytes());

        var update = service.update(ASSIGNMENT_ID, request, source, List.of(), "teacher@test.com");

        ArgumentCaptor<TestGenerationJob> job = ArgumentCaptor.forClass(TestGenerationJob.class);
        verify(producer).sendTestGenerationRequest(job.capture());
        assertThat(update.kind()).isEqualTo(AssignmentUpdateKind.TEST_SUITE);
        assertThat(update.status()).isEqualTo(AssignmentUpdateStatus.VALIDATING);
        assertThat(job.getValue().getMode()).isEqualTo(TestGenerationMode.TEST_SUITE_GENERATION);
        assertThat(job.getValue().getTestSuiteRevisionId()).isEqualTo(
                UUID.fromString("00000000-0000-0000-0000-000000000009"));
        assertThat(job.getValue().getTestCases()).hasSize(1);
    }

    @Test
    void successfulRetryRestoresReadyStatusForFailedAssignment() throws Exception {
        AssignmentUpdateRepository updateRepository = mock(AssignmentUpdateRepository.class);
        Assignment assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        assignment.setVersion(0L);
        assignment.setValidationStatus(AssignmentValidationStatus.FAILED);
        ClassGroup group = new ClassGroup();
        group.setId(UUID.fromString("00000000-0000-0000-0000-000000000005"));
        assignment.setGroup(group);
        User teacher = new User();
        teacher.setId(UUID.fromString("00000000-0000-0000-0000-000000000006"));

        ReferenceSolutionRevision reference = new ReferenceSolutionRevision();
        reference.setId(CANDIDATE_REFERENCE_ID);
        TestSuiteRevision suite = new TestSuiteRevision();
        suite.setId(UUID.fromString("00000000-0000-0000-0000-000000000009"));
        suite.setReferenceSolutionRevision(reference);
        AssignmentUpdate update = new AssignmentUpdate();
        update.setAssignment(assignment);
        update.setCreatedBy(teacher);
        update.setKind(AssignmentUpdateKind.TEST_SUITE);
        update.setReferenceSolutionRevision(reference);
        update.setTestSuiteRevision(suite);
        update.setBaseAssignmentVersion(0L);
        update.setProposedMetadataJson("{}");
        when(updateRepository.findByIdAndStatus(UPDATE_ID, AssignmentUpdateStatus.VALIDATING))
                .thenReturn(Optional.of(update));

        AssignmentUpdateService service = new AssignmentUpdateService(
                mock(AssignmentRepository.class), updateRepository,
                mock(ReferenceSolutionRevisionRepository.class),
                mock(TestSuiteRevisionRepository.class), mock(TestCaseRepository.class),
                mock(SubmissionRepository.class), mock(UserRepository.class), mock(GroupService.class),
                mock(ObjectStorageService.class), mock(TestGenerationRequestProducer.class),
                new ObjectMapper().findAndRegisterModules(), mock(AssignmentGradeService.class),
                mock(NotificationDomainEventPublisher.class), mock(ApplicationEventPublisher.class));
        TestGenerationResult result = new TestGenerationResult(ASSIGNMENT_ID, true, 1, null);
        result.setAssignmentUpdateId(UPDATE_ID);
        result.setReferenceSolutionRevisionId(CANDIDATE_REFERENCE_ID);
        result.setTestSuiteRevisionId(suite.getId());

        service.processValidationResult(result);

        assertThat(update.getStatus()).isEqualTo(AssignmentUpdateStatus.APPLIED);
        assertThat(assignment.getValidationStatus()).isEqualTo(AssignmentValidationStatus.READY);
        assertThat(assignment.getActiveTestSuiteRevision()).isSameAs(suite);
        assertThat(assignment.getActiveReferenceSolutionRevision()).isSameAs(reference);
    }

    private UpdateFixture updateFixture() {
        AssignmentRepository assignmentRepository = mock(AssignmentRepository.class);
        AssignmentUpdateRepository updateRepository = mock(AssignmentUpdateRepository.class);
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        GroupService groupService = mock(GroupService.class);

        User teacher = new User();
        teacher.setId(UUID.fromString("00000000-0000-0000-0000-000000000006"));
        teacher.setRole(Role.TEACHER);
        ClassGroup group = new ClassGroup();
        group.setId(UUID.fromString("00000000-0000-0000-0000-000000000005"));
        group.setOwner(teacher);
        Assignment assignment = new Assignment(
                "Assignment", "Description", 1000L, 128L, ComparatorType.EXACT_MATCH);
        assignment.setId(ASSIGNMENT_ID);
        assignment.setVersion(0L);
        assignment.setGroup(group);
        assignment.setAuthor(teacher);

        when(userRepository.findByEmail("teacher@test.com")).thenReturn(Optional.of(teacher));
        when(assignmentRepository.findById(ASSIGNMENT_ID)).thenReturn(Optional.of(assignment));
        when(groupService.requireOwnedWritableGroup(group.getId(), teacher)).thenReturn(group);
        when(updateRepository.save(any(AssignmentUpdate.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AssignmentUpdateService service = new AssignmentUpdateService(
                assignmentRepository, updateRepository,
                mock(ReferenceSolutionRevisionRepository.class),
                mock(TestSuiteRevisionRepository.class), mock(TestCaseRepository.class),
                submissionRepository, userRepository, groupService,
                mock(ObjectStorageService.class), mock(TestGenerationRequestProducer.class),
                new ObjectMapper().findAndRegisterModules(), mock(AssignmentGradeService.class),
                mock(NotificationDomainEventPublisher.class),
                mock(ApplicationEventPublisher.class));
        return new UpdateFixture(service, assignment, submissionRepository);
    }

    private record UpdateFixture(
            AssignmentUpdateService service,
            Assignment assignment,
            SubmissionRepository submissionRepository) {}
}
