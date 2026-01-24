package com.github.codehive.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.messaging.producer.ExecutionRequestProducer;
import com.github.codehive.model.dto.ExecutionDTO;
import com.github.codehive.model.dto.queue.ExecutionJob;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.mapper.ExecutionMapper;
import com.github.codehive.model.request.execution.ExecutionRequest;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.utils.FileExtensionUtil;
import com.github.codehive.utils.ObjectKeyBuilder;

/**
 * 
 * TODO: Fix this class for a general execution request service. Currently, it is only for manual test execution.
 * 
 */

@Service
public class ExecutionRequestService {
    private static final Logger logger = LoggerFactory.getLogger(ExecutionRequestService.class);
    
    private static final Long DEFAULT_TIME_LIMIT_MS = 5000L;
    private static final Long DEFAULT_MEMORY_LIMIT_MB = 256L;
    
    private final ExecutionRequestProducer executionRequestProducer;
    private final ExecutionRepository executionRepository;
    private final ObjectStorageService objectStorageService;
    private final UserRepository userRepository;
    
    public ExecutionRequestService(ExecutionRequestProducer executionRequestProducer,
                                   ExecutionRepository executionRepository,
                                   ObjectStorageService objectStorageService,
                                   UserRepository userRepository) {
        this.executionRequestProducer = executionRequestProducer;
        this.executionRepository = executionRepository;
        this.objectStorageService = objectStorageService;
        this.userRepository = userRepository;
    }

    @Transactional
    public ExecutionDTO requestExecution(ExecutionRequest request) {
        logger.info("[WORKFLOW] Step 1: Creating execution entity - language={}, executionType={}, assignmentId={}", 
            request.getLanguage(), request.getExecutionType(), request.getAssignmentId());
        
        Execution execution = new Execution(request.getExecutionType());
        
        if (request.getRequesterId() != null) {
            User user = userRepository.findById(request.getRequesterId())
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + request.getRequesterId()));
            execution.setUser(user);
        }
        
        execution = executionRepository.save(execution);
        logger.info("[WORKFLOW] Step 2: Execution entity saved to database - executionId={}, status={}",
            execution.getId(), execution.getStatus());
        
        String extension = FileExtensionUtil.getFileExtensionByLanguage(request.getLanguage());
        String codeStorageKey = ObjectKeyBuilder.executionSourceCode(execution.getId(), extension);
        
        logger.info("[WORKFLOW] Step 3: Uploading source code to MinIO - key={}, codeLength={}",
            codeStorageKey, request.getCode() != null ? request.getCode().length() : 0);
        
        try {
            objectStorageService.upload(codeStorageKey, request.getCode());
            logger.info("[WORKFLOW] Step 3: Source code uploaded successfully - key={}", codeStorageKey);
        } catch (Exception e) {
            logger.error("[WORKFLOW] Step 3 FAILED: Could not upload source code - executionId={}, error={}", 
                execution.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to upload source code to object storage", e);
        }

        ExecutionJob job = buildExecutionJob(execution, request, extension);
        logger.info("[WORKFLOW] Step 4: Built ExecutionJob - executionId={}, sourceKey={}, outputKey={}, timeLimitMs={}, memoryLimitMb={}",
            job.getId(), job.getSource(), job.getOutputPath(), job.getTimeLimitMs(), job.getMemoryLimitMb());
        
        logger.info("[WORKFLOW] Step 5: Sending execution job to RabbitMQ queue");
        executionRequestProducer.sendExecutionRequest(job);
        
        logger.info("[WORKFLOW] Execution request workflow completed - executionId={}", execution.getId());
        return ExecutionMapper.toDTO(execution);
    }

    @Transactional(readOnly = true)
    public ExecutionDTO getExecutionById(Long id) {
        Execution execution = executionRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Execution not found with id: " + id));
        return ExecutionMapper.toDTO(execution);
    }
    
    private ExecutionJob buildExecutionJob(Execution execution, ExecutionRequest request, String extension) {
        String sourceKey = ObjectKeyBuilder.executionSourceCode(execution.getId(), extension);
        String outputKey = ObjectKeyBuilder.executionTestCaseOutput(execution.getId());
        
        if (request.getExecutionType() == ExecutionType.PRACTICE) {
            return new ExecutionJob(
                execution.getId(),
                sourceKey,
                ObjectKeyBuilder.referenceSolutionSourceCode(request.getAssignmentId(), "java"), // This will depend on assignment settings in future
                request.getLanguage(),
                request.getExecutionType(),
                request.getTestCases(),
                DEFAULT_TIME_LIMIT_MS, // This will depend on assignment settings in future
                DEFAULT_MEMORY_LIMIT_MB, // This will depend on assignment settings in future
                ComparatorType.EXACT_MATCH, // This will depend on assignment settings in future
                outputKey,
                request.getTestCases() != null ? request.getTestCases().size() : 0,
                ObjectKeyBuilder.testsPath(request.getAssignmentId()),
                Language.JAVA // This will deépend on assignment settings in future
            );
        } else {
            return new ExecutionJob(
                execution.getId(),
                sourceKey,
                null,
                request.getLanguage(),
                request.getExecutionType(),
                null,
                DEFAULT_TIME_LIMIT_MS, // This will depend on assignment settings in future
                DEFAULT_MEMORY_LIMIT_MB, // This will depend on assignment settings in future
                ComparatorType.EXACT_MATCH, // This will depend on assignment settings in future
                outputKey,
                5, // This will depend on assignment settings in future
                ObjectKeyBuilder.testsPath(request.getAssignmentId()),
                Language.JAVA // This will depend on assignment settings in future
            );
        }
    }
}
