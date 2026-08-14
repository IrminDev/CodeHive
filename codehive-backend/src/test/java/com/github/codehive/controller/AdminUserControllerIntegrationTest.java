package com.github.codehive.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.Scope;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.utils.JwtUtil;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class AdminUserControllerIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    private User admin;
    private User student;
    private String adminToken;

    @BeforeEach
    void setUp() {
        admin = new User("Scoped", "Admin", "2026630001", "scoped-admin@example.com",
                passwordEncoder.encode("Pass123!"), Role.ADMIN);
        admin.addScope(Scope.VIEW_USERS);
        admin.addScope(Scope.MANAGE_USER_STATUS);
        admin.addScope(Scope.MANAGE_SCOPES);
        admin.addScope(Scope.CREATE_GROUP);
        admin = userRepository.save(admin);

        student = userRepository.save(new User("Test", "Student", "2026630002", "managed-student@example.com",
                passwordEncoder.encode("Pass123!"), Role.STUDENT));
        adminToken = jwtUtil.generateToken(Map.of("role", "ADMIN"), admin.getEmail());
    }

    @Test
    void scopedAdminListsAndDeactivatesNonAdminUser() throws Exception {
        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());

        mockMvc.perform(delete("/api/admin/users/{id}", student.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        assertThatUserIsInactive();
    }

    @Test
    void regularAdminMayDelegateOnlyExplicitlyHeldScope() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{id}/scopes", student.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"grant\":[\"CREATE_GROUP\"],\"revoke\":[]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.scopes[0]").value("CREATE_GROUP"));

        mockMvc.perform(patch("/api/admin/users/{id}/scopes", student.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"grant\":[\"CREATE_ADMINS\"],\"revoke\":[]}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void administratorCannotManageSelf() throws Exception {
        mockMvc.perform(delete("/api/admin/users/{id}", admin.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void deactivationInvalidatesAnExistingJwt() throws Exception {
        String studentToken = jwtUtil.generateToken(Map.of("role", "STUDENT"), student.getEmail());
        mockMvc.perform(delete("/api/admin/users/{id}", student.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminWithoutUpdateScopeCannotUpdateUser() throws Exception {
        // The test admin holds MANAGE_USER_STATUS/MANAGE_SCOPES but not UPDATE_USERS/UPDATE_ADMINS.
        mockMvc.perform(patch("/api/admin/users/{id}", student.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"New\",\"lastName\":\"Name\","
                                + "\"enrollmentNumber\":\"2026630003\",\"email\":\"new@example.com\"}"))
                .andExpect(status().isForbidden());
    }

    private void assertThatUserIsInactive() {
        org.assertj.core.api.Assertions.assertThat(userRepository.findById(student.getId()).orElseThrow().getIsActive())
                .isFalse();
    }
}
