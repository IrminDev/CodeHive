package com.github.codehive.service;

import java.io.InputStream;
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
import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.mapper.ExecutionMapper;
import com.github.codehive.model.request.execution.ExecutionRequest;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.ReferenceSolutionRepository;
import com.github.codehive.repository.TestCaseRepository;
import com.github.codehive.repository.UserRepository;
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

    public ExecutionRequestService(ExecutionRequestProducer executionRequestProducer,
                                   ExecutionRepository executionRepository,
                                   ObjectStorageService objectStorageService,
                                   UserRepository userRepository,
                                   AssignmentRepository assignmentRepository,
                                   ReferenceSolutionRepository referenceSolutionRepository,
                                   TestCaseRepository testCaseRepository,
                                   ObjectMapper objectMapper) {
        this.executionRequestProducer = executionRequestProducer;
        this.executionRepository = executionRepository;
        this.objectStorageService = objectStorageService;
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
        this.referenceSolutionRepository = referenceSolutionRepository;
        this.testCaseRepository = testCaseRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ExecutionDTO requestExecution(ExecutionRequest request) {
        Assignment assignment = assignmentRepository.findById(request.getAssignmentId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Assignment not found with id: " + request.getAssignmentId()));

        Execution execution = new Execution(request.getExecutionType());

        if (request.getRequesterId() != null) {
            User user = userRepository.findById(request.getRequesterId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "User not found with id: " + request.getRequesterId()));
            execution.setUser(user);
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
    public ExecutionDTO getExecutionById(UUID id) {
        Execution execution = executionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Execution not found with id: " + id));
        return ExecutionMapper.toDTO(execution);
    }

    @Transactional(readOnly = true)
    public ExecutionReport getExecutionReport(UUID id) {
        Execution execution = executionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Execution not found with id: " + id));

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
}
