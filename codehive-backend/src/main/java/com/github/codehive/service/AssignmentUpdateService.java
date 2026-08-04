package com.github.codehive.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.codehive.messaging.producer.TestGenerationRequestProducer;
import com.github.codehive.model.dto.AssignmentUpdateDTO;
import com.github.codehive.model.dto.queue.TestCaseInfo;
import com.github.codehive.model.dto.queue.TestGenerationJob;
import com.github.codehive.model.dto.queue.TestGenerationResult;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentExample;
import com.github.codehive.model.entity.AssignmentUpdate;
import com.github.codehive.model.entity.ReferenceSolutionRevision;
import com.github.codehive.model.entity.TestCase;
import com.github.codehive.model.entity.TestSuiteRevision;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AssignmentUpdateKind;
import com.github.codehive.model.enums.AssignmentUpdateStatus;
import com.github.codehive.model.enums.RevisionStatus;
import com.github.codehive.model.enums.TestGenerationMode;
import com.github.codehive.model.enums.TestSuiteUpdateMode;
import com.github.codehive.model.enums.GradeChangeReason;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.model.request.assignment.AssignmentExampleRequest;
import com.github.codehive.model.request.assignment.UpdateAssignmentRequest;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.AssignmentUpdateRepository;
import com.github.codehive.repository.ReferenceSolutionRevisionRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.TestCaseRepository;
import com.github.codehive.repository.TestSuiteRevisionRepository;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.utils.FileExtensionUtil;
import com.github.codehive.utils.ObjectKeyBuilder;
import com.github.codehive.notification.NotificationDomainEventPublisher;
import com.github.codehive.notification.event.NotificationDomainEvent;
import com.github.codehive.service.event.ReevaluationRequestedEvent;

@Service
public class AssignmentUpdateService {
    private final AssignmentRepository assignmentRepository;
    private final AssignmentUpdateRepository updateRepository;
    private final ReferenceSolutionRevisionRepository referenceRevisionRepository;
    private final TestSuiteRevisionRepository testSuiteRevisionRepository;
    private final TestCaseRepository testCaseRepository;
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final GroupService groupService;
    private final ObjectStorageService objectStorageService;
    private final TestGenerationRequestProducer generationProducer;
    private final ObjectMapper objectMapper;
    private final AssignmentGradeService gradeService;
    private final NotificationDomainEventPublisher notificationPublisher;
    private final ApplicationEventPublisher eventPublisher;

