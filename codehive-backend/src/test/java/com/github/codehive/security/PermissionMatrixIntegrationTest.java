package com.github.codehive.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;

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
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.config.TestAsyncConfig;
import com.github.codehive.messaging.producer.TestGenerationRequestProducer;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.entity.ReferenceSolution;
import com.github.codehive.model.entity.StudentAssignmentWork;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.ComparatorType;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.Scope;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.ReferenceSolutionRepository;
import com.github.codehive.repository.StudentAssignmentWorkRepository;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.service.ObjectStorageService;
import com.github.codehive.utils.JwtUtil;

/**
 * Verifies the role x operation permission matrix across groups, assignments, student
 * work/grading, and metrics. The ratified rule (llms plan §3.6, F7): a group's owner,
 * regardless of role, has the same capabilities over that group as a teacher would —
 * GroupController, GroupMetricsController, AssignmentController, and
 * AssignmentStudentWorkController all authorize purely on
 * {@code group.owner.id == caller.id}, with no role-based {@code @PreAuthorize} gate.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
@Import(TestAsyncConfig.class)
@DisplayName("Permission matrix")
class PermissionMatrixIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private ClassGroupRepository groupRepository;
    @Autowired private GroupEnrollmentRepository enrollmentRepository;
    @Autowired private AssignmentRepository assignmentRepository;
    @Autowired private StudentAssignmentWorkRepository workRepository;
    @Autowired private ReferenceSolutionRepository referenceSolutionRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    @MockitoBean private ObjectStorageService objectStorageService;
    @MockitoBean private TestGenerationRequestProducer testGenerationRequestProducer;

    private User teacher;
    private User studentOwner;
    private User enrolledStudent;
    private User outsiderStudent;
    private String teacherToken;
    private String studentOwnerToken;
    private String enrolledStudentToken;
    private String outsiderStudentToken;

    private ClassGroup teacherGroup;
    private ClassGroup studentOwnedGroup;
    private Assignment teacherAssignment;
    private Assignment studentOwnedAssignment;

    @BeforeEach
    void setUp() throws Exception {
        teacher = userRepository.save(new User("Grace", "Hopper", "TEA-PERM", "teacher-perm@codehive.test",
                passwordEncoder.encode("Pass123!"), Role.TEACHER));
        studentOwner = userRepository.save(new User("Ada", "Lovelace", "STU-OWNER", "owner-perm@codehive.test",
                passwordEncoder.encode("Pass123!"), Role.STUDENT));
        enrolledStudent = userRepository.save(new User("Katherine", "Johnson", "STU-ENROLLED",
                "enrolled-perm@codehive.test", passwordEncoder.encode("Pass123!"), Role.STUDENT));
        outsiderStudent = userRepository.save(new User("Edsger", "Dijkstra", "STU-OUTSIDER",
                "outsider-perm@codehive.test", passwordEncoder.encode("Pass123!"), Role.STUDENT));

        // Only an admin can grant this in production (AdminUserController#updateScopes);
        // granted directly here to reach the scenario the ownership rule was written for.
        studentOwner.addScope(Scope.CREATE_GROUP);
        userRepository.saveAndFlush(studentOwner);

        teacherToken = jwtUtil.generateToken(Map.of("role", "TEACHER"), teacher.getEmail());
        studentOwnerToken = jwtUtil.generateToken(Map.of("role", "STUDENT"), studentOwner.getEmail());
        enrolledStudentToken = jwtUtil.generateToken(Map.of("role", "STUDENT"), enrolledStudent.getEmail());
        outsiderStudentToken = jwtUtil.generateToken(Map.of("role", "STUDENT"), outsiderStudent.getEmail());

        teacherGroup = groupRepository.save(new ClassGroup("Algorithms", "", teacher, "PERMTEA1"));
        studentOwnedGroup = groupRepository.save(new ClassGroup("Peer Study", "", studentOwner, "PERMSTU1"));
        enrollmentRepository.save(new GroupEnrollment(teacherGroup, enrolledStudent));

        teacherAssignment = saveAssignment(teacherGroup, teacher, "Teacher's assignment");
        studentOwnedAssignment = saveAssignment(studentOwnedGroup, studentOwner, "Student-owner's assignment");
        referenceSolutionRepository.saveAndFlush(new ReferenceSolution(studentOwnedAssignment, Language.JAVA));

        doNothing().when(objectStorageService).upload(anyString(), anyString());
        when(objectStorageService.download(anyString()))
                .thenAnswer(invocation -> new ByteArrayInputStream("source content".getBytes()));
        doNothing().when(testGenerationRequestProducer).sendTestGenerationRequest(any());
    }

    // ── Groups: ownership-only, role-agnostic (GroupController / GroupService) ────────

    @Nested
    @DisplayName("Groups honor \"owner regardless of role\" consistently")
    class GroupsHonorOwnership {

        @Test
        @DisplayName("a STUDENT who owns a group can archive, rotate its code, and delete it")
        void studentOwnerCanManageTheirOwnGroup() throws Exception {
            mockMvc.perform(post("/api/groups/{id}/archive", studentOwnedGroup.getId())
                            .header("Authorization", "Bearer " + studentOwnerToken))
                    .andExpect(status().isOk());
            mockMvc.perform(post("/api/groups/{id}/unarchive", studentOwnedGroup.getId())
                            .header("Authorization", "Bearer " + studentOwnerToken))
                    .andExpect(status().isOk());
            mockMvc.perform(post("/api/groups/{id}/join-code/rotate", studentOwnedGroup.getId())
                            .header("Authorization", "Bearer " + studentOwnerToken))
                    .andExpect(status().isOk());
            mockMvc.perform(delete("/api/groups/{id}", studentOwnedGroup.getId())
                            .header("Authorization", "Bearer " + studentOwnerToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("a TEACHER who does not own the group cannot archive or delete it")
        void nonOwnerTeacherCannotManageAnotherOwnersGroup() throws Exception {
            mockMvc.perform(post("/api/groups/{id}/archive", studentOwnedGroup.getId())
                            .header("Authorization", "Bearer " + teacherToken))
                    .andExpect(status().isForbidden());
            mockMvc.perform(delete("/api/groups/{id}", studentOwnedGroup.getId())
                            .header("Authorization", "Bearer " + teacherToken))
                    .andExpect(status().isForbidden());
        }
    }

    // ── Assignments: ownership-only, role-agnostic (AssignmentController) ─────────────

    @Nested
    @DisplayName("Assignments honor \"owner regardless of role\", same as Groups and Metrics")
    class AssignmentsHonorOwnership {

        @Test
        @DisplayName("a STUDENT who owns the group can read its assignments")
        void studentOwnerCanReadTheirOwnGroupsAssignments() throws Exception {
            mockMvc.perform(get("/api/assignments").param("groupId", studentOwnedGroup.getId().toString())
                            .header("Authorization", "Bearer " + studentOwnerToken))
                    .andExpect(status().isOk());
            mockMvc.perform(get("/api/assignments/{id}", studentOwnedAssignment.getId())
                            .header("Authorization", "Bearer " + studentOwnerToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("a STUDENT who owns the group can create an assignment in it")
        void studentOwnerCanCreateAnAssignmentInTheirOwnGroup() throws Exception {
            MockMultipartFile metadata = new MockMultipartFile("metadata", "", MediaType.APPLICATION_JSON_VALUE,
                    ("{\"title\":\"New\",\"description\":\"d\",\"timeLimitMs\":1000,\"memoryLimitMb\":128,"
                            + "\"comparatorType\":\"EXACT_MATCH\",\"allowedLanguages\":[\"JAVA\"],"
                            + "\"referenceLanguage\":\"JAVA\",\"groupId\":\"" + studentOwnedGroup.getId() + "\"}")
                            .getBytes());

            mockMvc.perform(MockMvcRequestBuilders.multipart("/api/assignments")
                            .file(metadata)
                            .file(new MockMultipartFile("referenceSolution", "Main.java", "text/plain",
                                    "public class Main {}".getBytes()))
                            .file(new MockMultipartFile("testCaseInputs", "tc1.txt", "text/plain", "1".getBytes()))
                            .header("Authorization", "Bearer " + studentOwnerToken))
                    .andExpect(status().isAccepted());
        }

        @Test
        @DisplayName("a STUDENT who owns the group can update, clone-form, and delete its own assignment")
        void studentOwnerCanManageTheirOwnAssignment() throws Exception {
            mockMvc.perform(MockMvcRequestBuilders.multipart("/api/assignments/{id}", studentOwnedAssignment.getId())
                            .file(new MockMultipartFile("metadata", "", MediaType.APPLICATION_JSON_VALUE,
                                    "{\"description\":\"updated\"}".getBytes()))
                            .with(request -> {
                                request.setMethod("PATCH");
                                return request;
                            })
                            .header("Authorization", "Bearer " + studentOwnerToken))
                    .andExpect(status().isOk());
            mockMvc.perform(get("/api/assignments/{id}/clone-form", studentOwnedAssignment.getId())
                            .header("Authorization", "Bearer " + studentOwnerToken))
                    .andExpect(status().isOk());
            mockMvc.perform(delete("/api/assignments/{id}", studentOwnedAssignment.getId())
                            .header("Authorization", "Bearer " + studentOwnerToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("a TEACHER who does not own the group cannot manage its assignments")
        void nonOwnerTeacherCannotManageAnotherOwnersAssignment() throws Exception {
            mockMvc.perform(get("/api/assignments/{id}/clone-form", studentOwnedAssignment.getId())
                            .header("Authorization", "Bearer " + teacherToken))
                    .andExpect(status().isForbidden());
            mockMvc.perform(delete("/api/assignments/{id}", studentOwnedAssignment.getId())
                            .header("Authorization", "Bearer " + teacherToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("an outsider student cannot read assignments of a group they are not enrolled in "
                + "(reported as not found, not forbidden, so the assignment's existence isn't revealed)")
        void outsiderCannotReadAssignmentsOfAForeignGroup() throws Exception {
            mockMvc.perform(get("/api/assignments/{id}", teacherAssignment.getId())
                            .header("Authorization", "Bearer " + outsiderStudentToken))
                    .andExpect(status().isNotFound());
        }
    }

    // ── Student work & grading: ownership-only, role-agnostic ─────────────────────────

    @Nested
    @DisplayName("Student work and grading honor \"owner regardless of role\"")
    class StudentWorkAndGrading {

        @Test
        @DisplayName("a STUDENT who owns the group can list student work and grade their own gradebook")
        void studentOwnerCanAccessTheirOwnGradebook() throws Exception {
            enrollmentRepository.save(new GroupEnrollment(studentOwnedGroup, enrolledStudent));
            StudentAssignmentWork work = new StudentAssignmentWork();
            work.setAssignment(studentOwnedAssignment);
            work.setStudent(enrolledStudent);
            work.setUpdatedAt(Instant.now());
            workRepository.save(work);

            mockMvc.perform(get("/api/assignments/{id}/student-work", studentOwnedAssignment.getId())
                            .header("Authorization", "Bearer " + studentOwnerToken))
                    .andExpect(status().isOk());
            mockMvc.perform(put("/api/assignments/{id}/students/{sid}/grade",
                            studentOwnedAssignment.getId(), enrolledStudent.getId())
                            .header("Authorization", "Bearer " + studentOwnerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"value\":90}"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("a STUDENT who owns the group can read an individual student's work, "
                + "consistent with what GroupMetricsController already lets them see aggregated")
        void studentOwnerCanReadIndividualStudentWork() throws Exception {
            User peer = userRepository.save(new User("Barbara", "Liskov", "STU-PEER", "peer-perm@codehive.test",
                    passwordEncoder.encode("Pass123!"), Role.STUDENT));
            enrollmentRepository.save(new GroupEnrollment(studentOwnedGroup, peer));
            StudentAssignmentWork work = new StudentAssignmentWork();
            work.setAssignment(studentOwnedAssignment);
            work.setStudent(peer);
            work.setUpdatedAt(Instant.now());
            workRepository.save(work);

            mockMvc.perform(get("/api/assignments/{id}/students/{sid}/work",
                            studentOwnedAssignment.getId(), peer.getId())
                            .header("Authorization", "Bearer " + studentOwnerToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("a TEACHER who does not own the group cannot read or grade its gradebook")
        void nonOwnerTeacherCannotAccessAnotherOwnersGradebook() throws Exception {
            mockMvc.perform(get("/api/assignments/{id}/student-work", studentOwnedAssignment.getId())
                            .header("Authorization", "Bearer " + teacherToken))
                    .andExpect(status().isForbidden());
            mockMvc.perform(put("/api/assignments/{id}/students/{sid}/grade",
                            studentOwnedAssignment.getId(), enrolledStudent.getId())
                            .header("Authorization", "Bearer " + teacherToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"value\":90}"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("a TEACHER who owns the assignment's group can list and read its student work")
        void owningTeacherCanReadTheGradebook() throws Exception {
            StudentAssignmentWork work = new StudentAssignmentWork();
            work.setAssignment(teacherAssignment);
            work.setStudent(enrolledStudent);
            work.setUpdatedAt(Instant.now());
            workRepository.save(work);

            mockMvc.perform(get("/api/assignments/{id}/student-work", teacherAssignment.getId())
                            .header("Authorization", "Bearer " + teacherToken))
                    .andExpect(status().isOk());
            mockMvc.perform(get("/api/assignments/{id}/students/{sid}/work",
                            teacherAssignment.getId(), enrolledStudent.getId())
                            .header("Authorization", "Bearer " + teacherToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("my-work and my-grade require the STUDENT role, so even an owning TEACHER is denied")
        void myWorkAndMyGradeAreStudentOnlyRegardlessOfOwnership() throws Exception {
            mockMvc.perform(get("/api/assignments/{id}/my-work", teacherAssignment.getId())
                            .header("Authorization", "Bearer " + teacherToken))
                    .andExpect(status().isForbidden());
            mockMvc.perform(get("/api/assignments/{id}/my-grade", teacherAssignment.getId())
                            .header("Authorization", "Bearer " + teacherToken))
                    .andExpect(status().isForbidden());
        }
    }

    // ── Metrics: ownership-only, role-agnostic (GroupMetricsController) ───────────────

    @Nested
    @DisplayName("Metrics honor \"owner regardless of role\", same as Groups and Assignments")
    class MetricsHonorOwnership {

        @Test
        @DisplayName("a STUDENT who owns the group can read all four metrics endpoints for it")
        void studentOwnerCanReadTheirOwnMetrics() throws Exception {
            mockMvc.perform(get("/api/groups/{id}/metrics/overview", studentOwnedGroup.getId())
                            .header("Authorization", "Bearer " + studentOwnerToken))
                    .andExpect(status().isOk());
            mockMvc.perform(get("/api/groups/{id}/metrics/assignments", studentOwnedGroup.getId())
                            .header("Authorization", "Bearer " + studentOwnerToken))
                    .andExpect(status().isOk());
            mockMvc.perform(get("/api/groups/{id}/metrics/students", studentOwnedGroup.getId())
                            .header("Authorization", "Bearer " + studentOwnerToken))
                    .andExpect(status().isOk());
            mockMvc.perform(get("/api/assignments/{id}/metrics", studentOwnedAssignment.getId())
                            .header("Authorization", "Bearer " + studentOwnerToken))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("neither an enrolled student nor an outsider can read a group's metrics, only its owner")
        void nonOwnersCannotReadMetricsRegardlessOfEnrollment() throws Exception {
            mockMvc.perform(get("/api/groups/{id}/metrics/overview", teacherGroup.getId())
                            .header("Authorization", "Bearer " + enrolledStudentToken))
                    .andExpect(status().isForbidden());
            mockMvc.perform(get("/api/groups/{id}/metrics/overview", teacherGroup.getId())
                            .header("Authorization", "Bearer " + outsiderStudentToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("a TEACHER who does not own the group cannot read its metrics")
        void nonOwnerTeacherCannotReadAnotherOwnersMetrics() throws Exception {
            mockMvc.perform(get("/api/groups/{id}/metrics/overview", studentOwnedGroup.getId())
                            .header("Authorization", "Bearer " + teacherToken))
                    .andExpect(status().isForbidden());
        }
    }

    private Assignment saveAssignment(ClassGroup group, User author, String title) {
        Assignment assignment = new Assignment(title, "desc", 5000L, 256L, ComparatorType.EXACT_MATCH);
        assignment.setAllowedLanguages(List.of(Language.JAVA));
        assignment.setIsActive(true);
        assignment.setGroup(group);
        assignment.setAuthor(author);
        assignment.setValidationStatus(AssignmentValidationStatus.READY);
        return assignmentRepository.saveAndFlush(assignment);
    }
}
