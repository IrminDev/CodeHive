package com.github.codehive.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import java.util.UUID;

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
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.Scope;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.GroupDeletionReason;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.utils.JwtUtil;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class AdminUserControllerIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private ClassGroupRepository groupRepository;
    @Autowired private GroupEnrollmentRepository enrollmentRepository;
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
        admin.addScope(Scope.UPDATE_USERS);
        admin.addScope(Scope.CHECK_ANALYTICS);
        admin.addScope(Scope.VIEW_AUDIT_LOG);
        admin = userRepository.save(admin);

        student = new User("Test", "Student", "2026630002", "managed-student@example.com",
                passwordEncoder.encode("Pass123!"), Role.STUDENT);
        student = userRepository.save(student);
        adminToken = jwtUtil.generateToken(Map.of("role", "ADMIN"), admin.getEmail());
    }

    @Test
    void scopedAdminListsAndDeletesNonAdminUser() throws Exception {
        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());

        mockMvc.perform(patch("/api/admin/users/{id}/status", student.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELETED\",\"reason\":\"Confirmed account removal request\"}"))
                .andExpect(status().isOk());

        assertThatUserIsInactive();
    }

    @Test
    void listsEnrolledGroupsUsingGroupCreationDateSort() throws Exception {
        ClassGroup group = groupRepository.save(new ClassGroup(
                "Enrolled group", "Admin resource inspection", admin, "DEFGHJKM"));
        enrollmentRepository.save(new GroupEnrollment(group, student));

        mockMvc.perform(get("/api/admin/users/{id}/groups", student.getId())
                        .param("relationship", "ENROLLED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(group.getId().toString()))
                .andExpect(jsonPath("$.data.content[0].relationship").value("ENROLLED"));
    }

    @Test
    void regularAdminMayDelegateOnlyExplicitlyHeldScope() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{id}/scopes", student.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"grant\":[\"CREATE_GROUP\"],\"revoke\":[],"
                                + "\"reason\":\"Teacher needs group creation\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.scopes[0]").value("CREATE_GROUP"));

        mockMvc.perform(patch("/api/admin/users/{id}/scopes", student.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"grant\":[\"CREATE_ADMINS\"],\"revoke\":[],"
                                + "\"reason\":\"Attempt unsupported delegation\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void administratorCannotManageSelf() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{id}/status", admin.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELETED\",\"reason\":\"Attempt own account deletion\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void deletionInvalidatesAnExistingJwt() throws Exception {
        String studentToken = jwtUtil.generateToken(Map.of("role", "STUDENT"), student.getEmail());
        mockMvc.perform(patch("/api/admin/users/{id}/status", student.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELETED\",\"reason\":\"Confirmed account removal request\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void blockingOwnerArchivesGroupsAndUnblockingDoesNotRestoreThem() throws Exception {
        User teacher = new User("Group", "Owner", "TEA-001", "group-owner@example.com",
                passwordEncoder.encode("Pass123!"), Role.TEACHER);
        teacher = userRepository.save(teacher);
        ClassGroup group = new ClassGroup("Backend", "Admin lifecycle", teacher, "ABCDEFGH");
        group = groupRepository.save(group);
        String teacherToken = jwtUtil.generateToken(Map.of("role", "TEACHER"), teacher.getEmail());

        updateStatus(teacher.getId(), "BLOCKED", "Repeated abuse confirmed by administrator")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.status").value("BLOCKED"));
        org.assertj.core.api.Assertions.assertThat(groupRepository.findById(group.getId()).orElseThrow().getArchived())
                .isTrue();
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + teacherToken))
                .andExpect(status().isForbidden());

        updateStatus(teacher.getId(), "ACTIVE", "Manual review approved account reactivation")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.status").value("ACTIVE"));
        org.assertj.core.api.Assertions.assertThat(groupRepository.findById(group.getId()).orElseThrow().getArchived())
                .isTrue();
    }

    @Test
    void teacherToStudentPreservesOwnedGroupsAndMandatoryScope() throws Exception {
        User teacher = userRepository.save(new User("Role", "Teacher", "TEA-002", "role-teacher@example.com",
                passwordEncoder.encode("Pass123!"), Role.TEACHER));
        groupRepository.save(new ClassGroup("Owned", null, teacher, "CDEFGHJK"));

        mockMvc.perform(patch("/api/admin/users/{id}/role", teacher.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"STUDENT\",\"enrollmentNumber\":\"2026630003\","
                                + "\"reason\":\"Requested institutional role correction\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.role").value("STUDENT"))
                .andExpect(jsonPath("$.data.user.scopes[0]").value("CREATE_GROUP"));
    }

    @Test
    void studentRoleChangeRequiresConfirmationAndCancelsEnrollment() throws Exception {
        User owner = userRepository.save(new User("Group", "Owner", "TEA-003", "cancel-owner@example.com",
                passwordEncoder.encode("Pass123!"), Role.TEACHER));
        ClassGroup group = groupRepository.save(new ClassGroup("Role change", null, owner, "EFGHJKLM"));
        GroupEnrollment enrollment = enrollmentRepository.save(new GroupEnrollment(group, student));

        mockMvc.perform(patch("/api/admin/users/{id}/role", student.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"TEACHER\",\"enrollmentNumber\":\"TEA-004\","
                                + "\"reason\":\"Approved institutional role correction\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(patch("/api/admin/users/{id}/role", student.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"TEACHER\",\"enrollmentNumber\":\"TEA-004\","
                                + "\"reason\":\"Approved institutional role correction\","
                                + "\"confirmEnrollmentCancellation\":true}"))
                .andExpect(status().isOk());

        GroupEnrollment cancelled = enrollmentRepository.findById(enrollment.getId()).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(cancelled.getStatus()).isEqualTo(EnrollmentStatus.CANCELLED);
        org.assertj.core.api.Assertions.assertThat(cancelled.getEndedAt()).isNotNull();
    }

    @Test
    void revokingStudentCreateGroupTerminallyDeletesOwnedGroups() throws Exception {
        student.addScope(Scope.CREATE_GROUP);
        userRepository.save(student);
        ClassGroup group = groupRepository.save(new ClassGroup("Scoped owner", null, student, "FGHJKLMN"));

        mockMvc.perform(patch("/api/admin/users/{id}/scopes", student.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"grant\":[],\"revoke\":[\"CREATE_GROUP\"],"
                                + "\"reason\":\"Approved capability revocation request\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(patch("/api/admin/users/{id}/scopes", student.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"grant\":[],\"revoke\":[\"CREATE_GROUP\"],"
                                + "\"reason\":\"Approved capability revocation request\","
                                + "\"confirmOwnedGroupDeletion\":true}"))
                .andExpect(status().isOk());

        ClassGroup deleted = groupRepository.findById(group.getId()).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(deleted.getIsActive()).isFalse();
        org.assertj.core.api.Assertions.assertThat(deleted.getDeletionReason())
                .isEqualTo(GroupDeletionReason.SCOPE_REVOKED);
    }

    @Test
    void teacherCreateGroupScopeCannotBeRevoked() throws Exception {
        User teacher = userRepository.save(new User("Required", "Scope", "TEA-005", "required-scope@example.com",
                passwordEncoder.encode("Pass123!"), Role.TEACHER));

        mockMvc.perform(patch("/api/admin/users/{id}/scopes", teacher.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"grant\":[],\"revoke\":[\"CREATE_GROUP\"],"
                                + "\"reason\":\"Attempt forbidden teacher scope removal\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void promotionToAdminTerminallyDeletesOwnedGroupsAndRemovesScope() throws Exception {
        admin.addScope(Scope.CREATE_ADMINS);
        userRepository.save(admin);
        student.addScope(Scope.CREATE_GROUP);
        userRepository.save(student);
        ClassGroup group = groupRepository.save(new ClassGroup("Promoted owner", null, student, "GHJKLMNP"));

        mockMvc.perform(patch("/api/admin/users/{id}/role", student.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"ADMIN\",\"enrollmentNumber\":\"ADM-006\","
                                + "\"reason\":\"Approved administrative role promotion\","
                                + "\"confirmOwnedGroupDeletion\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.role").value("ADMIN"))
                .andExpect(jsonPath("$.data.user.scopes").isEmpty());

        ClassGroup deleted = groupRepository.findById(group.getId()).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(deleted.getDeletionReason())
                .isEqualTo(GroupDeletionReason.ROLE_CHANGED_TO_ADMIN);
    }

    @Test
    void deletedUserIsHiddenFromAdminReadsAndOwnedGroupIsSoftDeleted() throws Exception {
        ClassGroup group = new ClassGroup("Student-owned", null, student, "BCDEFGHJ");
        group = groupRepository.save(group);

        updateStatus(student.getId(), "DELETED", "Confirmed account deletion requested by owner")
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/users/{id}", student.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id=='" + student.getId() + "')]").isEmpty());
        ClassGroup deleted = groupRepository.findById(group.getId()).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(deleted.getIsActive()).isFalse();
        org.assertj.core.api.Assertions.assertThat(deleted.getArchived()).isTrue();
    }

    @Test
    void statisticsAndAuditEndpointsExposeOperationalAdminData() throws Exception {
        updateStatus(student.getId(), "BLOCKED", "Repeated abuse confirmed by administrator")
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/statistics")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.users.blocked").value(1));
        mockMvc.perform(get("/api/admin/audit-events")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].action").value("USER_BLOCKED"));
    }

    private org.springframework.test.web.servlet.ResultActions updateStatus(
            UUID userId, String status, String reason) throws Exception {
        return mockMvc.perform(patch("/api/admin/users/{id}/status", userId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"" + status + "\",\"reason\":\"" + reason + "\"}"));
    }

    private void assertThatUserIsInactive() {
        org.assertj.core.api.Assertions.assertThat(userRepository.findById(student.getId()).orElseThrow().getIsActive())
                .isFalse();
    }
}
