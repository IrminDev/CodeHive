package com.github.codehive.service;

import java.io.InputStream;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.codehive.messaging.producer.ExecutionRequestProducer;
import com.github.codehive.model.dto.ExecutionDTO;
import com.github.codehive.model.dto.queue.ExecutionJob;
import com.github.codehive.model.dto.queue.ExecutionReport;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.ReferenceSolution;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.exception.ValidationException;
import org.springframework.security.access.AccessDeniedException;
import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.mapper.ExecutionMapper;
import com.github.codehive.model.request.execution.ExecutionRequest;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.ReferenceSolutionRepository;
import com.github.codehive.repository.TestCaseRepository;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.utils.FileExtensionUtil;
import com.github.codehive.utils.ObjectKeyBuilder;

@Service
public class ExecutionRequestService {

    private final ExecutionRequestProducer executionRequestProducer;
    private final ExecutionRepository executionRepository;
    private final ObjectStorageService objectStorageService;
    private final UserRepository userRepository;
    private final AssignmentRepository assignmentRepository;
    private final ReferenceSolutionRepository referenceSolutionRepository;
    private final TestCaseRepository testCaseRepository;
    private final ObjectMapper objectMapper;
    private final GroupEnrollmentRepository enrollmentRepository;
    private final SubmissionRepository submissionRepository;

    public ExecutionRequestService(ExecutionRequestProducer executionRequestProducer,
                                   ExecutionRepository executionRepository,
                                   ObjectStorageService objectStorageService,
                                   UserRepository userRepository,
                                   AssignmentRepository assignmentRepository,
                                   ReferenceSolutionRepository referenceSolutionRepository,
                                   TestCaseRepository testCaseRepository,
                                   ObjectMapper objectMapper,
                                   GroupEnrollmentRepository enrollmentRepository,
                                   SubmissionRepository submissionRepository) {
        this.executionRequestProducer = executionRequestProducer;
        this.executionRepository = executionRepository;
        this.objectStorageService = objectStorageService;
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
        this.referenceSolutionRepository = referenceSolutionRepository;
        this.testCaseRepository = testCaseRepository;
        this.objectMapper = objectMapper;
        this.enrollmentRepository = enrollmentRepository;
        this.submissionRepository = submissionRepository;
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
            boolean late = assignment.getDueDate() != null && Instant.now().isAfter(assignment.getDueDate());
            Submission submission = submissionRepository.save(
                    new Submission(assignment, user, request.getLanguage(), late));
            execution.setSubmission(submission);
        }

        execution = executionRepository.save(execution);

        String extension = FileExtensionUtil.getFileExtensionByLanguage(request.getLanguage());
        String codeStorageKey = ObjectKeyBuilder.executionSourceCode(execution.getId(), extension);

        try {
            objectStorageService.upload(codeStorageKey, request.getCode());
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload source code to object storage", e);
        }

        ExecutionJob job = buildExecutionJob(execution, request, assignment, extension);
        executionRequestProducer.sendExecutionRequest(job);

        return ExecutionMapper.toDTO(execution);
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
        String reportKey = ObjectKeyBuilder.executionReport(id);
        try {
            InputStream reportStream = objectStorageService.download(reportKey);
            return objectMapper.readValue(reportStream, ExecutionReport.class);
        } catch (Exception e) {
            if (execution.getStatus() != null && execution.getStatus().name().equals("PENDING")) {
                throw new EntityNotFoundException("Report not available yet: execution " + id + " is still pending");
            }
            throw new EntityNotFoundException("Report not found for execution: " + id);
        }
    }

    private ExecutionJob buildExecutionJob(Execution execution, ExecutionRequest request,
                                           Assignment assignment, String extension) {
        String sourceKey = ObjectKeyBuilder.executionSourceCode(execution.getId(), extension);
        String outputKey = ObjectKeyBuilder.executionTestCaseOutput(execution.getId());

        if (request.getExecutionType() == ExecutionType.PRACTICE) {
            ReferenceSolution referenceSolution = resolveReferenceSolution(assignment);
            String refExtension = FileExtensionUtil.getFileExtensionByLanguage(referenceSolution.getLanguage());
            String refPath = ObjectKeyBuilder.referenceSolutionSourceCode(assignment.getId(), refExtension);

            List<String> testCases = request.getTestCases();
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
                    outputKey,
                    testCases != null ? testCases.size() : 0,
                    ObjectKeyBuilder.testsPath(assignment.getId()),
                    referenceSolution.getLanguage()
            );
        } else {
            long numTests = testCaseRepository.countByAssignmentId(assignment.getId());
            return new ExecutionJob(
                    execution.getId(),
                    sourceKey,
                    null,
                    request.getLanguage(),
                    request.getExecutionType(),
                    null,
                    assignment.getTimeLimitMs(),
                    assignment.getMemoryLimitMb(),
                    assignment.getComparatorType(),
                    outputKey,
                    (int) numTests,
                    ObjectKeyBuilder.testsPath(assignment.getId()),
                    null
            );
        }
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
        if (request.getExecutionType() == ExecutionType.PRACTICE
                && (request.getTestCases() == null || request.getTestCases().isEmpty())) {
            throw new ValidationException("Practice execution requires at least one test case");
        }
    }

    private void authorizeExecutionRead(Execution execution, String authenticatedEmail) {
        User user = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
        if (execution.getUser() == null || !execution.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You cannot access this execution");
        }
    }
}
