package com.github.codehive.service;

import java.io.InputStream;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.codehive.messaging.producer.ExecutionRequestProducer;
import com.github.codehive.model.dto.ExecutionDTO;
import com.github.codehive.model.dto.queue.ExecutionJob;
import com.github.codehive.model.dto.queue.ExecutionReport;
import com.github.codehive.model.dto.queue.ExecutionTestCaseInfo;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.ReferenceSolution;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.TestCase;
import com.github.codehive.model.entity.TestSuiteRevision;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.exception.ValidationException;
import org.springframework.security.access.AccessDeniedException;
import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.ArtifactExpiredException;
import com.github.codehive.model.mapper.ExecutionMapper;
import com.github.codehive.model.request.execution.ExecutionRequest;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.ReferenceSolutionRepository;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.TestCaseRepository;
import com.github.codehive.notification.NotificationDomainEventPublisher;
import com.github.codehive.notification.event.NotificationDomainEvent;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.enums.SubmissionStatus;
import com.github.codehive.model.enums.StudentWorkStatus;
import com.github.codehive.model.enums.GradeChangeReason;
import com.github.codehive.model.enums.ExecutionTrigger;
import com.github.codehive.utils.FileExtensionUtil;
import com.github.codehive.utils.ObjectKeyBuilder;
import com.github.codehive.service.event.ExecutionJobCreatedEvent;

@Service
public class ExecutionRequestService {

    private final ExecutionRequestProducer executionRequestProducer;
    private final ExecutionRepository executionRepository;
    private final ObjectStorageService objectStorageService;
    private final UserRepository userRepository;
    private final AssignmentRepository assignmentRepository;
    private final ReferenceSolutionRepository referenceSolutionRepository;
    private final ObjectMapper objectMapper;
    private final GroupEnrollmentRepository enrollmentRepository;
    private final SubmissionRepository submissionRepository;
    private final TestCaseRepository testCaseRepository;
    private final NotificationDomainEventPublisher notificationPublisher;
    private final StudentAssignmentWorkService studentWorkService;
    private final AssignmentGradeService gradeService;
    private final ApplicationEventPublisher eventPublisher;

