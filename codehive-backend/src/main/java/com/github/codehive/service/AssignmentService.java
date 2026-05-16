package com.github.codehive.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.github.codehive.messaging.producer.TestGenerationRequestProducer;
import java.util.UUID;

import com.github.codehive.model.dto.AssignmentDTO;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.dto.queue.TestCaseInfo;
import com.github.codehive.model.dto.queue.TestGenerationJob;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ReferenceSolution;
import com.github.codehive.model.entity.TestCase;
import com.github.codehive.model.mapper.AssignmentMapper;
import com.github.codehive.model.request.assignment.CreateAssignmentRequest;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ReferenceSolutionRepository;
import com.github.codehive.repository.TestCaseRepository;
import com.github.codehive.utils.FileExtensionUtil;
import com.github.codehive.utils.ObjectKeyBuilder;

@Service
public class AssignmentService {
    private static final Logger logger = LoggerFactory.getLogger(AssignmentService.class);

    private final AssignmentRepository assignmentRepository;
    private final TestCaseRepository testCaseRepository;
    private final ReferenceSolutionRepository referenceSolutionRepository;
    private final ObjectStorageService objectStorageService;
    private final TestGenerationRequestProducer testGenerationRequestProducer;

    public AssignmentService(AssignmentRepository assignmentRepository,
                             TestCaseRepository testCaseRepository,
                             ReferenceSolutionRepository referenceSolutionRepository,
                             ObjectStorageService objectStorageService,
                             TestGenerationRequestProducer testGenerationRequestProducer) {
        this.assignmentRepository = assignmentRepository;
        this.testCaseRepository = testCaseRepository;
        this.referenceSolutionRepository = referenceSolutionRepository;
        this.objectStorageService = objectStorageService;
        this.testGenerationRequestProducer = testGenerationRequestProducer;
    }

    public Page<AssignmentDTO> listAssignments(int page, int size) {
        return assignmentRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(page, size))
                .map(AssignmentMapper::toDTO);
    }

    public AssignmentDTO getAssignmentById(UUID id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found: " + id));
        return AssignmentMapper.toDTO(assignment);
    }

    @Transactional(readOnly = true)
    public List<String> getSampleInputs(UUID assignmentId) {
        assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found: " + assignmentId));

        List<TestCase> sampleCases = testCaseRepository.findByAssignmentIdAndIsSample(assignmentId, true);

        List<String> inputs = new ArrayList<>();
        for (TestCase tc : sampleCases) {
            String inputKey = ObjectKeyBuilder.testCaseInput(assignmentId, tc.getId());
            try {
                InputStream stream = objectStorageService.download(inputKey);
                String content = new String(stream.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                inputs.add(content);
            } catch (Exception e) {
                logger.warn("Failed to read sample input for testCase={}: {}", tc.getId(), e.getMessage());
                inputs.add("");
            }
        }
        return inputs;
    }

    @Transactional
    public AssignmentDTO createAssignment(CreateAssignmentRequest request,
                                          MultipartFile referenceSolutionFile,
                                          List<MultipartFile> testCaseInputFiles) {
        // Persist the assignment as inactive until output generation completes
        Assignment assignment = new Assignment(
                request.getTitle(),
                request.getDescription(),
                request.getTimeLimitMs(),
                request.getMemoryLimitMb(),
                request.getComparatorType()
        );
        assignment.setConstraints(request.getConstraints() != null ? request.getConstraints() : new ArrayList<>());
        assignment.setHints(request.getHints() != null ? request.getHints() : new ArrayList<>());
        assignment.setTags(request.getTags() != null ? request.getTags() : new ArrayList<>());
        assignment.setAllowedLanguages(request.getAllowedLanguages());
        assignment.setDueDate(request.getDueDate());
        assignment.setIsActive(false);

        assignment = assignmentRepository.save(assignment);
        logger.info("Assignment created: id={}, title={}", assignment.getId(), assignment.getTitle());

        // Persist reference solution metadata
        ReferenceSolution referenceSolution = new ReferenceSolution(assignment, request.getReferenceLanguage());
        referenceSolution = referenceSolutionRepository.save(referenceSolution);
        logger.info("ReferenceSolution created: id={}, language={}", referenceSolution.getId(), referenceSolution.getLanguage());

        // Upload reference solution file to MinIO
        String refExtension = FileExtensionUtil.getFileExtensionByLanguage(request.getReferenceLanguage());
        String refPath = ObjectKeyBuilder.referenceSolutionSourceCode(assignment.getId(), refExtension);
        uploadMultipartFile(refPath, referenceSolutionFile);
        logger.info("Reference solution uploaded: path={}", refPath);

        // Persist test cases and upload inputs; build job payload
        List<TestCaseInfo> testCaseInfos = new ArrayList<>();
        for (int i = 0; i < testCaseInputFiles.size(); i++) {
            boolean isSample = request.getSampleFlags() != null
                    && i < request.getSampleFlags().size()
                    && Boolean.TRUE.equals(request.getSampleFlags().get(i));

            TestCase testCase = new TestCase(assignment, i + 1, isSample);
            testCase = testCaseRepository.save(testCase);
            logger.info("TestCase created: id={}, order={}, isSample={}", testCase.getId(), testCase.getOrder(), testCase.getIsSample());

            String inputPath = ObjectKeyBuilder.testCaseInput(assignment.getId(), testCase.getId());
            String outputPath = ObjectKeyBuilder.testCaseOutput(assignment.getId(), testCase.getId());

            uploadMultipartFile(inputPath, testCaseInputFiles.get(i));
            logger.info("Test case input uploaded: path={}", inputPath);

            testCaseInfos.add(new TestCaseInfo(testCase.getId(), inputPath, outputPath));
        }

        // Publish test generation job
        TestGenerationJob job = new TestGenerationJob(
                assignment.getId(),
                refPath,
                request.getReferenceLanguage(),
                testCaseInfos,
                request.getTimeLimitMs(),
                request.getMemoryLimitMb()
        );
        testGenerationRequestProducer.sendTestGenerationRequest(job);
        logger.info("Test generation job published for assignmentId={}", assignment.getId());

        return AssignmentMapper.toDTO(assignment);
    }

    private void uploadMultipartFile(String path, MultipartFile file) {
        try {
            objectStorageService.upload(path, new String(file.getBytes()));
        } catch (IOException e) {
            throw new RuntimeException("Failed to read uploaded file: " + file.getOriginalFilename(), e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload file to object storage: " + path, e);
        }
    }
}
