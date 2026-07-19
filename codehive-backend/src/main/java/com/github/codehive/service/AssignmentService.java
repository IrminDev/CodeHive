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
import com.github.codehive.model.dto.SampleTestCaseDTO;
import com.github.codehive.model.dto.queue.TestCaseInfo;
import com.github.codehive.model.dto.queue.TestGenerationJob;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentExample;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.ReferenceSolution;
import com.github.codehive.model.entity.TestCase;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.ValidationException;
import com.github.codehive.model.mapper.AssignmentMapper;
import com.github.codehive.model.request.assignment.AssignmentExampleRequest;
import com.github.codehive.model.request.assignment.CloneAssignmentRequest;
import com.github.codehive.model.request.assignment.CreateAssignmentRequest;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.ReferenceSolutionRepository;
import com.github.codehive.repository.TestCaseRepository;
import com.github.codehive.repository.UserRepository;
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
    private final UserRepository userRepository;
    private final GroupEnrollmentRepository enrollmentRepository;
    private final GroupService groupService;

    public AssignmentService(AssignmentRepository assignmentRepository, TestCaseRepository testCaseRepository,
                             ReferenceSolutionRepository referenceSolutionRepository,
                             ObjectStorageService objectStorageService,
                             TestGenerationRequestProducer testGenerationRequestProducer,
                             UserRepository userRepository, GroupEnrollmentRepository enrollmentRepository,
                             GroupService groupService) {
        this.assignmentRepository = assignmentRepository;
        this.testCaseRepository = testCaseRepository;
        this.referenceSolutionRepository = referenceSolutionRepository;
        this.objectStorageService = objectStorageService;
        this.testGenerationRequestProducer = testGenerationRequestProducer;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.groupService = groupService;
    }

    @Transactional(readOnly = true)
    public Page<AssignmentDTO> listGroupAssignments(UUID groupId, int page, int size, String email) {
        User user = requireUser(email);
        ClassGroup group = groupService.getGroupForAssignmentAccess(groupId, user);
        if (group.getOwner().getId().equals(user.getId())) {
            return assignmentRepository.findByGroupIdAndIsActiveTrueOrderByCreatedAtDesc(
                    groupId, PageRequest.of(page, size)).map(AssignmentMapper::toDTO);
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

        List<TestCase> samples = testCaseRepository.findByAssignmentIdAndIsSample(id, true).stream()
                .sorted(Comparator.comparing(TestCase::getOrder)).toList();
        List<SampleTestCaseDTO> sampleDTOs = new ArrayList<>();
        for (TestCase tc : samples) {
            try (InputStream stream = objectStorageService.download(ObjectKeyBuilder.testCaseInput(id, tc.getId()))) {
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
        User author = requireTeacher(email);
        ClassGroup group = groupService.requireOwnedWritableGroup(request.getGroupId(), author);
        validateDates(request.getLaunchDate(), request.getDueDate(), request.getCloseDate());
        if (testCaseInputFiles == null || testCaseInputFiles.isEmpty()) {
            throw new ValidationException("At least one test case input is required");
        }

        Assignment assignment = baseAssignment(request, group, author);
        addExamples(assignment, request.getExamples());
        assignment = assignmentRepository.save(assignment);

        ReferenceSolution reference = referenceSolutionRepository.save(
                new ReferenceSolution(assignment, request.getReferenceLanguage()));
        String extension = FileExtensionUtil.getFileExtensionByLanguage(reference.getLanguage());
        String referencePath = ObjectKeyBuilder.referenceSolutionSourceCode(assignment.getId(), extension);
        uploadMultipartFile(referencePath, referenceSolutionFile);

        List<TestCaseInfo> testCaseInfos = persistTestCases(assignment, testCaseInputFiles, request.getSampleFlags());
        publishGeneration(assignment, referencePath, reference.getLanguage(), testCaseInfos);
        return AssignmentMapper.toDTO(assignment);
    }

    @Transactional
    public AssignmentDTO cloneAssignment(UUID sourceId, CloneAssignmentRequest request, String email) {
        User teacher = requireTeacher(email);
        Assignment source = requireAssignment(sourceId);
        if (!source.getGroup().getOwner().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("Only the source assignment owner can clone it");
        }
        ClassGroup target = groupService.requireOwnedWritableGroup(request.getTargetGroupId(), teacher);
        if (source.getGroup().getId().equals(target.getId())) {
            throw new ValidationException("Target group must be different from the source group");
        }
        validateDates(request.getLaunchDate(), request.getDueDate(), request.getCloseDate());

        Assignment clone = new Assignment(source.getTitle(), source.getDescription(), source.getTimeLimitMs(),
                source.getMemoryLimitMb(), source.getComparatorType());
        clone.setGroup(target);
        clone.setAuthor(teacher);
        clone.setConstraints(new ArrayList<>(source.getConstraints()));
        clone.setHints(new ArrayList<>(source.getHints()));
        clone.setTags(new ArrayList<>(source.getTags()));
        clone.setAllowedLanguages(new ArrayList<>(source.getAllowedLanguages()));
        clone.setLaunchDate(request.getLaunchDate());
        clone.setDueDate(request.getDueDate());
        clone.setCloseDate(request.getCloseDate());
        clone.setValidationStatus(AssignmentValidationStatus.PROCESSING);
        List<AssignmentExample> sourceExamples = source.getExamples().stream()
                .sorted(Comparator.comparing(AssignmentExample::getOrder)).toList();
        for (AssignmentExample example : sourceExamples) {
            clone.addExample(new AssignmentExample(clone, example.getOrder(), example.getInput(),
                    example.getOutput(), example.getExplanation()));
        }
        clone = assignmentRepository.save(clone);

        ReferenceSolution sourceReference = referenceSolutionRepository.findByAssignmentId(sourceId).stream().findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Source assignment has no reference solution"));
        referenceSolutionRepository.save(new ReferenceSolution(clone, sourceReference.getLanguage()));
        String extension = FileExtensionUtil.getFileExtensionByLanguage(sourceReference.getLanguage());
        String sourceReferencePath = ObjectKeyBuilder.referenceSolutionSourceCode(sourceId, extension);
        String cloneReferencePath = ObjectKeyBuilder.referenceSolutionSourceCode(clone.getId(), extension);
        copyTextObject(sourceReferencePath, cloneReferencePath);

        List<TestCaseInfo> infos = new ArrayList<>();
        for (TestCase sourceCase : testCaseRepository.findByAssignmentIdOrderByOrderAsc(sourceId)) {
            TestCase clonedCase = testCaseRepository.save(
                    new TestCase(clone, sourceCase.getOrder(), sourceCase.getIsSample()));
            String input = ObjectKeyBuilder.testCaseInput(clone.getId(), clonedCase.getId());
            String output = ObjectKeyBuilder.testCaseOutput(clone.getId(), clonedCase.getId());
            copyTextObject(ObjectKeyBuilder.testCaseInput(sourceId, sourceCase.getId()), input);
            infos.add(new TestCaseInfo(clonedCase.getId(), input, output));
        }
        publishGeneration(clone, cloneReferencePath, sourceReference.getLanguage(), infos);
        return AssignmentMapper.toDTO(clone);
    }

    @Transactional
    public void softDelete(UUID id, String email) {
        User teacher = requireTeacher(email);
        Assignment assignment = requireAssignment(id);
        if (!assignment.getGroup().getOwner().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("Only the group owner can delete this assignment");
        }
        assignment.setIsActive(false);
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

    private List<TestCaseInfo> persistTestCases(Assignment assignment, List<MultipartFile> files,
                                                List<Boolean> sampleFlags) {
        List<TestCaseInfo> infos = new ArrayList<>();
        for (int index = 0; index < files.size(); index++) {
            boolean sample = sampleFlags != null && index < sampleFlags.size()
                    && Boolean.TRUE.equals(sampleFlags.get(index));
            TestCase testCase = testCaseRepository.save(new TestCase(assignment, index + 1, sample));
            String inputPath = ObjectKeyBuilder.testCaseInput(assignment.getId(), testCase.getId());
            String outputPath = ObjectKeyBuilder.testCaseOutput(assignment.getId(), testCase.getId());
            uploadMultipartFile(inputPath, files.get(index));
            infos.add(new TestCaseInfo(testCase.getId(), inputPath, outputPath));
        }
        return infos;
    }

    private void publishGeneration(Assignment assignment, String referencePath,
                                   com.github.codehive.model.enums.Language referenceLanguage,
                                   List<TestCaseInfo> infos) {
        testGenerationRequestProducer.sendTestGenerationRequest(new TestGenerationJob(assignment.getId(),
                referencePath, referenceLanguage, infos, assignment.getTimeLimitMs(), assignment.getMemoryLimitMb()));
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

    private Assignment requireAssignment(UUID id) {
        return assignmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Assignment not found: " + id));
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user not found"));
    }

    private User requireTeacher(String email) {
        User user = requireUser(email);
        if (user.getRole() != Role.TEACHER) throw new AccessDeniedException("Only teachers can manage assignments");
        return user;
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

    private void copyTextObject(String source, String target) {
        try (InputStream stream = objectStorageService.download(source)) {
            objectStorageService.upload(target, new String(stream.readAllBytes(), StandardCharsets.UTF_8));
        } catch (Exception exception) {
            throw new RuntimeException("Failed to clone object: " + source, exception);
        }
    }
}
