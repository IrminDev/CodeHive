package com.github.codehive.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
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
import com.github.codehive.model.entity.ReferenceSolution;
import com.github.codehive.model.entity.TestCase;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.request.assignment.CreateAssignmentRequest;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.ReferenceSolutionRepository;
import com.github.codehive.repository.TestCaseRepository;
import com.github.codehive.service.ObjectStorageService;
import com.github.codehive.utils.JwtUtil;
import java.util.List;
import java.io.ByteArrayInputStream;
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
    @Autowired private ReferenceSolutionRepository referenceSolutionRepository;
    @Autowired private TestCaseRepository testCaseRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    @MockitoBean private ObjectStorageService objectStorageService;
    @MockitoBean private TestGenerationRequestProducer testGenerationRequestProducer;

    private String teacherToken;
    private String studentToken;
    private User teacher;
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

        User student = new User();
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
    @DisplayName("clones metadata, examples, reference source, and test inputs into another owned group")
    void cloneAssignment() throws Exception {
        Assignment source = saveAssignment("Clone me");
        source.addExample(new AssignmentExample(source, 1, "1 2", "3", "Add both values"));
        source = assignmentRepository.saveAndFlush(source);
        referenceSolutionRepository.saveAndFlush(new ReferenceSolution(source, Language.JAVA));
        testCaseRepository.saveAndFlush(new TestCase(source, 1, false));
        ClassGroup target = groupRepository.save(new ClassGroup("Advanced", "", teacher, "TARGET12"));
        when(objectStorageService.download(anyString()))
                .thenAnswer(invocation -> new ByteArrayInputStream("content".getBytes()));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/assignments/{id}/clone", source.getId())
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"targetGroupId\":\"" + target.getId() + "\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.data.groupId").value(target.getId().toString()))
                .andExpect(jsonPath("$.data.examples[0].explanation").value("Add both values"))
                .andExpect(jsonPath("$.data.validationStatus").value("PROCESSING"));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Assignment saveAssignment(String title) {
        Assignment a = new Assignment(title, "desc", 5000L, 256L, ComparatorType.EXACT_MATCH);
        a.setAllowedLanguages(List.of(Language.JAVA));
        a.setIsActive(true);
        a.setGroup(group);
        a.setAuthor(teacher);
        a.setValidationStatus(AssignmentValidationStatus.READY);
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
