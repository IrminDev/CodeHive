package com.github.codehive.controller;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.Scope;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.utils.JwtUtil;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
@DisplayName("GroupController Integration")
class GroupControllerIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ClassGroupRepository groupRepository;
    @Autowired private GroupEnrollmentRepository enrollmentRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    private User teacher;
    private User student;
    private String teacherToken;
    private String studentToken;

    @BeforeEach
    void setUp() {
        teacher = userRepository.save(new User("Ada", "Lovelace", "TEA-GROUP", "ada@codehive.test",
                passwordEncoder.encode("Pass123!"), Role.TEACHER));
        student = userRepository.save(new User("Grace", "Hopper", "STU-GROUP", "grace@codehive.test",
                passwordEncoder.encode("Pass123!"), Role.STUDENT));
        teacherToken = jwtUtil.generateToken(Map.of("role", "TEACHER"), teacher.getEmail());
        studentToken = jwtUtil.generateToken(Map.of("role", "STUDENT"), student.getEmail());
    }

    @Test
    void teacherCreatesGroupWithJoinCode() throws Exception {
        mockMvc.perform(post("/api/groups")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Algorithms\",\"description\":\"Fall term\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.ownerId").value(teacher.getId().toString()))
                .andExpect(jsonPath("$.data.joinCode").isNotEmpty())
                .andExpect(jsonPath("$.data.archived").value(false));
    }

    @Test
    void scopedStudentCreatesAndManagesOwnedGroup() throws Exception {
        student.addScope(Scope.CREATE_GROUP);
        userRepository.saveAndFlush(student);

        String response = mockMvc.perform(post("/api/groups")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Peer Study\",\"description\":\"Student owned\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.ownerId").value(student.getId().toString()))
                .andReturn().getResponse().getContentAsString();
        String groupId = objectMapper.readTree(response).path("data").path("id").asText();

        mockMvc.perform(patch("/api/groups/{id}", groupId)
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Peer Algorithms\",\"description\":\"Updated\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Peer Algorithms"));
    }

    @Test
    void studentOwnerCannotJoinOwnGroup() throws Exception {
        ClassGroup group = groupRepository.save(new ClassGroup("Peer Study", "", student, "SELF1234"));
        mockMvc.perform(post("/api/groups/join")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"joinCode\":\"SELF1234\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void onlyStudentsCanJoinAndEnrollmentIsPreserved() throws Exception {
        ClassGroup group = groupRepository.save(new ClassGroup("Algorithms", "", teacher, "JOIN1234"));

        mockMvc.perform(post("/api/groups/join")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("joinCode", "join1234"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.joinCode").doesNotExist());

        assert enrollmentRepository.existsByGroupIdAndStudentIdAndStatus(
                group.getId(), student.getId(), EnrollmentStatus.ACTIVE);

        mockMvc.perform(post("/api/groups/join")
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"joinCode\":\"JOIN1234\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void activeStudentCanListActiveGroupMembersButFormerStudentCannot() throws Exception {
        ClassGroup group = groupRepository.save(new ClassGroup("Algorithms", "", teacher, "MEMBER12"));
        User peer = userRepository.save(new User("Katherine", "Johnson", "STU-PEER",
                "katherine@codehive.test", passwordEncoder.encode("Pass123!"), Role.STUDENT));
        User formerStudent = userRepository.save(new User("Edsger", "Dijkstra", "STU-FORMER",
                "edsger@codehive.test", passwordEncoder.encode("Pass123!"), Role.STUDENT));

        GroupEnrollment formerEnrollment = new GroupEnrollment(group, formerStudent);
        formerEnrollment.setStatus(EnrollmentStatus.LEFT);
        enrollmentRepository.saveAll(List.of(
                new GroupEnrollment(group, student),
                new GroupEnrollment(group, peer),
                formerEnrollment));

        mockMvc.perform(get("/api/groups/{id}/students", group.getId())
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[*].student.id", containsInAnyOrder(
                        student.getId().toString(), peer.getId().toString())))
                .andExpect(jsonPath("$.data[*].status", containsInAnyOrder("ACTIVE", "ACTIVE")))
                .andExpect(jsonPath("$.data[*].assignments").doesNotExist())
                .andExpect(jsonPath("$.data[*].grades").doesNotExist());

        String formerStudentToken = jwtUtil.generateToken(
                Map.of("role", "STUDENT"), formerStudent.getEmail());
        mockMvc.perform(get("/api/groups/{id}/students", group.getId())
                        .header("Authorization", "Bearer " + formerStudentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void archivedGroupIsReadOnlyAndDeletedGroupRemainsVisibleToOwner() throws Exception {
        ClassGroup group = groupRepository.save(new ClassGroup("Algorithms", "", teacher, "JOIN5678"));

        mockMvc.perform(post("/api/groups/{id}/archive", group.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/groups/join")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"joinCode\":\"JOIN5678\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(delete("/api/groups/{id}", group.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/groups").param("includeDeleted", "true")
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].isActive").value(false));
    }

    @Test
    void rejoinAfterLeavingReactivatesTheSameEnrollment() throws Exception {
        ClassGroup group = groupRepository.save(new ClassGroup("Algorithms", "", teacher, "REJOIN12"));

        mockMvc.perform(post("/api/groups/join")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"joinCode\":\"REJOIN12\"}"))
                .andExpect(status().isOk());
        GroupEnrollment original = enrollmentRepository
                .findByGroupIdAndStudentId(group.getId(), student.getId()).orElseThrow();

        mockMvc.perform(post("/api/groups/{id}/leave", group.getId())
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk());
        GroupEnrollment afterLeave = enrollmentRepository
                .findByGroupIdAndStudentId(group.getId(), student.getId()).orElseThrow();
        assert afterLeave.getStatus() == EnrollmentStatus.LEFT;
        assert afterLeave.getEndedAt() != null;

        mockMvc.perform(post("/api/groups/join")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"joinCode\":\"REJOIN12\"}"))
                .andExpect(status().isOk());
        GroupEnrollment reactivated = enrollmentRepository
                .findByGroupIdAndStudentId(group.getId(), student.getId()).orElseThrow();
        assert reactivated.getId().equals(original.getId());
        assert reactivated.getStatus() == EnrollmentStatus.ACTIVE;
        assert reactivated.getEndedAt() == null;
    }

    @Test
    void removedStudentCanRejoinWithTheSameEnrollment() throws Exception {
        ClassGroup group = groupRepository.save(new ClassGroup("Algorithms", "", teacher, "REMOVE12"));
        GroupEnrollment enrollment = enrollmentRepository.save(new GroupEnrollment(group, student));

        mockMvc.perform(delete("/api/groups/{id}/students/{studentId}", group.getId(), student.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk());
        assert enrollmentRepository.findById(enrollment.getId()).orElseThrow()
                .getStatus() == EnrollmentStatus.REMOVED;

        mockMvc.perform(post("/api/groups/join")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"joinCode\":\"REMOVE12\"}"))
                .andExpect(status().isOk());
        GroupEnrollment reactivated = enrollmentRepository
                .findByGroupIdAndStudentId(group.getId(), student.getId()).orElseThrow();
        assert reactivated.getId().equals(enrollment.getId());
        assert reactivated.getStatus() == EnrollmentStatus.ACTIVE;
    }

    @Test
    void rotatedJoinCodeInvalidatesThePreviousOne() throws Exception {
        groupRepository.save(new ClassGroup("Algorithms", "", teacher, "ROTATE12"));
        ClassGroup group = groupRepository.findByJoinCodeIgnoreCase("ROTATE12").orElseThrow();

        String response = mockMvc.perform(post("/api/groups/{id}/join-code/rotate", group.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.joinCode").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        String newCode = objectMapper.readTree(response).path("data").path("joinCode").asText();
        assert !newCode.equalsIgnoreCase("ROTATE12");

        mockMvc.perform(post("/api/groups/join")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"joinCode\":\"ROTATE12\"}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/groups/join")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("joinCode", newCode))))
                .andExpect(status().isOk());
    }

    @Test
    void restoredGroupStaysArchivedUntilExplicitUnarchive() throws Exception {
        ClassGroup group = groupRepository.save(new ClassGroup("Algorithms", "", teacher, "RESTORE1"));

        mockMvc.perform(delete("/api/groups/{id}", group.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/groups/{id}/restore", group.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isActive").value(true))
                .andExpect(jsonPath("$.data.archived").value(true));

        mockMvc.perform(post("/api/groups/join")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"joinCode\":\"RESTORE1\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/groups/{id}/unarchive", group.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.archived").value(false));

        mockMvc.perform(post("/api/groups/join")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"joinCode\":\"RESTORE1\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void archivedGroupRejectsChangesButStillAllowsRosterRemoval() throws Exception {
        ClassGroup group = groupRepository.save(new ClassGroup("Algorithms", "", teacher, "ARCHIVE1"));
        enrollmentRepository.save(new GroupEnrollment(group, student));

        mockMvc.perform(post("/api/groups/{id}/archive", group.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/groups/{id}", group.getId())
                        .header("Authorization", "Bearer " + teacherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Renamed\",\"description\":\"\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/groups/{id}/join-code/rotate", group.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isBadRequest());

        // Documents current behavior: roster removal skips the read-only check.
        mockMvc.perform(delete("/api/groups/{id}/students/{studentId}", group.getId(), student.getId())
                        .header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isOk());
        assert enrollmentRepository.findByGroupIdAndStudentId(group.getId(), student.getId())
                .orElseThrow().getStatus() == EnrollmentStatus.REMOVED;
    }
}