    public ExecutionRequestService(ExecutionRequestProducer executionRequestProducer,
                                   ExecutionRepository executionRepository,
                                   ObjectStorageService objectStorageService,
                                   UserRepository userRepository,
                                   AssignmentRepository assignmentRepository,
                                   ReferenceSolutionRepository referenceSolutionRepository,
                                   ObjectMapper objectMapper,
                                   GroupEnrollmentRepository enrollmentRepository,
                                   SubmissionRepository submissionRepository,
                                   TestCaseRepository testCaseRepository,
                                   NotificationDomainEventPublisher notificationPublisher,
                                   StudentAssignmentWorkService studentWorkService,
                                   AssignmentGradeService gradeService,
                                   ApplicationEventPublisher eventPublisher) {
        this.executionRequestProducer = executionRequestProducer;
        this.executionRepository = executionRepository;
        this.objectStorageService = objectStorageService;
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
        this.referenceSolutionRepository = referenceSolutionRepository;
        this.objectMapper = objectMapper;
        this.enrollmentRepository = enrollmentRepository;
        this.submissionRepository = submissionRepository;
        this.testCaseRepository = testCaseRepository;
        this.notificationPublisher = notificationPublisher;
        this.studentWorkService = studentWorkService;
        this.gradeService = gradeService;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public ExecutionDTO requestExecution(ExecutionRequest request, String authenticatedEmail) {
        Assignment assignment = assignmentRepository.findById(request.getAssignmentId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Assignment not found with id: " + request.getAssignmentId()));

        User user = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
        validateExecutionRequest(request, assignment, user);

        Execution execution = new Execution(request.getExecutionType(), user);
        if (request.getExecutionType() == ExecutionType.DEFINITIVE) {
            StudentAssignmentWork work = studentWorkService.getOrCreate(assignment, user);
            if (work.getCurrentSubmission() != null
                    && work.getCurrentSubmission().getStatus() == SubmissionStatus.SUBMITTED) {
                throw new ValidationException("Withdraw the current submission before submitting again");
            }
            gradeService.clearGrade(work, GradeChangeReason.CLEARED_RESUBMISSION, user);
            boolean late = assignment.getDueDate() != null && Instant.now().isAfter(assignment.getDueDate());
            Submission submission = submissionRepository.save(
                    new Submission(assignment, user, request.getLanguage(), late));
            submission.setStudentWork(work);
            submission.setStatus(SubmissionStatus.SUBMITTED);
            String submissionExtension = FileExtensionUtil.getFileExtensionByLanguage(request.getLanguage());
            submission.setSourceCodeKey(ObjectKeyBuilder.submissionSourceCode(
                    assignment.getId(), submission.getId(), submissionExtension));
            work.setCurrentSubmission(submission);
            work.setStatus(StudentWorkStatus.SUBMITTED);
            work.setUpdatedAt(Instant.now());
            execution.setSubmission(submission);
            execution.setTestSuiteRevision(assignment.getActiveTestSuiteRevision());
            execution.setTrigger(ExecutionTrigger.INITIAL_SUBMISSION);
            notificationPublisher.publish(NotificationDomainEvent.of(
                    late ? NotificationType.LATE_ASSIGNMENT_SUBMITTED : NotificationType.ASSIGNMENT_SUBMITTED,
                    user.getId(), user.getId(), assignment.getGroup().getId(),
                    assignment.getId(), submission.getId()));
        }

        execution = executionRepository.save(execution);

        String extension = FileExtensionUtil.getFileExtensionByLanguage(request.getLanguage());
        String codeStorageKey = execution.getSubmission() != null
                ? execution.getSubmission().getSourceCodeKey()
                : ObjectKeyBuilder.practiceExecutionSourceCode(execution.getId(), extension);

        try {
            objectStorageService.upload(codeStorageKey, request.getCode());
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload source code to object storage", e);
        }

        ExecutionJob job = buildExecutionJob(execution, request, assignment, codeStorageKey);
        eventPublisher.publishEvent(new ExecutionJobCreatedEvent(job));

        return ExecutionMapper.toDTO(execution);
    }

    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT,
            fallbackExecution = true)
    public void dispatchExecutionJob(ExecutionJobCreatedEvent event) {
        executionRequestProducer.sendExecutionRequest(event.job());
    }

    @Transactional(readOnly = true)
    public ExecutionDTO getExecutionById(UUID id, String authenticatedEmail) {
        Execution execution = executionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Execution not found with id: " + id));
        authorizeExecutionRead(execution, authenticatedEmail);
        return ExecutionMapper.toDTO(execution);
    }

    @Transactional(readOnly = true)
    public ExecutionReport getExecutionReport(UUID id, String authenticatedEmail) {
        Execution execution = executionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Execution not found with id: " + id));

        authorizeExecutionRead(execution, authenticatedEmail);
        if (execution.getArtifactsExpireAt() != null
                && !Instant.now().isBefore(execution.getArtifactsExpireAt())) {
            throw new ArtifactExpiredException("Detailed artifacts for execution " + id
                    + " expired after 180 days");
        }
        String reportKey = execution.getExecutionType() == ExecutionType.PRACTICE
                ? ObjectKeyBuilder.practiceExecutionReport(id)
                : ObjectKeyBuilder.executionReport(id);
        try (InputStream reportStream = objectStorageService.download(reportKey)) {
            return objectMapper.readValue(reportStream, ExecutionReport.class);
        } catch (Exception e) {
            if (execution.getStatus() != null && execution.getStatus().name().equals("PENDING")) {
                throw new EntityNotFoundException("Report not available yet: execution " + id + " is still pending");
            }
            throw new EntityNotFoundException("Report not found for execution: " + id);
        }
    }

    private ExecutionJob buildExecutionJob(Execution execution, ExecutionRequest request,
                                           Assignment assignment, String sourceKey) {

        if (request.getExecutionType() == ExecutionType.PRACTICE) {
            ReferenceSolution referenceSolution = assignment.getActiveReferenceSolutionRevision() == null
                    ? resolveReferenceSolution(assignment)
                    : null;
            Language referenceLanguage = assignment.getActiveReferenceSolutionRevision() != null
                    ? assignment.getActiveReferenceSolutionRevision().getLanguage()
                    : referenceSolution.getLanguage();
            String refPath = assignment.getActiveReferenceSolutionRevision() != null
                    ? assignment.getActiveReferenceSolutionRevision().getObjectKey()
                    : ObjectKeyBuilder.referenceSolutionSourceCode(
                            assignment.getId(),
                            FileExtensionUtil.getFileExtensionByLanguage(referenceLanguage));

            List<ExecutionTestCaseInfo> testCases = new java.util.ArrayList<>();
            for (int index = 0; index < request.getTestCases().size(); index++) {
                int order = index + 1;
                testCases.add(new ExecutionTestCaseInfo(
                        null,
                        order,
                        null,
                        request.getTestCases().get(index),
                        null,
                        ObjectKeyBuilder.practiceExecutionTestCaseStdout(execution.getId(), order),
                        ObjectKeyBuilder.practiceExecutionTestCaseStderr(execution.getId(), order)));
            }
            return new ExecutionJob(
                    execution.getId(),
                    sourceKey,
                    refPath,
                    request.getLanguage(),
                    request.getExecutionType(),
                    testCases,
                    assignment.getTimeLimitMs(),
                    assignment.getMemoryLimitMb(),
                    assignment.getComparatorType(),
                    ObjectKeyBuilder.practiceExecutionReport(execution.getId()),
                    referenceLanguage,
                    assignment.getActiveTestSuiteRevision() != null
                            ? assignment.getActiveTestSuiteRevision().getId() : null,
                    "PRACTICE"
            );
        } else {
            TestSuiteRevision revision = assignment.getActiveTestSuiteRevision();
            List<ExecutionTestCaseInfo> testCases = testCaseRepository
                    .findByTestSuiteRevisionIdOrderByOrderAsc(revision.getId()).stream()
                    .map(testCase -> definitiveTestCaseInfo(
                            assignment, revision, execution, testCase))
                    .toList();
            return new ExecutionJob(
                    execution.getId(),
                    sourceKey,
                    null,
                    request.getLanguage(),
                    request.getExecutionType(),
                    testCases,
                    assignment.getTimeLimitMs(),
                    assignment.getMemoryLimitMb(),
                    assignment.getComparatorType(),
                    ObjectKeyBuilder.executionReport(execution.getId()),
                    null,
                    revision.getId(),
                    ExecutionTrigger.INITIAL_SUBMISSION.name()
            );
        }
    }

    private ExecutionTestCaseInfo definitiveTestCaseInfo(Assignment assignment,
                                                          TestSuiteRevision revision,
                                                          Execution execution,
                                                          TestCase testCase) {
        return new ExecutionTestCaseInfo(
                testCase.getId(),
                testCase.getOrder(),
                ObjectKeyBuilder.testCaseInput(
                        assignment.getId(), revision.getId(), testCase.getId()),
                null,
                ObjectKeyBuilder.testCaseExpectedOutput(
                        assignment.getId(), revision.getId(), testCase.getId()),
                ObjectKeyBuilder.executionTestCaseStdout(execution.getId(), testCase.getId()),
                ObjectKeyBuilder.executionTestCaseStderr(execution.getId(), testCase.getId()));
    }

    private ReferenceSolution resolveReferenceSolution(Assignment assignment) {
        List<ReferenceSolution> solutions = referenceSolutionRepository.findByAssignmentId(assignment.getId());
        if (solutions.isEmpty()) {
            throw new EntityNotFoundException(
                    "No reference solution found for assignment: " + assignment.getId());
        }
        return solutions.get(0);
    }

    private void validateExecutionRequest(ExecutionRequest request, Assignment assignment, User user) {
        if (!Boolean.TRUE.equals(assignment.getIsActive())
                || !Boolean.TRUE.equals(assignment.getGroup().getIsActive())) {
            throw new EntityNotFoundException("Assignment not found: " + assignment.getId());
        }
        if (Boolean.TRUE.equals(assignment.getGroup().getArchived())) {
            throw new ValidationException("Archived groups are read-only");
        }
        if (assignment.getValidationStatus() != AssignmentValidationStatus.READY) {
            throw new ValidationException("Assignment test cases are not ready");
        }
        if (!assignment.getAllowedLanguages().contains(request.getLanguage())) {
            throw new ValidationException("Language is not allowed for this assignment");
        }
        if (request.getExecutionType() == ExecutionType.PRACTICE
                && (request.getTestCases() == null || request.getTestCases().isEmpty())) {
            throw new ValidationException("Practice execution requires at least one test case");
        }

        boolean owner = assignment.getGroup().getOwner().getId().equals(user.getId());
        if (owner) {
            if (request.getExecutionType() == ExecutionType.DEFINITIVE) {
                throw new AccessDeniedException("Teachers cannot create student deliveries");
            }
            return;
        }
        if (user.getRole() != Role.STUDENT || !enrollmentRepository
                .existsByGroupIdAndStudentIdAndStatus(assignment.getGroup().getId(), user.getId(),
                        EnrollmentStatus.ACTIVE)) {
            throw new AccessDeniedException("Active enrollment is required for this assignment");
        }
        Instant now = Instant.now();
        if (assignment.getLaunchDate() != null && now.isBefore(assignment.getLaunchDate())) {
            throw new EntityNotFoundException("Assignment is not available yet");
        }
        if (request.getExecutionType() == ExecutionType.DEFINITIVE
                && assignment.getCloseDate() != null && !now.isBefore(assignment.getCloseDate())) {
            throw new ValidationException("Assignment is closed and no longer accepts deliveries");
        }
        if (request.getExecutionType() == ExecutionType.DEFINITIVE
                && (assignment.getActiveTestSuiteRevision() == null
                || testCaseRepository.countByTestSuiteRevisionId(
                        assignment.getActiveTestSuiteRevision().getId()) == 0)) {
            throw new ValidationException("Assignment has no active test suite");
        }
    }

    private void authorizeExecutionRead(Execution execution, String authenticatedEmail) {
        User user = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
        if (execution.getUser() != null && execution.getUser().getId().equals(user.getId())) return;
        if (execution.getSubmission() != null
                && execution.getSubmission().getAssignment().getGroup().getOwner().getId()
                    .equals(user.getId())) return;
        throw new AccessDeniedException("You cannot access this execution");
    }
}
