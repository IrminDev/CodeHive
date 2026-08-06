package com.github.codehive.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.codehive.config.TestAsyncConfig;
import com.github.codehive.messaging.producer.ExecutionRequestProducer;
import com.github.codehive.model.dto.queue.ExecutionReport;
import com.github.codehive.model.dto.queue.ExecutionJob;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.ReferenceSolutionRevision;
import com.github.codehive.model.entity.TestCase;
import com.github.codehive.model.entity.TestSuiteRevision;
import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.ExecutionType;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.RevisionStatus;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.request.execution.ExecutionRequest;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.model.entity.ReferenceSolution;
import com.github.codehive.repository.ReferenceSolutionRepository;
import com.github.codehive.repository.ReferenceSolutionRevisionRepository;
import com.github.codehive.repository.TestCaseRepository;
import com.github.codehive.repository.TestSuiteRevisionRepository;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.service.ObjectStorageService;
import com.github.codehive.service.event.ExecutionJobCreatedEvent;
import com.github.codehive.utils.JwtUtil;
import com.github.codehive.utils.ObjectKeyBuilder;
import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.util.List;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
@Import(TestAsyncConfig.class)
@RecordApplicationEvents
@DisplayName("CheckExecutionController Integration")
class CheckExecutionControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private AssignmentRepository assignmentRepository;
    @Autowired private ExecutionRepository executionRepository;
    @Autowired private ReferenceSolutionRepository referenceSolutionRepository;
    @Autowired private ReferenceSolutionRevisionRepository referenceSolutionRevisionRepository;
    @Autowired private TestCaseRepository testCaseRepository;
    @Autowired private TestSuiteRevisionRepository testSuiteRevisionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ClassGroupRepository groupRepository;
    @Autowired private GroupEnrollmentRepository enrollmentRepository;
    @Autowired private SubmissionRepository submissionRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private ApplicationEvents applicationEvents;

    @MockitoBean private ObjectStorageService objectStorageService;
    @MockitoBean private ExecutionRequestProducer executionRequestProducer;

    private Assignment assignment;
    private String studentToken;
    private String teacherToken;
    private User student;

    @BeforeEach
    void setUp() throws Exception {
        userRepository.deleteAll();
        userRepository.flush();

        student = new User();
        student.setEmail("student@test.com");
        student.setPassword(passwordEncoder.encode("Pass123!"));
        student.setName("Student");
        student.setLastName("Last");
        student.setEnrollmentNumber("STU-001");
        student.setRole(Role.STUDENT);
        student.setIsActive(true);
        student = userRepository.save(student);
        studentToken = jwtUtil.generateToken(Map.of("role", "STUDENT"), "student@test.com");

        User teacher = new User("Teacher", "Last", "TEA-001", "teacher@test.com",
                passwordEncoder.encode("Pass123!"), Role.TEACHER);
        teacher = userRepository.save(teacher);
        teacherToken = jwtUtil.generateToken(Map.of("role", "TEACHER"), "teacher@test.com");
        ClassGroup group = groupRepository.save(new ClassGroup("Algorithms", "", teacher, "EXEC1234"));
        enrollmentRepository.save(new GroupEnrollment(group, student));

        assignment = new Assignment("Sum Two Numbers", "Add a+b", 5000L, 256L, ComparatorType.EXACT_MATCH);
        assignment.setAllowedLanguages(List.of(Language.JAVA, Language.PYTHON));
        assignment.setIsActive(true);
        assignment.setGroup(group);
        assignment.setAuthor(teacher);
        assignment.setValidationStatus(AssignmentValidationStatus.READY);
        assignmentRepository.saveAndFlush(assignment);

        ReferenceSolution ref = new ReferenceSolution(assignment, Language.PYTHON);
        referenceSolutionRepository.saveAndFlush(ref);

        ReferenceSolutionRevision referenceRevision = new ReferenceSolutionRevision();
        referenceRevision.setAssignment(assignment);
        referenceRevision.setLanguage(Language.PYTHON);
        referenceRevision.setStatus(RevisionStatus.ACTIVE);
        referenceRevision.setObjectKey("assignments/" + assignment.getId()
                + "/test-suite-revisions/reference/source/Main.py");
        referenceRevision = referenceSolutionRevisionRepository.saveAndFlush(referenceRevision);

        TestSuiteRevision testSuiteRevision = new TestSuiteRevision();
        testSuiteRevision.setAssignment(assignment);
        testSuiteRevision.setReferenceSolutionRevision(referenceRevision);
        testSuiteRevision.setRevisionNumber(1);
        testSuiteRevision.setStatus(RevisionStatus.ACTIVE);
        testSuiteRevision = testSuiteRevisionRepository.saveAndFlush(testSuiteRevision);

        TestCase testCase = new TestCase(assignment, 1, false);
        testCase.setTestSuiteRevision(testSuiteRevision);
        testCaseRepository.saveAndFlush(testCase);

        assignment.setActiveReferenceSolutionRevision(referenceRevision);
        assignment.setActiveTestSuiteRevision(testSuiteRevision);
        assignmentRepository.saveAndFlush(assignment);

        doNothing().when(objectStorageService).upload(anyString(), anyString());
        doNothing().when(executionRequestProducer).sendExecutionRequest(any());
    }

    // ── SUBMIT ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/execution/check")
    class SubmitExecution {

        @Test
        @DisplayName("returns 202 with execution ID for valid PRACTICE request")
        void acceptsValidRequest() throws Exception {
            ExecutionRequest req = new ExecutionRequest(
                    "print(int(input()))", Language.PYTHON,
                    null, assignment.getId(),
                    List.of("3 5"), ExecutionType.PRACTICE
            );

            mockMvc.perform(post("/api/execution/check")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req))
                            .header("Authorization", "Bearer " + studentToken))
                    .andExpect(status().isAccepted())
                    .andExpect(jsonPath("$.data.id").exists())
                    .andExpect(jsonPath("$.data.status").value("PENDING"));
        }

        @Test
        @DisplayName("returns 400 when code is blank")
        void rejectsBlankCode() throws Exception {
            ExecutionRequest req = new ExecutionRequest(
                    "", Language.PYTHON,
                    null, assignment.getId(),
                    List.of("3 5"), ExecutionType.PRACTICE
            );

            mockMvc.perform(post("/api/execution/check")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req))
                            .header("Authorization", "Bearer " + studentToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 400 when language is missing")
        void rejectsMissingLanguage() throws Exception {
            String body = """
                    {"code":"print(1)","executionType":"PRACTICE","assignmentId":"%s"}
                    """.formatted(assignment.getId());

            mockMvc.perform(post("/api/execution/check")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body)
                            .header("Authorization", "Bearer " + studentToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("requires practice test cases when requested by the teacher")
        void teacherPracticeRequiresTestCases() throws Exception {
            ExecutionRequest req = new ExecutionRequest(
                    "print(1)", Language.PYTHON,
                    null, assignment.getId(), null, ExecutionType.PRACTICE
            );

            mockMvc.perform(post("/api/execution/check")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req))
                            .header("Authorization", "Bearer " + teacherToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("returns 404 when assignment does not exist")
        void notFoundAssignment() throws Exception {
            ExecutionRequest req = new ExecutionRequest(
                    "print(1)", Language.PYTHON,
                    null, UUID.randomUUID(),
                    List.of("1"), ExecutionType.PRACTICE
            );

            mockMvc.perform(post("/api/execution/check")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req))
                            .header("Authorization", "Bearer " + studentToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("derives student identity from JWT and flags a late definitive delivery")
        void definitiveSubmissionUsesAuthenticatedIdentity() throws Exception {
            User otherStudent = userRepository.save(new User("Other", "Student", "STU-002",
                    "other@test.com", passwordEncoder.encode("Pass123!"), Role.STUDENT));
            assignment.setDueDate(Instant.now().minusSeconds(60));
            assignmentRepository.saveAndFlush(assignment);

            ExecutionRequest req = new ExecutionRequest("print(1)", Language.PYTHON,
                    otherStudent.getId(), assignment.getId(), null, ExecutionType.DEFINITIVE);
            mockMvc.perform(post("/api/execution/check")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req))
                            .header("Authorization", "Bearer " + studentToken))
                    .andExpect(status().isAccepted());

            var submissions = submissionRepository.findByAssignmentAndStudentOrderByCreatedAtDesc(assignment, student);
            org.junit.jupiter.api.Assertions.assertEquals(1, submissions.size());
            org.junit.jupiter.api.Assertions.assertTrue(submissions.get(0).getDeliveredLate());
            org.junit.jupiter.api.Assertions.assertTrue(
                    submissionRepository.findByAssignmentAndStudentOrderByCreatedAtDesc(assignment, otherStudent).isEmpty());

            ExecutionJob job = applicationEvents.stream(ExecutionJobCreatedEvent.class)
                    .map(ExecutionJobCreatedEvent::job)
                    .findFirst()
                    .orElseThrow();
            org.junit.jupiter.api.Assertions.assertEquals(1, job.getTestCases().size());
            org.junit.jupiter.api.Assertions.assertEquals(
                    assignment.getActiveTestSuiteRevision().getId(), job.getTestSuiteRevisionId());
            var queuedTestCase = job.getTestCases().get(0);
            org.junit.jupiter.api.Assertions.assertEquals(
                    ObjectKeyBuilder.testCaseInput(
                            assignment.getId(), assignment.getActiveTestSuiteRevision().getId(),
                            queuedTestCase.getTestCaseId()),
                    queuedTestCase.getInputPath());
            org.junit.jupiter.api.Assertions.assertEquals(
                    ObjectKeyBuilder.testCaseExpectedOutput(
                            assignment.getId(), assignment.getActiveTestSuiteRevision().getId(),
                            queuedTestCase.getTestCaseId()),
                    queuedTestCase.getExpectedOutputPath());
        }

        @Test
        @DisplayName("rejects definitive delivery when no active test suite exists")
        void rejectsDefinitiveSubmissionWithoutActiveTestSuite() throws Exception {
            assignment.setActiveTestSuiteRevision(null);
            assignmentRepository.saveAndFlush(assignment);
            ExecutionRequest req = new ExecutionRequest("print(1)", Language.PYTHON,
                    null, assignment.getId(), null, ExecutionType.DEFINITIVE);

            mockMvc.perform(post("/api/execution/check")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req))
                            .header("Authorization", "Bearer " + studentToken))
                    .andExpect(status().isBadRequest());

            org.junit.jupiter.api.Assertions.assertEquals(
                    0, submissionRepository.countByAssignmentId(assignment.getId()));
        }

        @Test
        @DisplayName("rejects definitive deliveries at or after close date")
        void rejectsClosedAssignment() throws Exception {
            assignment.setCloseDate(Instant.now().minusSeconds(1));
            assignmentRepository.saveAndFlush(assignment);
            ExecutionRequest req = new ExecutionRequest("print(1)", Language.PYTHON,
                    null, assignment.getId(), null, ExecutionType.DEFINITIVE);

            mockMvc.perform(post("/api/execution/check")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req))
                            .header("Authorization", "Bearer " + studentToken))
                    .andExpect(status().isBadRequest());
            org.junit.jupiter.api.Assertions.assertEquals(0, submissionRepository.countByAssignmentId(assignment.getId()));
        }
    }

    // ── GET STATUS ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("GET /api/execution/check/{id}")
    class GetExecution {

        @Test
        @DisplayName("returns 200 with execution status")
        void found() throws Exception {
            Execution exec = new Execution(ExecutionType.PRACTICE);
            exec.setUser(student);
            exec.setStatus(ExecutionStatus.PENDING);
            executionRepository.saveAndFlush(exec);

            mockMvc.perform(get("/api/execution/check/{id}", exec.getId())
                            .header("Authorization", "Bearer " + studentToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value(exec.getId().toString()))
                    .andExpect(jsonPath("$.data.status").value("PENDING"));
        }

        @Test
        @DisplayName("returns 404 for non-existent execution ID")
        void notFound() throws Exception {
            mockMvc.perform(get("/api/execution/check/{id}", UUID.randomUUID())
                            .header("Authorization", "Bearer " + studentToken))
                    .andExpect(status().isNotFound());
        }
    }

    // ── GET REPORT ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("GET /api/execution/check/{id}/report")
    class GetReport {

        @Test
        @DisplayName("returns 200 with parsed report from object storage")
        void returnsReport() throws Exception {
            Execution exec = new Execution(ExecutionType.PRACTICE);
            exec.setUser(student);
            exec.setStatus(ExecutionStatus.AC);
            executionRepository.saveAndFlush(exec);

            String reportJson = """
                    {
                      "executionId":"%s",
                      "overallStatus":"AC",
                      "testCaseResults":[],
                      "totalTests":1,
                      "passedTests":1,
                      "failedTests":0,
                      "totalExecutionTimeMs":120,
                      "maxExecutionTimeMs":120,
                      "maxMemoryUsedMb":10,
                      "compilationError":null
                    }
                    """.formatted(exec.getId());

            when(objectStorageService.download(anyString()))
                    .thenReturn(new ByteArrayInputStream(reportJson.getBytes()));

            mockMvc.perform(get("/api/execution/check/{id}/report", exec.getId())
                            .header("Authorization", "Bearer " + studentToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.overallStatus").value("AC"))
                    .andExpect(jsonPath("$.data.passedTests").value(1));
        }

        @Test
        @DisplayName("returns 404 when report not found for non-existent execution")
        void notFoundExecution() throws Exception {
            mockMvc.perform(get("/api/execution/check/{id}/report", UUID.randomUUID())
                            .header("Authorization", "Bearer " + studentToken))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("returns 404 when execution is PENDING and report not uploaded yet")
        void reportNotYetAvailable() throws Exception {
            Execution exec = new Execution(ExecutionType.PRACTICE);
            exec.setUser(student);
            exec.setStatus(ExecutionStatus.PENDING);
            executionRepository.saveAndFlush(exec);

            when(objectStorageService.download(anyString()))
                    .thenThrow(new RuntimeException("object not found"));

            mockMvc.perform(get("/api/execution/check/{id}/report", exec.getId())
                            .header("Authorization", "Bearer " + studentToken))
                    .andExpect(status().isNotFound());
        }
    }
}
