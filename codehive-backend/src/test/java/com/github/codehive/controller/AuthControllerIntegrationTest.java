package com.github.codehive.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.request.auth.LoginRequest;
import com.github.codehive.model.request.auth.SignUpRequest;
import com.github.codehive.model.request.auth.UpdatePasswordRequest;
import com.github.codehive.config.TestAsyncConfig;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.service.MailSenderService;
import com.github.codehive.utils.JwtUtil;

import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
@Import(TestAsyncConfig.class)
@DisplayName("AuthController Integration")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @MockitoBean
    private MailSenderService mailSenderService;

    private User testUser;
    private User adminUser;
    private String adminToken;

    @BeforeEach
    void setUp() {
        // Clean up any data committed by @Async CSV processing (runs outside test transaction).
        // Flush immediately so Hibernate sends DELETEs to the DB before subsequent INSERTs
        // (Hibernate's default flush order is inserts-before-deletes, which would cause
        // unique constraint violations).
        userRepository.deleteAll();
        userRepository.flush();

        // Create a test student user
        testUser = new User();
        testUser.setEmail("existing@example.com");
        testUser.setName("Existing");
        testUser.setLastName("User");
        testUser.setPassword(passwordEncoder.encode("password123"));
        testUser.setEnrollmentNumber("ENR001");
        testUser.setRole(Role.STUDENT);
        testUser.setIsActive(true);
        testUser.setTemporaryPassword(false);
        userRepository.save(testUser);

        // Create an admin user for authenticated signup requests
        adminUser = new User();
        adminUser.setEmail("admin@example.com");
        adminUser.setName("Admin");
        adminUser.setLastName("User");
        adminUser.setPassword(passwordEncoder.encode("admin123"));
        adminUser.setEnrollmentNumber("ADM001");
        adminUser.setRole(Role.ADMIN);
        adminUser.setIsActive(true);
        adminUser.setTemporaryPassword(false);
        adminUser = userRepository.save(adminUser);

        // Generate admin JWT token
        java.util.Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("userId", adminUser.getId());
        claims.put("role", adminUser.getRole().name());
        adminToken = jwtUtil.generateToken(claims, adminUser.getEmail());
    }

    @Nested
    @DisplayName("POST /api/auth/login")
    class LoginEndpointTests {

        @Test
        @DisplayName("Returns token and user data for valid credentials with email")
        void login_WithValidCredentialsUsingEmail_ReturnsTokenAndUserData() throws Exception {
            // Given
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setIdentifier("existing@example.com");
            loginRequest.setPassword("password123");

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").value("Login successful"))
                    .andExpect(jsonPath("$.data.token").exists())
                    .andExpect(jsonPath("$.data.token").isNotEmpty())
                    .andExpect(jsonPath("$.data.user.email").value("existing@example.com"))
                    .andExpect(jsonPath("$.data.user.name").value("Existing"))
                    .andExpect(jsonPath("$.data.user.lastName").value("User"))
                    .andExpect(jsonPath("$.data.user.role").value("STUDENT"));
        }

        @Test
        @DisplayName("Returns token and user data for valid credentials with enrollment number")
        void login_WithValidCredentialsUsingEnrollmentNumber_ReturnsTokenAndUserData() throws Exception {
            // Given
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setIdentifier("ENR001");
            loginRequest.setPassword("password123");

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").value("Login successful"))
                    .andExpect(jsonPath("$.data.token").exists())
                    .andExpect(jsonPath("$.data.token").isNotEmpty())
                    .andExpect(jsonPath("$.data.user.email").value("existing@example.com"))
                    .andExpect(jsonPath("$.data.user.name").value("Existing"))
                    .andExpect(jsonPath("$.data.user.lastName").value("User"))
                    .andExpect(jsonPath("$.data.user.role").value("STUDENT"));
        }

        @Test
        @DisplayName("Returns 401 when password is invalid")
        void login_WithInvalidPassword_ReturnsUnauthorized() throws Exception {
            // Given
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setIdentifier("existing@example.com");
            loginRequest.setPassword("wrongpassword");

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.error").value("Invalid email or password"));
        }

        @Test
        @DisplayName("Returns 401 when identifier does not exist")
        void login_WithNonExistentIdentifier_ReturnsUnauthorized() throws Exception {
            // Given
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setIdentifier("nonexistent@example.com");
            loginRequest.setPassword("password123");

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.error").value("Invalid email or password"));
        }

        @Test
        @DisplayName("Returns 400 when identifier is empty")
        void login_WithEmptyIdentifier_ReturnsBadRequest() throws Exception {
            // Given
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setIdentifier("");
            loginRequest.setPassword("password123");

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Returns 400 when password is empty")
        void login_WithEmptyPassword_ReturnsBadRequest() throws Exception {
            // Given
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setIdentifier("existing@example.com");
            loginRequest.setPassword("");

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Returns 400 when fields are null")
        void login_WithNullFields_ReturnsBadRequest() throws Exception {
            // Given
            LoginRequest loginRequest = new LoginRequest();
            // email and password are null

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Returns 400 when JSON is malformed")
        void login_WithMalformedJSON_ReturnsBadRequest() throws Exception {
            // Given
            String malformedJson = "{\"email\": \"test@example.com\", \"password\": }";

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(malformedJson))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/signup")
    class SignUpEndpointTests {

        @Test
        @DisplayName("Returns 201 with user data when admin registers a new user")
        void signup_WithAdminAndValidData_ReturnsCreated() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("newuser@example.com");
            signUpRequest.setName("New");
            signUpRequest.setFatherLastName("User");
            signUpRequest.setMotherLastName("Test");
            signUpRequest.setEnrollmentNumber("ENR002");
            signUpRequest.setRole(Role.STUDENT);

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.message").value("Registration successful"))
                    .andExpect(jsonPath("$.data.email").value("newuser@example.com"))
                    .andExpect(jsonPath("$.data.name").value("New"))
                    .andExpect(jsonPath("$.data.lastName").value("User Test"))
                    .andExpect(jsonPath("$.data.enrollmentNumber").value("ENR002"))
                    .andExpect(jsonPath("$.data.role").value("STUDENT"))
                    .andExpect(jsonPath("$.data.isActive").value(true))
                    .andExpect(jsonPath("$.data.temporaryPassword").value(true));
        }

        @Test
        @DisplayName("Returns 403 when non-admin tries to register a user")
        void signup_WithNonAdmin_ReturnsForbidden() throws Exception {
            // Given - get a student token
            java.util.Map<String, Object> claims = new java.util.HashMap<>();
            claims.put("userId", testUser.getId());
            claims.put("role", testUser.getRole().name());
            String studentToken = jwtUtil.generateToken(claims, testUser.getEmail());

            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("newuser@example.com");
            signUpRequest.setName("New");
            signUpRequest.setFatherLastName("User");
            signUpRequest.setMotherLastName("Test");
            signUpRequest.setEnrollmentNumber("ENR002");
            signUpRequest.setRole(Role.STUDENT);

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .header("Authorization", "Bearer " + studentToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Returns 403 when unauthenticated user tries to register")
        void signup_WithoutAuthentication_ReturnsForbidden() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("newuser@example.com");
            signUpRequest.setName("New");
            signUpRequest.setFatherLastName("User");
            signUpRequest.setMotherLastName("Test");
            signUpRequest.setEnrollmentNumber("ENR002");
            signUpRequest.setRole(Role.STUDENT);

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Returns 409 when email already exists")
        void signup_WithExistingEmail_ReturnsConflict() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("existing@example.com");
            signUpRequest.setName("Another");
            signUpRequest.setFatherLastName("User");
            signUpRequest.setMotherLastName("Test");
            signUpRequest.setEnrollmentNumber("ENR999");
            signUpRequest.setRole(Role.STUDENT);

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.error").value("Email already exists"));
        }

        @Test
        @DisplayName("Returns 409 when enrollment number already exists")
        void signup_WithExistingEnrollmentNumber_ReturnsConflict() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("newuser@example.com");
            signUpRequest.setName("Another");
            signUpRequest.setFatherLastName("User");
            signUpRequest.setMotherLastName("Test");
            signUpRequest.setEnrollmentNumber("ENR001");
            signUpRequest.setRole(Role.STUDENT);

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.error").value("Enrollment number already exists"));
        }

        @Test
        @DisplayName("Returns 400 when email format is invalid")
        void signup_WithInvalidEmailFormat_ReturnsBadRequest() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("invalid-email-format");
            signUpRequest.setName("Test");
            signUpRequest.setFatherLastName("User");
            signUpRequest.setMotherLastName("Test");
            signUpRequest.setEnrollmentNumber("ENR003");
            signUpRequest.setRole(Role.STUDENT);

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Returns 400 when required fields are empty")
        void signup_WithEmptyRequiredFields_ReturnsBadRequest() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("");
            signUpRequest.setName("");
            signUpRequest.setFatherLastName("");
            signUpRequest.setMotherLastName("");
            signUpRequest.setEnrollmentNumber("");

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Returns 400 when required fields are null")
        void signup_WithNullRequiredFields_ReturnsBadRequest() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            // All fields are null

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Stores encoded password in database")
        void signup_WithValidData_StoresEncodedPassword() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("newuser@example.com");
            signUpRequest.setName("New");
            signUpRequest.setFatherLastName("User");
            signUpRequest.setMotherLastName("Test");
            signUpRequest.setEnrollmentNumber("ENR003");
            signUpRequest.setRole(Role.STUDENT);

            // When
            mockMvc.perform(post("/api/auth/signup")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isCreated());

            // Then - verify password is encoded (not null and not plain text)
            User savedUser = userRepository.findByEmail("newuser@example.com").orElseThrow();
            assert savedUser.getPassword() != null;
            assert savedUser.getPassword().startsWith("$2a$") || savedUser.getPassword().startsWith("$2b$");
        }

        @Test
        @DisplayName("Can register users with different roles")
        void signup_WithTeacherRole_RegistersTeacher() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("teacher@example.com");
            signUpRequest.setName("Teacher");
            signUpRequest.setFatherLastName("Last");
            signUpRequest.setMotherLastName("Name");
            signUpRequest.setEnrollmentNumber("T001");
            signUpRequest.setRole(Role.TEACHER);

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.role").value("TEACHER"));
        }
    }

    @Nested
    @DisplayName("POST /api/auth/signup/csv")
    class CsvSignUpEndpointTests {

        @Test
        @DisplayName("Returns 202 with taskId for valid CSV")
        void signupCsv_WithValidCsv_ReturnsAccepted() throws Exception {
            // Given
            String csv = "STUDENT,Juan,Garcia,Lopez,20230001,juan@example.com\n"
                       + "TEACHER,Maria,Hernandez,Ruiz,T00001,maria@example.com\n";
            MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv",
                    csv.getBytes(StandardCharsets.UTF_8));

            // When/Then
            mockMvc.perform(multipart("/api/auth/signup/csv")
                    .file(file)
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isAccepted())
                    .andExpect(jsonPath("$.message").value("CSV processing started"))
                    .andExpect(jsonPath("$.data.taskId").exists())
                    .andExpect(jsonPath("$.data.taskId").isNotEmpty());
        }

        @Test
        @DisplayName("Returns 403 when non-admin uploads CSV")
        void signupCsv_WithNonAdmin_ReturnsForbidden() throws Exception {
            // Given
            java.util.Map<String, Object> claims = new java.util.HashMap<>();
            claims.put("userId", testUser.getId());
            claims.put("role", testUser.getRole().name());
            String studentToken = jwtUtil.generateToken(claims, testUser.getEmail());

            String csv = "STUDENT,Juan,Garcia,Lopez,20230001,juan@example.com\n";
            MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv",
                    csv.getBytes(StandardCharsets.UTF_8));

            // When/Then
            mockMvc.perform(multipart("/api/auth/signup/csv")
                    .file(file)
                    .header("Authorization", "Bearer " + studentToken))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Returns 403 when unauthenticated user uploads CSV")
        void signupCsv_WithoutAuthentication_ReturnsForbidden() throws Exception {
            // Given
            String csv = "STUDENT,Juan,Garcia,Lopez,20230001,juan@example.com\n";
            MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv",
                    csv.getBytes(StandardCharsets.UTF_8));

            // When/Then
            mockMvc.perform(multipart("/api/auth/signup/csv")
                    .file(file))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Returns 202 and processes CSV with errors asynchronously")
        void signupCsv_WithMixedRows_ReturnsAccepted() throws Exception {
            // Given
            String csv = "STUDENT,Juan,Garcia,Lopez,20230001,juan@example.com\n"
                       + "INVALID,Bad,Data,Row,20230002,bad@example.com\n"
                       + "TEACHER,Maria,Hernandez,Ruiz,T00001,maria@example.com\n";
            MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv",
                    csv.getBytes(StandardCharsets.UTF_8));

            // When/Then - endpoint returns accepted with taskId
            mockMvc.perform(multipart("/api/auth/signup/csv")
                    .file(file)
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isAccepted())
                    .andExpect(jsonPath("$.data.taskId").exists());
        }

        @Test
        @DisplayName("Returns 202 for CSV with existing email")
        void signupCsv_WithExistingEmail_ReturnsAccepted() throws Exception {
            // Given
            String csv = "STUDENT,Existing,User,Test,20230099,existing@example.com\n";
            MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv",
                    csv.getBytes(StandardCharsets.UTF_8));

            // When/Then - endpoint accepts and processes asynchronously
            mockMvc.perform(multipart("/api/auth/signup/csv")
                    .file(file)
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isAccepted())
                    .andExpect(jsonPath("$.data.taskId").exists());
        }


    }

    @Nested
    @DisplayName("Content Type Tests")
    class ContentTypeTests {

        @Test
        @DisplayName("Returns 415 when content-type header is missing")
        void login_WithoutContentType_ReturnsUnsupportedMediaType() throws Exception {
            // Given
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setIdentifier("existing@example.com");
            loginRequest.setPassword("password123");

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isUnsupportedMediaType());
        }

        @Test
        @DisplayName("Returns 415 when content-type is not JSON for signup")
        void signup_WithWrongContentType_ReturnsUnsupportedMediaType() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("newuser@example.com");
            signUpRequest.setName("New");
            signUpRequest.setFatherLastName("User");
            signUpRequest.setMotherLastName("Test");
            signUpRequest.setEnrollmentNumber("ENR002");
            signUpRequest.setRole(Role.STUDENT);

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_XML)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isUnsupportedMediaType());
        }
    }

    @Nested
    @DisplayName("Security Tests")
    class SecurityTests {

        @Test
        @DisplayName("Login allows unauthenticated access")
        void login_WithoutAuthentication_IsAccessible() throws Exception {
            // Given
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setIdentifier("existing@example.com");
            loginRequest.setPassword("password123");

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Signup requires admin authentication")
        void signup_WithoutAuthentication_ReturnsForbidden() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("newuser@example.com");
            signUpRequest.setName("New");
            signUpRequest.setFatherLastName("User");
            signUpRequest.setMotherLastName("Test");
            signUpRequest.setEnrollmentNumber("ENR002");
            signUpRequest.setRole(Role.STUDENT);

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Does not expose password in login response")
        void login_SuccessfulLogin_DoesNotExposePassword() throws Exception {
            // Given
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setIdentifier("existing@example.com");
            loginRequest.setPassword("password123");

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.user.password").doesNotExist());
        }

        @Test
        @DisplayName("Does not expose password in signup response")
        void signup_SuccessfulSignup_DoesNotExposePassword() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("newuser@example.com");
            signUpRequest.setName("New");
            signUpRequest.setFatherLastName("User");
            signUpRequest.setMotherLastName("Test");
            signUpRequest.setEnrollmentNumber("ENR002");
            signUpRequest.setRole(Role.STUDENT);

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.password").doesNotExist());
        }
    }

    @Nested
    @DisplayName("PUT /api/auth/me/password")
    class UpdatePasswordEndpointTests {

        @Test
        @DisplayName("Returns 200 and updates password with valid request")
        void updatePassword_WithValidRequest_ReturnsOk() throws Exception {
            // Given
            UpdatePasswordRequest request = new UpdatePasswordRequest();
            request.setCurrentPassword("admin123");
            request.setNewPassword("newAdminPass456");

            // When/Then
            mockMvc.perform(put("/api/auth/me/password")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Password updated successfully"));

            // Verify password actually changed
            User updatedAdmin = userRepository.findByEmail("admin@example.com").orElseThrow();
            assert passwordEncoder.matches("newAdminPass456", updatedAdmin.getPassword());
        }

        @Test
        @DisplayName("Returns 401 when current password is incorrect")
        void updatePassword_WithIncorrectCurrentPassword_ReturnsUnauthorized() throws Exception {
            // Given
            UpdatePasswordRequest request = new UpdatePasswordRequest();
            request.setCurrentPassword("wrongPassword");
            request.setNewPassword("newAdminPass456");

            // When/Then
            mockMvc.perform(put("/api/auth/me/password")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.error").value("Incorrect current password"));
        }

        @Test
        @DisplayName("Returns 403 when token is missing")
        void updatePassword_WithoutToken_ReturnsForbidden() throws Exception {
            // Given
            UpdatePasswordRequest request = new UpdatePasswordRequest();
            request.setCurrentPassword("admin123");
            request.setNewPassword("newAdminPass456");

            // When/Then
            mockMvc.perform(put("/api/auth/me/password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden());
        }
        
        @Test
        @DisplayName("Returns 400 when validation fails (empty password)")
        void updatePassword_WithEmptyNewPassword_ReturnsBadRequest() throws Exception {
            // Given
            UpdatePasswordRequest request = new UpdatePasswordRequest();
            request.setCurrentPassword("admin123");
            request.setNewPassword(""); // Invalid

            // When/Then
            mockMvc.perform(put("/api/auth/me/password")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }
}
