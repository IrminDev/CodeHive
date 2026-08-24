package com.github.codehive.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.github.codehive.messaging.producer.TestGenerationRequestProducer;
import com.github.codehive.model.dto.AssignmentDTO;
import com.github.codehive.model.dto.AssignmentExampleDTO;
import com.github.codehive.model.dto.CloneAssignmentFormDTO;
import com.github.codehive.model.dto.CloneAssignmentTestCaseDTO;
import com.github.codehive.model.dto.AssignmentPreviewDTO;
import com.github.codehive.model.dto.AssignmentPreviewTestCaseDTO;
import com.github.codehive.model.dto.SampleTestCaseDTO;
import com.github.codehive.model.dto.queue.TestCaseInfo;
import com.github.codehive.model.dto.queue.TestGenerationJob;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentExample;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.ReferenceSolutionRevision;
import com.github.codehive.model.entity.TestCase;
import com.github.codehive.model.entity.TestSuiteRevision;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.model.mapper.AssignmentMapper;
import com.github.codehive.model.request.assignment.AssignmentExampleRequest;
import com.github.codehive.model.request.assignment.AssignmentLimits;
import com.github.codehive.model.request.assignment.CloneAssignmentRequest;
import com.github.codehive.model.request.assignment.CloneTestCaseRequest;
import com.github.codehive.model.request.assignment.CreateAssignmentRequest;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.ReferenceSolutionRevisionRepository;
import com.github.codehive.repository.TestCaseRepository;
import com.github.codehive.repository.TestSuiteRevisionRepository;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.utils.FileExtensionUtil;
import com.github.codehive.utils.ObjectKeyBuilder;

@Service
public class AssignmentService {
    private static final Logger logger = LoggerFactory.getLogger(AssignmentService.class);

    private final AssignmentRepository assignmentRepository;
    private final TestCaseRepository testCaseRepository;
    private final ReferenceSolutionRevisionRepository referenceSolutionRevisionRepository;
    private final TestSuiteRevisionRepository testSuiteRevisionRepository;
    private final ObjectStorageService objectStorageService;
    private final TestGenerationRequestProducer testGenerationRequestProducer;
    private final UserRepository userRepository;
    private final GroupEnrollmentRepository enrollmentRepository;
    private final GroupService groupService;

    public AssignmentService(AssignmentRepository assignmentRepository, TestCaseRepository testCaseRepository,
                             ReferenceSolutionRevisionRepository referenceSolutionRevisionRepository,
                             TestSuiteRevisionRepository testSuiteRevisionRepository,
                             ObjectStorageService objectStorageService,
                             TestGenerationRequestProducer testGenerationRequestProducer,
                             UserRepository userRepository, GroupEnrollmentRepository enrollmentRepository,
                             GroupService groupService) {
        this.assignmentRepository = assignmentRepository;
        this.testCaseRepository = testCaseRepository;
        this.referenceSolutionRevisionRepository = referenceSolutionRevisionRepository;
        this.testSuiteRevisionRepository = testSuiteRevisionRepository;
        this.objectStorageService = objectStorageService;
        this.testGenerationRequestProducer = testGenerationRequestProducer;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.groupService = groupService;
    }

    @Transactional(readOnly = true)
    public Page<AssignmentDTO> listGroupAssignments(UUID groupId, int page, int size, String email) {
        return listGroupAssignments(groupId, page, size, email, false, false, null, null);
    }

