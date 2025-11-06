package com.github.codehive.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.request.auth.LoginRequest;
import com.github.codehive.model.request.auth.SignUpRequest;
import com.github.codehive.repository.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
@DisplayName("AuthController Integration Tests")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;

    @BeforeEach
    void setUp() {
        // Clean database before each test
        userRepository.deleteAll();

        // Create a test user
        testUser = new User();
        testUser.setEmail("existing@example.com");
        testUser.setName("Existing");
        testUser.setLastName("User");
        testUser.setPassword(passwordEncoder.encode("password123"));
        testUser.setEnrollmentNumber("ENR001");
        testUser.setRole(Role.STUDENT);
        testUser.setIsActive(true);
        userRepository.save(testUser);
    }

    @Nested
    @DisplayName("POST /api/auth/login")
    class LoginEndpointTests {

        @Test
        @DisplayName("Should login successfully with valid credentials")
        void login_WithValidCredentials_ReturnsTokenAndUserData() throws Exception {
            // Given
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setEmail("existing@example.com");
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
        @DisplayName("Should return 401 with invalid password")
        void login_WithInvalidPassword_ReturnsUnauthorized() throws Exception {
            // Given
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setEmail("existing@example.com");
            loginRequest.setPassword("wrongpassword");

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.error").value("Invalid email or password"));
        }

        @Test
        @DisplayName("Should return 401 with non-existent email")
        void login_WithNonExistentEmail_ReturnsUnauthorized() throws Exception {
            // Given
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setEmail("nonexistent@example.com");
            loginRequest.setPassword("password123");

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.error").value("Invalid email or password"));
        }

        @Test
        @DisplayName("Should return 400 with invalid email format")
        void login_WithInvalidEmailFormat_ReturnsBadRequest() throws Exception {
            // Given
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setEmail("invalid-email");
            loginRequest.setPassword("password123");

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").exists());
        }

        @Test
        @DisplayName("Should return 400 with empty email")
        void login_WithEmptyEmail_ReturnsBadRequest() throws Exception {
            // Given
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setEmail("");
            loginRequest.setPassword("password123");

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 with empty password")
        void login_WithEmptyPassword_ReturnsBadRequest() throws Exception {
            // Given
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setEmail("existing@example.com");
            loginRequest.setPassword("");

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 with null fields")
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
        @DisplayName("Should return 400 with malformed JSON")
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
        @DisplayName("Should register new user successfully")
        void signup_WithValidData_ReturnsCreatedAndToken() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("newuser@example.com");
            signUpRequest.setName("New");
            signUpRequest.setLastName("User");
            signUpRequest.setPassword("newpassword123");
            signUpRequest.setEnrollmentNumber("ENR002");

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.message").value("Registration successful"))
                    .andExpect(jsonPath("$.data.token").exists())
                    .andExpect(jsonPath("$.data.token").isNotEmpty())
                    .andExpect(jsonPath("$.data.user.email").value("newuser@example.com"))
                    .andExpect(jsonPath("$.data.user.name").value("New"))
                    .andExpect(jsonPath("$.data.user.lastName").value("User"))
                    .andExpect(jsonPath("$.data.user.enrollmentNumber").value("ENR002"))
                    .andExpect(jsonPath("$.data.user.role").value("STUDENT"))
                    .andExpect(jsonPath("$.data.user.isActive").value(true));
        }

        @Test
        @DisplayName("Should return 409 when email already exists")
        void signup_WithExistingEmail_ReturnsConflict() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("existing@example.com"); // Email already in use
            signUpRequest.setName("Another");
            signUpRequest.setLastName("User");
            signUpRequest.setPassword("password123");
            signUpRequest.setEnrollmentNumber("ENR999");

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.error").value("Email already exists"));
        }

        @Test
        @DisplayName("Should return 409 when enrollment number already exists")
        void signup_WithExistingEnrollmentNumber_ReturnsConflict() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("newuser@example.com");
            signUpRequest.setName("Another");
            signUpRequest.setLastName("User");
            signUpRequest.setPassword("password123");
            signUpRequest.setEnrollmentNumber("ENR001"); // Enrollment number already in use

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.error").value("Enrollment number already exists"));
        }

        @Test
        @DisplayName("Should return 400 with invalid email format")
        void signup_WithInvalidEmailFormat_ReturnsBadRequest() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("invalid-email-format");
            signUpRequest.setName("Test");
            signUpRequest.setLastName("User");
            signUpRequest.setPassword("password123");
            signUpRequest.setEnrollmentNumber("ENR003");

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 with short password")
        void signup_WithShortPassword_ReturnsBadRequest() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("newuser@example.com");
            signUpRequest.setName("Test");
            signUpRequest.setLastName("User");
            signUpRequest.setPassword("123"); // Too short
            signUpRequest.setEnrollmentNumber("ENR003");

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 with empty required fields")
        void signup_WithEmptyRequiredFields_ReturnsBadRequest() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("");
            signUpRequest.setName("");
            signUpRequest.setLastName("");
            signUpRequest.setPassword("");
            signUpRequest.setEnrollmentNumber("");

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 with null required fields")
        void signup_WithNullRequiredFields_ReturnsBadRequest() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            // All fields are null

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should store password encoded in database")
        void signup_WithValidData_StoresEncodedPassword() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("newuser@example.com");
            signUpRequest.setName("New");
            signUpRequest.setLastName("User");
            signUpRequest.setPassword("plainpassword123");
            signUpRequest.setEnrollmentNumber("ENR003");

            // When
            mockMvc.perform(post("/api/auth/signup")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isCreated());

            // Then - verify password is encoded
            User savedUser = userRepository.findByEmail("newuser@example.com").orElseThrow();
            // Password should not be stored in plain text
            assert !savedUser.getPassword().equals("plainpassword123");
            // Password should be encoded and verifiable
            assert passwordEncoder.matches("plainpassword123", savedUser.getPassword());
        }
    }

    @Nested
    @DisplayName("Content Type Tests")
    class ContentTypeTests {

        @Test
        @DisplayName("Should reject login request without content type")
        void login_WithoutContentType_ReturnsUnsupportedMediaType() throws Exception {
            // Given
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setEmail("existing@example.com");
            loginRequest.setPassword("password123");

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isUnsupportedMediaType());
        }

        @Test
        @DisplayName("Should reject signup request with wrong content type")
        void signup_WithWrongContentType_ReturnsUnsupportedMediaType() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("newuser@example.com");
            signUpRequest.setName("New");
            signUpRequest.setLastName("User");
            signUpRequest.setPassword("password123");
            signUpRequest.setEnrollmentNumber("ENR002");

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .contentType(MediaType.APPLICATION_XML)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isUnsupportedMediaType());
        }
    }

    @Nested
    @DisplayName("Security Tests")
    class SecurityTests {

        @Test
        @DisplayName("Should allow unauthenticated access to login endpoint")
        void login_WithoutAuthentication_IsAccessible() throws Exception {
            // Given
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setEmail("existing@example.com");
            loginRequest.setPassword("password123");

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Should allow unauthenticated access to signup endpoint")
        void signup_WithoutAuthentication_IsAccessible() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("newuser@example.com");
            signUpRequest.setName("New");
            signUpRequest.setLastName("User");
            signUpRequest.setPassword("password123");
            signUpRequest.setEnrollmentNumber("ENR002");

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("Should not expose password in login response")
        void login_SuccessfulLogin_DoesNotExposePassword() throws Exception {
            // Given
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setEmail("existing@example.com");
            loginRequest.setPassword("password123");

            // When/Then
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.user.password").doesNotExist());
        }

        @Test
        @DisplayName("Should not expose password in signup response")
        void signup_SuccessfulSignup_DoesNotExposePassword() throws Exception {
            // Given
            SignUpRequest signUpRequest = new SignUpRequest();
            signUpRequest.setEmail("newuser@example.com");
            signUpRequest.setName("New");
            signUpRequest.setLastName("User");
            signUpRequest.setPassword("password123");
            signUpRequest.setEnrollmentNumber("ENR002");

            // When/Then
            mockMvc.perform(post("/api/auth/signup")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(signUpRequest)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.user.password").doesNotExist());
        }
    }
}