    public AssignmentUpdateService(AssignmentRepository assignmentRepository,
                                   AssignmentUpdateRepository updateRepository,
                                   ReferenceSolutionRevisionRepository referenceRevisionRepository,
                                   TestSuiteRevisionRepository testSuiteRevisionRepository,
                                   TestCaseRepository testCaseRepository,
                                   SubmissionRepository submissionRepository,
                                   UserRepository userRepository,
                                   GroupService groupService,
                                   ObjectStorageService objectStorageService,
                                   TestGenerationRequestProducer generationProducer,
                                   ObjectMapper objectMapper,
                                   AssignmentGradeService gradeService,
                                   NotificationDomainEventPublisher notificationPublisher,
                                   ApplicationEventPublisher eventPublisher) {
        this.assignmentRepository = assignmentRepository;
        this.updateRepository = updateRepository;
        this.referenceRevisionRepository = referenceRevisionRepository;
        this.testSuiteRevisionRepository = testSuiteRevisionRepository;
        this.testCaseRepository = testCaseRepository;
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
        this.groupService = groupService;
        this.objectStorageService = objectStorageService;
        this.generationProducer = generationProducer;
        this.objectMapper = objectMapper;
        this.gradeService = gradeService;
        this.notificationPublisher = notificationPublisher;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public AssignmentUpdateDTO update(UUID assignmentId, UpdateAssignmentRequest request,
                                      MultipartFile referenceSolution,
                                      List<MultipartFile> replacementTestCases,
                                      String email) {
        User teacher = requireUser(email);
        Assignment assignment = requireAssignment(assignmentId);
        groupService.requireOwnedWritableGroup(assignment.getGroup().getId(), teacher);
        if (updateRepository.existsByAssignmentIdAndStatus(
                assignmentId, AssignmentUpdateStatus.VALIDATING)) {
            throw new ValidationException("Another assignment update is still being validated");
        }

        boolean hasReference = referenceSolution != null && !referenceSolution.isEmpty();
        boolean hasTests = replacementTestCases != null && !replacementTestCases.isEmpty();
        validateProposedDates(assignment, request);

        AssignmentUpdate update = baseUpdate(assignment, teacher, request);
        if (!hasReference && !hasTests) {
            update.setKind(AssignmentUpdateKind.METADATA);
            boolean datesChanged = datesChanged(assignment, request);
            boolean wasStudentPublished = studentPublished(assignment);
            boolean maxPointsChanged = request.getMaxPoints() != null
                    && request.getMaxPoints().compareTo(assignment.getMaxPoints()) != 0;
            applyMetadata(assignment, request);
            reconcileLateSubmissions(assignment, request);
            if (maxPointsChanged) {
                int cleared = gradeService.clearAssignmentGrades(
                        assignment, GradeChangeReason.CLEARED_MAX_POINTS_CHANGED, teacher);
                if (cleared > 0) publishAssignmentEvent(
                        NotificationType.ASSIGNMENT_GRADES_CLEARED, assignment, teacher, null);
            }
            update.setStatus(AssignmentUpdateStatus.APPLIED);
            update.setCompletedAt(Instant.now());
            if (wasStudentPublished) {
                publishAssignmentEvent(datesChanged
                        ? NotificationType.ASSIGNMENT_RESCHEDULED
                        : NotificationType.ASSIGNMENT_UPDATED, assignment, teacher, null);
            }
            return toDTO(updateRepository.save(update));
        }

        ReferenceSolutionRevision proposedReference = hasReference
                ? createReferenceRevision(assignment, request, referenceSolution)
                : assignment.getActiveReferenceSolutionRevision();
        if (proposedReference == null) {
            throw new ValidationException("Assignment has no active reference solution");
        }

        update.setReferenceSolutionRevision(proposedReference);
        if (hasTests) {
            update.setKind(AssignmentUpdateKind.TEST_SUITE);
            TestSuiteRevision suite = createTestSuiteRevision(assignment, proposedReference);
            update.setTestSuiteRevision(suite);
            update = updateRepository.save(update);
            List<TestCaseInfo> testCases = persistProposedTests(
                    assignment, suite, replacementTestCases, request.getSampleFlags(),
                    request.getTestSuiteUpdateMode());
            publishValidation(update, assignment, proposedReference, suite, testCases,
                    TestGenerationMode.TEST_SUITE_GENERATION);
        } else {
            update.setKind(AssignmentUpdateKind.REFERENCE_ONLY);
            update = updateRepository.save(update);
            List<TestCaseInfo> testCases = referenceCompatibilityCases(assignment, update);
            publishValidation(update, assignment, proposedReference, null, testCases,
                    TestGenerationMode.REFERENCE_COMPATIBILITY);
        }
        return toDTO(update);
    }

    @Transactional(readOnly = true)
    public AssignmentUpdateDTO get(UUID updateId, String email) {
        User teacher = requireUser(email);
        AssignmentUpdate update = updateRepository.findById(updateId)
                .orElseThrow(() -> new EntityNotFoundException("Assignment update not found: " + updateId));
        if (!update.getAssignment().getGroup().getOwner().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("Only the assignment owner can view this update");
        }
        return toDTO(update);
    }

    @Transactional
    public void processValidationResult(TestGenerationResult result) {
        AssignmentUpdate update = updateRepository.findByIdAndStatus(
                result.getAssignmentUpdateId(), AssignmentUpdateStatus.VALIDATING).orElse(null);
        if (update == null) return;

        Assignment assignment = update.getAssignment();
        boolean correlated = assignment.getId().equals(result.getAssignmentId())
                && idsEqual(update.getReferenceSolutionRevision(), result.getReferenceSolutionRevisionId())
                && (update.getTestSuiteRevision() == null
                    ? result.getTestSuiteRevisionId() == null
                    : update.getTestSuiteRevision().getId().equals(result.getTestSuiteRevisionId()));
        if (!correlated || !assignment.getVersion().equals(update.getBaseAssignmentVersion())) {
            reject(update, "Update result is stale or does not match the proposed revisions");
            return;
        }

        if (!result.isSuccess()) {
            reject(update, result.getErrorMessage());
            publishAssignmentEvent(NotificationType.ASSIGNMENT_VALIDATION_FAILED,
                    assignment, update.getCreatedBy(), update.getCreatedBy().getId());
            return;
        }

        UpdateAssignmentRequest proposed = readMetadata(update.getProposedMetadataJson());
        try {
            validateProposedDates(assignment, proposed);
        } catch (ValidationException exception) {
            reject(update, exception.getMessage());
            publishAssignmentEvent(NotificationType.ASSIGNMENT_VALIDATION_FAILED,
                    assignment, update.getCreatedBy(), update.getCreatedBy().getId());
            return;
        }
        boolean wasStudentPublished = studentPublished(assignment);
        boolean datesChanged = datesChanged(assignment, proposed);
        boolean maxPointsChanged = proposed.getMaxPoints() != null
                && proposed.getMaxPoints().compareTo(assignment.getMaxPoints()) != 0;
        if (update.getKind() == AssignmentUpdateKind.TEST_SUITE) {
            TestSuiteRevision previousSuite = assignment.getActiveTestSuiteRevision();
            if (previousSuite != null) previousSuite.setStatus(RevisionStatus.SUPERSEDED);
            TestSuiteRevision suite = update.getTestSuiteRevision();
            suite.setStatus(RevisionStatus.ACTIVE);
            suite.setActivatedAt(Instant.now());
            assignment.setActiveTestSuiteRevision(suite);
            int cleared = gradeService.clearAssignmentGrades(
                    assignment, GradeChangeReason.CLEARED_TEST_SUITE_CHANGED, update.getCreatedBy());
            if (cleared > 0) publishAssignmentEvent(
                    NotificationType.ASSIGNMENT_GRADES_CLEARED,
                    assignment, update.getCreatedBy(), update.getCreatedBy().getId());
        }

        ReferenceSolutionRevision proposedReference = update.getReferenceSolutionRevision();
        if (assignment.getActiveReferenceSolutionRevision() == null
                || !proposedReference.getId().equals(
                        assignment.getActiveReferenceSolutionRevision().getId())) {
            ReferenceSolutionRevision previousReference = assignment.getActiveReferenceSolutionRevision();
            if (previousReference != null) previousReference.setStatus(RevisionStatus.SUPERSEDED);
            proposedReference.setStatus(RevisionStatus.ACTIVE);
            proposedReference.setActivatedAt(Instant.now());
            assignment.setActiveReferenceSolutionRevision(proposedReference);
        }

        applyMetadata(assignment, proposed);
        reconcileLateSubmissions(assignment, proposed);
        if (update.getKind() == AssignmentUpdateKind.REFERENCE_ONLY && maxPointsChanged) {
            int cleared = gradeService.clearAssignmentGrades(
                    assignment, GradeChangeReason.CLEARED_MAX_POINTS_CHANGED, update.getCreatedBy());
            if (cleared > 0) publishAssignmentEvent(
                    NotificationType.ASSIGNMENT_GRADES_CLEARED,
                    assignment, update.getCreatedBy(), update.getCreatedBy().getId());
        }
        update.setStatus(AssignmentUpdateStatus.APPLIED);
        update.setCompletedAt(Instant.now());
        if (update.getKind() == AssignmentUpdateKind.TEST_SUITE) {
            if (wasStudentPublished) {
                publishAssignmentEvent(NotificationType.ASSIGNMENT_TESTS_UPDATED,
                        assignment, update.getCreatedBy(), null);
            }
            eventPublisher.publishEvent(new ReevaluationRequestedEvent(
                    assignment.getId(), update.getTestSuiteRevision().getId()));
        } else if (metadataChangesBeyondReference(proposed) && wasStudentPublished) {
            publishAssignmentEvent(datesChanged
                    ? NotificationType.ASSIGNMENT_RESCHEDULED
                    : NotificationType.ASSIGNMENT_UPDATED, assignment, update.getCreatedBy(), null);
        }
    }

    private AssignmentUpdate baseUpdate(Assignment assignment, User teacher,
                                        UpdateAssignmentRequest request) {
        AssignmentUpdate update = new AssignmentUpdate();
        update.setAssignment(assignment);
        update.setCreatedBy(teacher);
        update.setBaseAssignmentVersion(assignment.getVersion());
        try {
            update.setProposedMetadataJson(objectMapper.writeValueAsString(request));
        } catch (JsonProcessingException exception) {
            throw new ValidationException("Could not serialize the proposed assignment update");
        }
        return update;
    }

    private ReferenceSolutionRevision createReferenceRevision(
            Assignment assignment, UpdateAssignmentRequest request, MultipartFile file) {
        com.github.codehive.model.enums.Language language = request.getReferenceLanguage() != null
                ? request.getReferenceLanguage()
                : assignment.getActiveReferenceSolutionRevision() != null
                    ? assignment.getActiveReferenceSolutionRevision().getLanguage()
                    : null;
        if (language == null) throw new ValidationException("Reference language is required");

        ReferenceSolutionRevision revision = new ReferenceSolutionRevision();
        revision.setAssignment(assignment);
        revision.setLanguage(language);
        revision.setObjectKey("pending");
        revision = referenceRevisionRepository.save(revision);
        String extension = FileExtensionUtil.getFileExtensionByLanguage(language);
        String key = ObjectKeyBuilder.referenceSolutionSourceCode(
                assignment.getId(), revision.getId(), extension);
        revision.setObjectKey(key);
        upload(key, file);
        return revision;
    }

    private TestSuiteRevision createTestSuiteRevision(
            Assignment assignment, ReferenceSolutionRevision reference) {
        int number = testSuiteRevisionRepository
                .findTopByAssignmentIdOrderByRevisionNumberDesc(assignment.getId())
                .map(previous -> previous.getRevisionNumber() + 1)
                .orElse(1);
        TestSuiteRevision revision = new TestSuiteRevision();
        revision.setAssignment(assignment);
        revision.setReferenceSolutionRevision(reference);
        revision.setRevisionNumber(number);
        return testSuiteRevisionRepository.save(revision);
    }

    private List<TestCaseInfo> persistProposedTests(
            Assignment assignment, TestSuiteRevision revision, List<MultipartFile> files,
            List<Boolean> sampleFlags, TestSuiteUpdateMode mode) {
        List<TestCaseInfo> infos = new ArrayList<>();
        int orderOffset = 0;
        if (mode == null || mode == TestSuiteUpdateMode.APPEND) {
            TestSuiteRevision active = assignment.getActiveTestSuiteRevision();
            if (active != null) {
                for (TestCase existing : testCaseRepository
                        .findByTestSuiteRevisionIdOrderByOrderAsc(active.getId())) {
                    TestCase copied = new TestCase(
                            assignment, existing.getOrder(), existing.getIsSample());
                    copied.setTestSuiteRevision(revision);
                    copied = testCaseRepository.save(copied);
                    String input = ObjectKeyBuilder.testCaseInput(
                            assignment.getId(), revision.getId(), copied.getId());
                    String output = ObjectKeyBuilder.testCaseExpectedOutput(
                            assignment.getId(), revision.getId(), copied.getId());
                    copy(ObjectKeyBuilder.testCaseInput(
                            assignment.getId(), active.getId(), existing.getId()), input);
                    infos.add(new TestCaseInfo(copied.getId(), input, output));
                    orderOffset++;
                }
            }
        }
        for (int index = 0; index < files.size(); index++) {
            boolean sample = sampleFlags != null && index < sampleFlags.size()
                    && Boolean.TRUE.equals(sampleFlags.get(index));
            TestCase testCase = new TestCase(assignment, orderOffset + index + 1, sample);
            testCase.setTestSuiteRevision(revision);
            testCase = testCaseRepository.save(testCase);
            String input = ObjectKeyBuilder.testCaseInput(
                    assignment.getId(), revision.getId(), testCase.getId());
            String output = ObjectKeyBuilder.testCaseExpectedOutput(
                    assignment.getId(), revision.getId(), testCase.getId());
            upload(input, files.get(index));
            infos.add(new TestCaseInfo(testCase.getId(), input, output));
        }
        return infos;
    }

    private List<TestCaseInfo> referenceCompatibilityCases(
            Assignment assignment, AssignmentUpdate update) {
        TestSuiteRevision active = assignment.getActiveTestSuiteRevision();
        if (active == null) throw new ValidationException("Assignment has no active test suite");
        return testCaseRepository.findByTestSuiteRevisionIdOrderByOrderAsc(active.getId()).stream()
                .map(testCase -> {
                    TestCaseInfo info = new TestCaseInfo(
                            testCase.getId(),
                            ObjectKeyBuilder.testCaseInput(
                                    assignment.getId(), active.getId(), testCase.getId()),
                            ObjectKeyBuilder.referenceValidationOutput(
                                    assignment.getId(), update.getId(), testCase.getId()));
                    info.setBaselineOutputPath(ObjectKeyBuilder.testCaseExpectedOutput(
                            assignment.getId(), active.getId(), testCase.getId()));
                    return info;
                }).toList();
    }

    private void publishValidation(AssignmentUpdate update, Assignment assignment,
                                   ReferenceSolutionRevision reference,
                                   TestSuiteRevision suite, List<TestCaseInfo> testCases,
                                   TestGenerationMode mode) {
        TestGenerationJob job = new TestGenerationJob(
                assignment.getId(), reference.getObjectKey(), reference.getLanguage(), testCases,
                proposedTimeLimit(assignment, update), proposedMemoryLimit(assignment, update));
        job.setAssignmentUpdateId(update.getId());
        job.setReferenceSolutionRevisionId(reference.getId());
        job.setTestSuiteRevisionId(suite != null ? suite.getId() : null);
        job.setMode(mode);
        UpdateAssignmentRequest proposed = readMetadata(update.getProposedMetadataJson());
        job.setComparatorType(proposed.getComparatorType() != null
                ? proposed.getComparatorType() : assignment.getComparatorType());
        generationProducer.sendTestGenerationRequest(job);
    }

    private Long proposedTimeLimit(Assignment assignment, AssignmentUpdate update) {
        UpdateAssignmentRequest request = readMetadata(update.getProposedMetadataJson());
        return request.getTimeLimitMs() != null ? request.getTimeLimitMs() : assignment.getTimeLimitMs();
    }

    private Long proposedMemoryLimit(Assignment assignment, AssignmentUpdate update) {
        UpdateAssignmentRequest request = readMetadata(update.getProposedMetadataJson());
        return request.getMemoryLimitMb() != null ? request.getMemoryLimitMb() : assignment.getMemoryLimitMb();
    }

    private void applyMetadata(Assignment assignment, UpdateAssignmentRequest request) {
        if (request.getTitle() != null) {
            if (request.getTitle().isBlank()) throw new ValidationException("Title cannot be blank");
            assignment.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            if (request.getDescription().isBlank()) throw new ValidationException("Description cannot be blank");
            assignment.setDescription(request.getDescription());
        }
        if (request.getConstraints() != null) assignment.setConstraints(request.getConstraints());
        if (request.getHints() != null) assignment.setHints(request.getHints());
        if (request.getTags() != null) assignment.setTags(request.getTags());
        if (request.getAllowedLanguages() != null) {
            if (request.getAllowedLanguages().isEmpty()) {
                throw new ValidationException("At least one allowed language is required");
            }
            assignment.setAllowedLanguages(request.getAllowedLanguages());
        }
        if (request.getTimeLimitMs() != null) assignment.setTimeLimitMs(request.getTimeLimitMs());
        if (request.getMemoryLimitMb() != null) assignment.setMemoryLimitMb(request.getMemoryLimitMb());
        if (request.getComparatorType() != null) assignment.setComparatorType(request.getComparatorType());
        if (request.getMaxPoints() != null) assignment.setMaxPoints(request.getMaxPoints());
        if (Boolean.TRUE.equals(request.getClearLaunchDate())) assignment.setLaunchDate(null);
        else if (request.getLaunchDate() != null) assignment.setLaunchDate(request.getLaunchDate());
        if (Boolean.TRUE.equals(request.getClearDueDate())) assignment.setDueDate(null);
        else if (request.getDueDate() != null) assignment.setDueDate(request.getDueDate());
        if (Boolean.TRUE.equals(request.getClearCloseDate())) assignment.setCloseDate(null);
        else if (request.getCloseDate() != null) assignment.setCloseDate(request.getCloseDate());
        if (request.getExamples() != null) {
            List<AssignmentExample> examples = new ArrayList<>();
            for (int index = 0; index < request.getExamples().size(); index++) {
                AssignmentExampleRequest example = request.getExamples().get(index);
                examples.add(new AssignmentExample(
                        assignment, index + 1, example.getInput(), example.getOutput(),
                        example.getExplanation()));
            }
            assignment.setExamples(examples);
        }
        assignment.setUpdatedAt(LocalDateTime.now());
    }

    private void validateProposedDates(Assignment assignment, UpdateAssignmentRequest request) {
        validateNotPast("Launch", request.getLaunchDate());
        validateNotPast("Due", request.getDueDate());
        validateNotPast("Close", request.getCloseDate());
        Instant launch = Boolean.TRUE.equals(request.getClearLaunchDate()) ? null
                : request.getLaunchDate() != null ? request.getLaunchDate() : assignment.getLaunchDate();
        Instant due = Boolean.TRUE.equals(request.getClearDueDate()) ? null
                : request.getDueDate() != null ? request.getDueDate() : assignment.getDueDate();
        Instant close = Boolean.TRUE.equals(request.getClearCloseDate()) ? null
                : request.getCloseDate() != null ? request.getCloseDate() : assignment.getCloseDate();
        if (launch != null && due != null && launch.isAfter(due)
                || due != null && close != null && due.isAfter(close)
                || launch != null && close != null && launch.isAfter(close)) {
            throw new ValidationException("Assignment dates must satisfy launchDate <= dueDate <= closeDate");
        }
    }

    private void validateNotPast(String field, Instant value) {
        if (value != null && value.isBefore(Instant.now())) {
            throw new ValidationException(field + " date cannot be before the current time");
        }
    }

    private void reconcileLateSubmissions(Assignment assignment, UpdateAssignmentRequest request) {
        if (Boolean.TRUE.equals(request.getClearDueDate())) {
            submissionRepository.markAllLateSubmissionsOnTime(assignment.getId());
        } else if (request.getDueDate() != null) {
            LocalDateTime newDueDate = LocalDateTime.ofInstant(
                    request.getDueDate(), ZoneId.systemDefault());
            submissionRepository.markLateSubmissionsOnTimeThrough(
                    assignment.getId(), newDueDate);
        }
    }

    private boolean datesChanged(Assignment assignment, UpdateAssignmentRequest request) {
        return request.getLaunchDate() != null || request.getDueDate() != null
                || request.getCloseDate() != null
                || Boolean.TRUE.equals(request.getClearLaunchDate())
                || Boolean.TRUE.equals(request.getClearDueDate())
                || Boolean.TRUE.equals(request.getClearCloseDate());
    }

    private boolean metadataChangesBeyondReference(UpdateAssignmentRequest request) {
        return request.getTitle() != null || request.getDescription() != null
                || request.getConstraints() != null || request.getHints() != null
                || request.getTags() != null || request.getAllowedLanguages() != null
                || request.getTimeLimitMs() != null || request.getMemoryLimitMb() != null
                || request.getComparatorType() != null || request.getMaxPoints() != null
                || datesChanged(null, request) || request.getExamples() != null;
    }

    private boolean studentPublished(Assignment assignment) {
        return Boolean.TRUE.equals(assignment.getIsActive())
                && assignment.getValidationStatus()
                    == com.github.codehive.model.enums.AssignmentValidationStatus.READY
                && (assignment.getLaunchDate() == null
                    || !Instant.now().isBefore(assignment.getLaunchDate()));
    }

    private void publishAssignmentEvent(NotificationType type, Assignment assignment,
                                        User actor, UUID subjectUserId) {
        notificationPublisher.publish(NotificationDomainEvent.of(
                type, actor != null ? actor.getId() : null, subjectUserId,
                assignment.getGroup().getId(), assignment.getId(), null));
    }

    private void reject(AssignmentUpdate update, String failure) {
        update.setStatus(AssignmentUpdateStatus.REJECTED);
        update.setFailureMessage(failure);
        update.setCompletedAt(Instant.now());
        if (update.getTestSuiteRevision() != null) {
            update.getTestSuiteRevision().setStatus(RevisionStatus.FAILED);
            update.getTestSuiteRevision().setFailureMessage(failure);
        }
        ReferenceSolutionRevision reference = update.getReferenceSolutionRevision();
        if (reference != null && reference != update.getAssignment().getActiveReferenceSolutionRevision()) {
            reference.setStatus(RevisionStatus.FAILED);
        }
    }

    private UpdateAssignmentRequest readMetadata(String json) {
        try {
            return objectMapper.readValue(json, UpdateAssignmentRequest.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored assignment update metadata is invalid", exception);
        }
    }

    private boolean idsEqual(ReferenceSolutionRevision revision, UUID id) {
        return revision == null ? id == null : revision.getId().equals(id);
    }

    private void upload(String key, MultipartFile file) {
        try {
            objectStorageService.upload(key, new String(file.getBytes(), StandardCharsets.UTF_8));
        } catch (IOException exception) {
            throw new ValidationException("Could not read uploaded file");
        } catch (Exception exception) {
            throw new RuntimeException("Could not upload object: " + key, exception);
        }
    }

    private void copy(String sourceKey, String targetKey) {
        try (java.io.InputStream stream = objectStorageService.download(sourceKey)) {
            objectStorageService.upload(targetKey,
                    new String(stream.readAllBytes(), StandardCharsets.UTF_8));
        } catch (Exception exception) {
            throw new RuntimeException("Could not copy object into proposed test revision", exception);
        }
    }

    private Assignment requireAssignment(UUID id) {
        return assignmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found: " + id));
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
    }

    private AssignmentUpdateDTO toDTO(AssignmentUpdate update) {
        return new AssignmentUpdateDTO(
                update.getId(), update.getAssignment().getId(), update.getKind(), update.getStatus(),
                update.getFailureMessage(), update.getCreatedAt(), update.getCompletedAt());
    }
}