    @Transactional(readOnly = true)
    public Page<AssignmentDTO> listGroupAssignments(
            UUID groupId, int page, int size, String email,
            boolean includeDeleted, boolean deletedOnly, String query,
            AssignmentValidationStatus validationStatus) {
        User user = requireUser(email);
        ClassGroup group = groupService.getGroupForAssignmentAccess(groupId, user);
        if (group.getOwner().getId().equals(user.getId())) {
            // Keep this parameter non-null. PostgreSQL otherwise infers a nullable value used by
            // lower(:query) as bytea and rejects it with "function lower(bytea) does not exist".
            String normalizedQuery = query == null || query.isBlank() ? "" : query.trim();
            return assignmentRepository.findTeacherManaged(
                    groupId, includeDeleted || deletedOnly, deletedOnly, normalizedQuery,
                    validationStatus, PageRequest.of(page, size)).map(AssignmentMapper::toDTO);
        }
        return assignmentRepository.findStudentVisible(groupId, AssignmentValidationStatus.READY,
                Instant.now(), PageRequest.of(page, size)).map(AssignmentMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public AssignmentDTO getAssignmentById(UUID id, String email) {
        Assignment assignment = requireAssignment(id);
        User user = requireUser(email);
        authorizeRead(assignment, user);
        AssignmentDTO dto = AssignmentMapper.toDTO(assignment);

        TestSuiteRevision testSuiteRevision = resolveCurrentTestSuiteRevision(assignment);
        List<TestCase> sampleEntities = testCaseRepository.findByTestSuiteRevisionIdAndIsSampleOrderByOrderAsc(
                testSuiteRevision.getId(), true);
        List<TestCase> samples = sampleEntities.stream()
                .sorted(Comparator.comparing(TestCase::getOrder)).toList();
        List<SampleTestCaseDTO> sampleDTOs = new ArrayList<>();
        for (TestCase tc : samples) {
            String inputKey = ObjectKeyBuilder.testCaseInput(
                    id, testSuiteRevision.getId(), tc.getId());
            try (InputStream stream = objectStorageService.download(inputKey)) {
                sampleDTOs.add(new SampleTestCaseDTO(tc.getOrder(),
                        new String(stream.readAllBytes(), StandardCharsets.UTF_8)));
            } catch (Exception exception) {
                logger.warn("Failed to fetch sample input: tcId={}", tc.getId(), exception);
            }
        }
        dto.setSampleTestCases(sampleDTOs);
        return dto;
    }

    @Transactional
    public AssignmentDTO createAssignment(CreateAssignmentRequest request, MultipartFile referenceSolutionFile,
                                          List<MultipartFile> testCaseInputFiles, String email) {
        User author = requireUser(email);
        ClassGroup group = groupService.requireOwnedWritableGroup(request.getGroupId(), author);
        validateDates(request.getLaunchDate(), request.getDueDate(), request.getCloseDate());
        if (testCaseInputFiles == null || testCaseInputFiles.isEmpty()) {
            throw new ValidationException("At least one test case input is required");
        }
        validateLimits(request.getTimeLimitMs(), request.getMemoryLimitMb(), testCaseInputFiles.size());

        Assignment assignment = baseAssignment(request, group, author);
        addExamples(assignment, request.getExamples());
        assignment = assignmentRepository.save(assignment);

        ReferenceSolutionRevision referenceRevision = new ReferenceSolutionRevision();
        referenceRevision.setAssignment(assignment);
        referenceRevision.setLanguage(request.getReferenceLanguage());
        referenceRevision.setObjectKey("pending");
        referenceRevision = referenceSolutionRevisionRepository.save(referenceRevision);
        String extension = FileExtensionUtil.getFileExtensionByLanguage(request.getReferenceLanguage());
        String referencePath = ObjectKeyBuilder.referenceSolutionSourceCode(
                assignment.getId(), referenceRevision.getId(), extension);
        referenceRevision.setObjectKey(referencePath);
        uploadMultipartFile(referencePath, referenceSolutionFile);

        TestSuiteRevision testSuiteRevision = new TestSuiteRevision();
        testSuiteRevision.setAssignment(assignment);
        testSuiteRevision.setReferenceSolutionRevision(referenceRevision);
        testSuiteRevision.setRevisionNumber(1);
        testSuiteRevision = testSuiteRevisionRepository.save(testSuiteRevision);

        List<TestCaseInfo> testCaseInfos = persistTestCases(
                assignment, testSuiteRevision, testCaseInputFiles, request.getSampleFlags());
        publishGeneration(assignment, testSuiteRevision, referenceRevision, testCaseInfos, null);
        return AssignmentMapper.toDTO(assignment);
    }

    @Transactional
    public AssignmentDTO cloneAssignment(UUID sourceId, CloneAssignmentRequest request, String email) {
        User teacher = requireUser(email);
        Assignment source = requireAssignment(sourceId);
        if (!teacher.canManageGroups() || !source.getGroup().getOwner().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("Only the source assignment owner can clone it");
        }
        ClassGroup target = groupService.requireOwnedWritableGroup(request.getTargetGroupId(), teacher);
        if (source.getGroup().getId().equals(target.getId())) {
            throw new ValidationException("Target group must be different from the source group");
        }
        validateDates(request.getLaunchDate(), request.getDueDate(), request.getCloseDate());
        validateLimits(request.getTimeLimitMs(), request.getMemoryLimitMb(), request.getTestCases().size());

        Assignment clone = new Assignment(request.getTitle(), request.getDescription(), request.getTimeLimitMs(),
                request.getMemoryLimitMb(), request.getComparatorType());
        clone.setGroup(target);
        clone.setAuthor(teacher);
        clone.setConstraints(request.getConstraints());
        clone.setHints(request.getHints());
        clone.setTags(request.getTags());
        clone.setAllowedLanguages(request.getAllowedLanguages());
        clone.setLaunchDate(request.getLaunchDate());
        clone.setDueDate(request.getDueDate());
        clone.setCloseDate(request.getCloseDate());
        clone.setMaxPoints(request.getMaxPoints() != null
                ? request.getMaxPoints() : new java.math.BigDecimal("100.00"));
        clone.setValidationStatus(AssignmentValidationStatus.PROCESSING);
        addExamples(clone, request.getExamples());
        clone = assignmentRepository.save(clone);

        ReferenceSolutionRevision cloneReferenceRevision = new ReferenceSolutionRevision();
        cloneReferenceRevision.setAssignment(clone);
        cloneReferenceRevision.setLanguage(request.getReferenceLanguage());
        cloneReferenceRevision.setObjectKey("pending");
        cloneReferenceRevision = referenceSolutionRevisionRepository.save(cloneReferenceRevision);
        String extension = FileExtensionUtil.getFileExtensionByLanguage(request.getReferenceLanguage());
        String cloneReferencePath = ObjectKeyBuilder.referenceSolutionSourceCode(
                clone.getId(), cloneReferenceRevision.getId(), extension);
        cloneReferenceRevision.setObjectKey(cloneReferencePath);
        uploadTextObject(cloneReferencePath, request.getReferenceSolution());

        TestSuiteRevision cloneTestSuiteRevision = new TestSuiteRevision();
        cloneTestSuiteRevision.setAssignment(clone);
        cloneTestSuiteRevision.setReferenceSolutionRevision(cloneReferenceRevision);
        cloneTestSuiteRevision.setRevisionNumber(1);
        cloneTestSuiteRevision = testSuiteRevisionRepository.save(cloneTestSuiteRevision);

        List<TestCaseInfo> infos = new ArrayList<>();
        for (int index = 0; index < request.getTestCases().size(); index++) {
            CloneTestCaseRequest requestedCase = request.getTestCases().get(index);
            TestCase clonedCase = testCaseRepository.save(new TestCase(
                    clone, cloneTestSuiteRevision, index + 1,
                    Boolean.TRUE.equals(requestedCase.getSample())));
            String input = ObjectKeyBuilder.testCaseInput(
                    clone.getId(), cloneTestSuiteRevision.getId(), clonedCase.getId());
            String output = ObjectKeyBuilder.testCaseExpectedOutput(
                    clone.getId(), cloneTestSuiteRevision.getId(), clonedCase.getId());
            uploadTextObject(input, requestedCase.getInput());
            infos.add(new TestCaseInfo(clonedCase.getId(), input, output));
        }
        publishGeneration(clone, cloneTestSuiteRevision, cloneReferenceRevision, infos, null);
        return AssignmentMapper.toDTO(clone);
    }

    @Transactional(readOnly = true)
    public CloneAssignmentFormDTO getCloneForm(UUID sourceId, String email) {
        User teacher = requireUser(email);
        Assignment source = requireAssignment(sourceId);
        if (!teacher.canManageGroups() || !source.getGroup().getOwner().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("Only the source assignment owner can clone it");
        }

        ReferenceSolutionRevision sourceReference = source.getActiveReferenceSolutionRevision() != null
                ? source.getActiveReferenceSolutionRevision()
                : referenceSolutionRevisionRepository.findByAssignmentIdOrderByCreatedAtDesc(sourceId).stream()
                        .findFirst()
                        .orElseThrow(() -> new EntityNotFoundException(
                                "Source assignment has no reference solution revision"));
        var referenceLanguage = sourceReference.getLanguage();
        String referencePath = sourceReference.getObjectKey();

        TestSuiteRevision sourceTestSuite = resolveCurrentTestSuiteRevision(source);
        List<TestCase> sourceCases = testCaseRepository.findByTestSuiteRevisionIdOrderByOrderAsc(
                sourceTestSuite.getId());
        List<CloneAssignmentTestCaseDTO> testCases = new ArrayList<>();
        for (TestCase sourceCase : sourceCases) {
            String inputPath = ObjectKeyBuilder.testCaseInput(
                    sourceId, sourceTestSuite.getId(), sourceCase.getId());
            testCases.add(new CloneAssignmentTestCaseDTO(
                    sourceCase.getOrder(), readTextObject(inputPath), sourceCase.getIsSample()));
        }

        List<AssignmentExampleDTO> examples = AssignmentMapper.toDTO(source).getExamples().stream()
                .sorted(Comparator.comparing(AssignmentExampleDTO::getOrder))
                .toList();
        return new CloneAssignmentFormDTO(
                source.getGroup().getId(),
                source.getTitle(),
                source.getDescription(),
                source.getConstraints(),
                source.getHints(),
                source.getTags(),
                source.getTimeLimitMs(),
                source.getMemoryLimitMb(),
                source.getComparatorType(),
                source.getAllowedLanguages(),
                referenceLanguage,
                readTextObject(referencePath),
                examples,
                testCases,
                source.getMaxPoints());
    }

    @Transactional(readOnly = true)
    public AssignmentPreviewDTO getTeacherPreview(UUID assignmentId, String email) {
        User teacher = requireUser(email);
        Assignment assignment = requireAssignment(assignmentId);
        if (!teacher.canManageGroups() || !assignment.getGroup().getOwner().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("Only the assignment owner can preview it");
        }

        ReferenceSolutionRevision reference = assignment.getActiveReferenceSolutionRevision() != null
                ? assignment.getActiveReferenceSolutionRevision()
                : referenceSolutionRevisionRepository.findByAssignmentIdOrderByCreatedAtDesc(assignmentId).stream()
                        .findFirst()
                        .orElseThrow(() -> new EntityNotFoundException(
                                "Assignment has no reference solution revision"));
        TestSuiteRevision testSuite = resolveCurrentTestSuiteRevision(assignment);
        boolean outputsReady = assignment.getValidationStatus() == AssignmentValidationStatus.READY;
        List<AssignmentPreviewTestCaseDTO> testCases = new ArrayList<>();
        for (TestCase testCase : testCaseRepository.findByTestSuiteRevisionIdOrderByOrderAsc(testSuite.getId())) {
            String inputPath = ObjectKeyBuilder.testCaseInput(assignmentId, testSuite.getId(), testCase.getId());
            String expectedOutput = outputsReady
                    ? readTextObject(ObjectKeyBuilder.testCaseExpectedOutput(assignmentId, testSuite.getId(), testCase.getId()))
                    : null;
            testCases.add(new AssignmentPreviewTestCaseDTO(
                    testCase.getOrder(), readTextObject(inputPath), expectedOutput, testCase.getIsSample()));
        }
        return new AssignmentPreviewDTO(
                AssignmentMapper.toDTO(assignment), reference.getLanguage(),
                readTextObject(reference.getObjectKey()), testCases);
    }

    @Transactional
    public void softDelete(UUID id, String email) {
        User teacher = requireUser(email);
        Assignment assignment = requireAssignment(id);
        if (!teacher.canManageGroups() || !assignment.getGroup().getOwner().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("Only the group owner can delete this assignment");
        }
        assignment.setIsActive(false);
        if (assignment.getDeletedAt() == null) assignment.setDeletedAt(Instant.now());
    }

    @Transactional
    public AssignmentDTO restore(UUID id, String email) {
        User teacher = requireUser(email);
        Assignment assignment = requireAssignment(id);
        groupService.requireOwnedWritableGroup(assignment.getGroup().getId(), teacher);
        if (Boolean.TRUE.equals(assignment.getIsActive())) return AssignmentMapper.toDTO(assignment);
        assignment.setIsActive(true);
        assignment.setDeletedAt(null);
        assignment.setUpdatedAt(java.time.LocalDateTime.now());
        return AssignmentMapper.toDTO(assignmentRepository.save(assignment));
    }

    private Assignment baseAssignment(CreateAssignmentRequest request, ClassGroup group, User author) {
        Assignment assignment = new Assignment(request.getTitle(), request.getDescription(), request.getTimeLimitMs(),
                request.getMemoryLimitMb(), request.getComparatorType());
        assignment.setGroup(group);
        assignment.setAuthor(author);
        assignment.setConstraints(request.getConstraints() != null ? request.getConstraints() : new ArrayList<>());
        assignment.setHints(request.getHints() != null ? request.getHints() : new ArrayList<>());
        assignment.setTags(request.getTags() != null ? request.getTags() : new ArrayList<>());
        assignment.setAllowedLanguages(request.getAllowedLanguages());
        assignment.setLaunchDate(request.getLaunchDate());
        assignment.setDueDate(request.getDueDate());
        assignment.setCloseDate(request.getCloseDate());
        assignment.setIsActive(true);
        assignment.setValidationStatus(AssignmentValidationStatus.PROCESSING);
        assignment.setMaxPoints(request.getMaxPoints() != null
                ? request.getMaxPoints() : new java.math.BigDecimal("100.00"));
        return assignment;
    }

    private void addExamples(Assignment assignment, List<AssignmentExampleRequest> examples) {
        if (examples == null) return;
        for (int index = 0; index < examples.size(); index++) {
            AssignmentExampleRequest example = examples.get(index);
            assignment.addExample(new AssignmentExample(assignment, index + 1, example.getInput(),
                    example.getOutput(), example.getExplanation()));
        }
    }

    private List<TestCaseInfo> persistTestCases(Assignment assignment, TestSuiteRevision revision,
                                                List<MultipartFile> files,
                                                List<Boolean> sampleFlags) {
        List<TestCaseInfo> infos = new ArrayList<>();
        for (int index = 0; index < files.size(); index++) {
            boolean sample = sampleFlags != null && index < sampleFlags.size()
                    && Boolean.TRUE.equals(sampleFlags.get(index));
            TestCase testCase = testCaseRepository.save(
                    new TestCase(assignment, revision, index + 1, sample));
            String inputPath = ObjectKeyBuilder.testCaseInput(
                    assignment.getId(), revision.getId(), testCase.getId());
            String outputPath = ObjectKeyBuilder.testCaseExpectedOutput(
                    assignment.getId(), revision.getId(), testCase.getId());
            uploadMultipartFile(inputPath, files.get(index));
            infos.add(new TestCaseInfo(testCase.getId(), inputPath, outputPath));
        }
        return infos;
    }

    private void publishGeneration(Assignment assignment, TestSuiteRevision testSuiteRevision,
                                   ReferenceSolutionRevision referenceRevision,
                                   List<TestCaseInfo> infos, UUID assignmentUpdateId) {
        TestGenerationJob job = new TestGenerationJob(assignment.getId(),
                referenceRevision.getObjectKey(), referenceRevision.getLanguage(), infos,
                assignment.getTimeLimitMs(), assignment.getMemoryLimitMb());
        job.setAssignmentUpdateId(assignmentUpdateId);
        job.setTestSuiteRevisionId(testSuiteRevision != null ? testSuiteRevision.getId() : null);
        job.setReferenceSolutionRevisionId(referenceRevision.getId());
        job.setComparatorType(assignment.getComparatorType());
        testGenerationRequestProducer.sendTestGenerationRequest(job);
    }

    private TestSuiteRevision resolveCurrentTestSuiteRevision(Assignment assignment) {
        if (assignment.getActiveTestSuiteRevision() != null) {
            return assignment.getActiveTestSuiteRevision();
        }
        return testSuiteRevisionRepository.findTopByAssignmentIdOrderByRevisionNumberDesc(assignment.getId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Assignment has no test suite revision: " + assignment.getId()));
    }

    private void authorizeRead(Assignment assignment, User user) {
        boolean owner = assignment.getGroup().getOwner().getId().equals(user.getId());
        if (owner) return;
        boolean enrolled = enrollmentRepository.existsByGroupIdAndStudentIdAndStatus(
                assignment.getGroup().getId(), user.getId(), EnrollmentStatus.ACTIVE);
        if (!enrolled || !isStudentVisible(assignment, Instant.now())) {
            throw new EntityNotFoundException("Assignment not found: " + assignment.getId());
        }
    }

    private boolean isStudentVisible(Assignment assignment, Instant now) {
        return Boolean.TRUE.equals(assignment.getIsActive())
                && Boolean.TRUE.equals(assignment.getGroup().getIsActive())
                && assignment.getValidationStatus() == AssignmentValidationStatus.READY
                && (assignment.getLaunchDate() == null || !now.isBefore(assignment.getLaunchDate()));
    }

    private void validateDates(Instant launch, Instant due, Instant close) {
        Instant now = Instant.now();
        if (launch != null && launch.isBefore(now)) {
            throw new ValidationException("Launch date cannot be before the current time");
        }
        if (due != null && due.isBefore(now)) {
            throw new ValidationException("Due date cannot be before the current time");
        }
        if (close != null && close.isBefore(now)) {
            throw new ValidationException("Close date cannot be before the current time");
        }
        if (launch != null && due != null && launch.isAfter(due)) {
            throw new ValidationException("Launch date must be before or equal to due date");
        }
        if (due != null && close != null && due.isAfter(close)) {
            throw new ValidationException("Due date must be before or equal to close date");
        }
        if (launch != null && close != null && launch.isAfter(close)) {
            throw new ValidationException("Launch date must be before or equal to close date");
        }
    }

    private void validateLimits(Long timeLimitMs, Long memoryLimitMb, int testCaseCount) {
        if (timeLimitMs == null || timeLimitMs < AssignmentLimits.MIN_TIME_LIMIT_MS
                || timeLimitMs > AssignmentLimits.MAX_TIME_LIMIT_MS) {
            throw new ValidationException("Time limit must be between 100 and 10000ms");
        }
        if (memoryLimitMb == null || memoryLimitMb < AssignmentLimits.MIN_MEMORY_LIMIT_MB
                || memoryLimitMb > AssignmentLimits.MAX_MEMORY_LIMIT_MB) {
            throw new ValidationException("Memory limit must be between 16 and 1000MB");
        }
        if (testCaseCount > AssignmentLimits.MAX_TEST_CASES) {
            throw new ValidationException("At most 50 test cases are allowed");
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

    private void uploadMultipartFile(String path, MultipartFile file) {
        try {
            objectStorageService.upload(path, new String(file.getBytes(), StandardCharsets.UTF_8));
        } catch (IOException exception) {
            throw new RuntimeException("Failed to read uploaded file: " + file.getOriginalFilename(), exception);
        } catch (Exception exception) {
            throw new RuntimeException("Failed to upload file to object storage: " + path, exception);
        }
    }

    private String readTextObject(String path) {
        try (InputStream stream = objectStorageService.download(path)) {
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception exception) {
            throw new RuntimeException("Failed to read object from storage: " + path, exception);
        }
    }

    private void uploadTextObject(String path, String content) {
        try {
            objectStorageService.upload(path, content);
        } catch (Exception exception) {
            throw new RuntimeException("Failed to upload object to storage: " + path, exception);
        }
    }
}
