package com.github.codehive.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;

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
}
