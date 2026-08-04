package com.github.codehive.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.codehive.config.TestAsyncConfig;
import com.github.codehive.messaging.producer.TestGenerationRequestProducer;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.AssignmentExample;
import com.github.codehive.model.entity.ReferenceSolutionRevision;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.TestCase;
import com.github.codehive.model.entity.TestSuiteRevision;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.request.assignment.CreateAssignmentRequest;
import com.github.codehive.model.request.assignment.AssignmentExampleRequest;
import com.github.codehive.model.request.assignment.CloneAssignmentRequest;
import com.github.codehive.model.request.assignment.CloneTestCaseRequest;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.ReferenceSolutionRevisionRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.TestCaseRepository;
import com.github.codehive.repository.TestSuiteRevisionRepository;
import com.github.codehive.service.ObjectStorageService;
import com.github.codehive.utils.JwtUtil;
import java.util.List;
import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
@Import(TestAsyncConfig.class)
@DisplayName("AssignmentController Integration")
class AssignmentControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private AssignmentRepository assignmentRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ClassGroupRepository groupRepository;
    @Autowired private ReferenceSolutionRevisionRepository referenceSolutionRevisionRepository;
    @Autowired private SubmissionRepository submissionRepository;
    @Autowired private TestCaseRepository testCaseRepository;
    @Autowired private TestSuiteRevisionRepository testSuiteRevisionRepository;
    @Autowired private EntityManager entityManager;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    @MockitoBean private ObjectStorageService objectStorageService;
    @MockitoBean private TestGenerationRequestProducer testGenerationRequestProducer;

    private String teacherToken;
    private String studentToken;
    private User teacher;
    private User student;
    private ClassGroup group;

    @BeforeEach
    void setUp() throws Exception {
        userRepository.deleteAll();
        userRepository.flush();

        teacher = new User();
        teacher.setEmail("teacher@test.com");
        teacher.setPassword(passwordEncoder.encode("Pass123!"));
        teacher.setName("Teacher");
        teacher.setLastName("Last");
        teacher.setEnrollmentNumber("TEACHER-001");
        teacher.setRole(Role.TEACHER);
        teacher.setIsActive(true);
        teacher = userRepository.save(teacher);
        teacherToken = jwtUtil.generateToken(Map.of("role", "TEACHER"), "teacher@test.com");

        student = new User();
        student.setEmail("student@test.com");
        student.setPassword(passwordEncoder.encode("Pass123!"));
        student.setName("Student");
        student.setLastName("Last");
        student.setEnrollmentNumber("STUDENT-001");
        student.setRole(Role.STUDENT);
        student.setIsActive(true);
        userRepository.save(student);
        studentToken = jwtUtil.generateToken(Map.of("role", "STUDENT"), "student@test.com");

        group = groupRepository.save(new ClassGroup("Algorithms", "Core exercises", teacher, "GROUP123"));

        doNothing().when(objectStorageService).upload(anyString(), anyString());
        doNothing().when(testGenerationRequestProducer).sendTestGenerationRequest(any());
    }

    // ── LIST ────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("GET /api/assignments")
    class ListAssignments {

        @Test
        @DisplayName("returns 200 with empty page when no assignments exist")
        void emptyList() throws Exception {
            mockMvc.perform(get("/api/assignments")
                            .param("groupId", group.getId().toString())
                            .header("Authorization", "Bearer " + teacherToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isArray())
                    .andExpect(jsonPath("$.data.totalElements").value(0));
        }

        @Test
        @DisplayName("returns assignments ordered by createdAt desc")
        void returnsSavedAssignments() throws Exception {
            saveAssignment("Alpha");
            saveAssignment("Beta");

            mockMvc.perform(get("/api/assignments")
                            .param("groupId", group.getId().toString())
                            .header("Authorization", "Bearer " + teacherToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.totalElements").value(2))
                    .andExpect(jsonPath("$.data.content[0].title").value("Beta"));
        }

        @Test
        @DisplayName("respects page and size query params")
        void pagination() throws Exception {
            saveAssignment("A");
            saveAssignment("B");
            saveAssignment("C");

            mockMvc.perform(get("/api/assignments").param("page", "1").param("size", "2")
                            .param("groupId", group.getId().toString())
                            .header("Authorization", "Bearer " + teacherToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content.length()").value(1))
                    .andExpect(jsonPath("$.data.totalPages").value(2));
        }
    }

    // ── GET BY ID ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("GET /api/assignments/{id}")
    class GetAssignmentById {

        @Test
        @DisplayName("returns 200 with assignment data")
        void found() throws Exception {
            Assignment a = saveAssignment("FindMe");

            mockMvc.perform(get("/api/assignments/{id}", a.getId())
                            .header("Authorization", "Bearer " + teacherToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.title").value("FindMe"));
        }

        @Test
        @DisplayName("returns 404 for non-existent ID")
        void notFound() throws Exception {
            mockMvc.perform(get("/api/assignments/{id}", UUID.randomUUID())
                            .header("Authorization", "Bearer " + teacherToken))
                    .andExpect(status().isNotFound());
        }
    }

    // ── CREATE ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/assignments")
    class CreateAssignment {

        @Test
        @DisplayName("returns 401 when unauthenticated")
        void unauthenticated() throws Exception {
            mockMvc.perform(multipart("/api/assignments")
                            .file(metadataPart())
                            .file(referenceSolutionPart())
                            .file(testCaseInputPart()))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("returns 403 when authenticated as STUDENT")
        void forbiddenForStudent() throws Exception {
            mockMvc.perform(multipart("/api/assignments")
                            .file(metadataPart())
                            .file(referenceSolutionPart())
                            .file(testCaseInputPart())
                            .header("Authorization", "Bearer " + studentToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("returns 202 and queues job when authenticated as TEACHER")
        void teacherCanCreate() throws Exception {
            mockMvc.perform(multipart("/api/assignments")
                            .file(metadataPart())
                            .file(referenceSolutionPart())
                            .file(testCaseInputPart())
                            .header("Authorization", "Bearer " + teacherToken))
                    .andExpect(status().isAccepted())
                    .andExpect(jsonPath("$.data.title").value("Test Assignment"));
        }

        @Test
        @DisplayName("returns 400 when metadata is missing required fields")
        void missingRequiredFields() throws Exception {
            MockMultipartFile badMetadata = new MockMultipartFile(
                    "metadata", "", "application/json",
                    """
                    {"title":""}
                    """.getBytes()
            );

            mockMvc.perform(multipart("/api/assignments")
                            .file(badMetadata)
                            .file(referenceSolutionPart())
                            .file(testCaseInputPart())
                            .header("Authorization", "Bearer " + teacherToken))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    @DisplayName("extending due date updates qualifying late submissions to on time")
    void extendingDueDateReconcilesLateSubmissions() throws Exception {
        Assignment assignment = saveAssignment("Reschedule me");
        Submission submission = new Submission(assignment, student, Language.JAVA, true);
        submissionRepository.saveAndFlush(submission);
        Instant newDueDate = Instant.now().plusSeconds(3600);
        MockMultipartFile metadata = new MockMultipartFile(
                "metadata", "", MediaType.APPLICATION_JSON_VALUE,
                ("{\"dueDate\":\"" + newDueDate + "\"}").getBytes());

        mockMvc.perform(multipart("/api/assignments/{id}", assignment.getId())
                        .file(metadata)
                        .with(request -> {
                            request.setMethod("PATCH");
                            return request;
                        })
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPLIED"));

        entityManager.clear();
        assertThat(submissionRepository.findById(submission.getId()))
                .get()
                .extracting(Submission::getDeliveredLate)
                .isEqualTo(false);
    }

    @Test
    @DisplayName("rejects assignment date updates before current time")
    void rejectsPastDateUpdate() throws Exception {
        Assignment assignment = saveAssignment("Past dates");
        Instant pastDueDate = Instant.now().minusSeconds(60);
        MockMultipartFile metadata = new MockMultipartFile(
                "metadata", "", MediaType.APPLICATION_JSON_VALUE,
                ("{\"dueDate\":\"" + pastDueDate + "\"}").getBytes());

        mockMvc.perform(multipart("/api/assignments/{id}", assignment.getId())
                        .file(metadata)
                        .with(request -> {
                            request.setMethod("PATCH");
                            return request;
                        })
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("returns a complete owner-only clone form without inherited dates")
    void getCloneForm() throws Exception {
        Assignment source = saveAssignment("Clone me");
        source.addExample(new AssignmentExample(source, 1, "1 2", "3", "Add both values"));
        source = assignmentRepository.saveAndFlush(source);
        testCaseRepository.saveAndFlush(new TestCase(
                source, source.getActiveTestSuiteRevision(), 1, false));
        when(objectStorageService.download(anyString()))
                .thenAnswer(invocation -> new ByteArrayInputStream("source content".getBytes()));

        mockMvc.perform(get("/api/assignments/{id}/clone-form", source.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Clone me"))
                .andExpect(jsonPath("$.data.referenceLanguage").value("JAVA"))
                .andExpect(jsonPath("$.data.referenceSolution").value("source content"))
                .andExpect(jsonPath("$.data.testCases[0].input").value("source content"))
                .andExpect(jsonPath("$.data.examples[0].explanation").value("Add both values"))
                .andExpect(jsonPath("$.data.launchDate").doesNotExist())
                .andExpect(jsonPath("$.data.dueDate").doesNotExist())
                .andExpect(jsonPath("$.data.closeDate").doesNotExist());
    }

    @Test
    @DisplayName("clones the edited form snapshot and leaves omitted dates empty")
    void cloneAssignment() throws Exception {
        Assignment source = saveAssignment("Clone me");
        ClassGroup target = groupRepository.save(new ClassGroup("Advanced", "", teacher, "TARGET12"));

        AssignmentExampleRequest example = new AssignmentExampleRequest();
        example.setInput("4 5");
        example.setOutput("9");
        example.setExplanation("Edited example");
        CloneTestCaseRequest testCase = new CloneTestCaseRequest();
        testCase.setInput("10 20");
        testCase.setSample(true);
        CloneAssignmentRequest request = new CloneAssignmentRequest();
        request.setTargetGroupId(target.getId());
        request.setTitle("Edited clone");
        request.setDescription("Edited description");
        request.setConstraints(List.of("n > 0"));
        request.setHints(List.of("Use addition"));
        request.setTags(List.of("math"));
        request.setTimeLimitMs(1200L);
        request.setMemoryLimitMb(128L);
        request.setComparatorType(ComparatorType.EXACT_MATCH);
        request.setAllowedLanguages(List.of(Language.PYTHON));
        request.setReferenceLanguage(Language.PYTHON);
        request.setReferenceSolution("print(sum(map(int, input().split())))");
        request.setTestCases(List.of(testCase));
        request.setExamples(List.of(example));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/assignments/{id}/clone", source.getId())
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.data.groupId").value(target.getId().toString()))
                .andExpect(jsonPath("$.data.title").value("Edited clone"))
                .andExpect(jsonPath("$.data.allowedLanguages[0]").value("PYTHON"))
                .andExpect(jsonPath("$.data.examples[0].explanation").value("Edited example"))
                .andExpect(jsonPath("$.data.launchDate").doesNotExist())
                .andExpect(jsonPath("$.data.dueDate").doesNotExist())
                .andExpect(jsonPath("$.data.closeDate").doesNotExist())
                .andExpect(jsonPath("$.data.validationStatus").value("PROCESSING"));

        verify(objectStorageService).upload(
                org.mockito.ArgumentMatchers.contains("/reference/Main.py"),
                org.mockito.ArgumentMatchers.eq("print(sum(map(int, input().split())))"));
        verify(objectStorageService).upload(
                org.mockito.ArgumentMatchers.contains("/input.in"),
                org.mockito.ArgumentMatchers.eq("10 20"));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Assignment saveAssignment(String title) {
        Assignment a = new Assignment(title, "desc", 5000L, 256L, ComparatorType.EXACT_MATCH);
        a.setAllowedLanguages(List.of(Language.JAVA));
        a.setIsActive(true);
        a.setGroup(group);
        a.setAuthor(teacher);
        a.setValidationStatus(AssignmentValidationStatus.READY);
        a = assignmentRepository.saveAndFlush(a);
        ReferenceSolutionRevision referenceRevision = new ReferenceSolutionRevision();
        referenceRevision.setAssignment(a);
        referenceRevision.setLanguage(Language.JAVA);
        referenceRevision.setObjectKey("assignments/" + a.getId()
                + "/test-suite-revisions/reference/source/Main.java");
        referenceRevision = referenceSolutionRevisionRepository.saveAndFlush(referenceRevision);
        TestSuiteRevision testSuiteRevision = new TestSuiteRevision();
        testSuiteRevision.setAssignment(a);
        testSuiteRevision.setReferenceSolutionRevision(referenceRevision);
        testSuiteRevision.setRevisionNumber(1);
        testSuiteRevision = testSuiteRevisionRepository.saveAndFlush(testSuiteRevision);
        a.setActiveReferenceSolutionRevision(referenceRevision);
        a.setActiveTestSuiteRevision(testSuiteRevision);
        return assignmentRepository.saveAndFlush(a);
    }

    private MockMultipartFile metadataPart() throws Exception {
        CreateAssignmentRequest req = new CreateAssignmentRequest();
        req.setTitle("Test Assignment");
        req.setDescription("A test assignment");
        req.setTimeLimitMs(5000L);
        req.setMemoryLimitMb(256L);
        req.setComparatorType(ComparatorType.EXACT_MATCH);
        req.setAllowedLanguages(List.of(Language.JAVA));
        req.setReferenceLanguage(Language.JAVA);
        req.setGroupId(group.getId());

        return new MockMultipartFile(
                "metadata", "", MediaType.APPLICATION_JSON_VALUE,
                objectMapper.writeValueAsBytes(req)
        );
    }

    private MockMultipartFile referenceSolutionPart() {
        return new MockMultipartFile(
                "referenceSolution", "Main.java", "text/plain",
                "public class Main { public static void main(String[] a) {} }".getBytes()
        );
    }

    private MockMultipartFile testCaseInputPart() {
        return new MockMultipartFile(
                "testCaseInputs", "tc1.txt", "text/plain",
                "3 5".getBytes()
        );
    }
}
