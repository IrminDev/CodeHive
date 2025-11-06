package com.github.codehive.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.UUID;

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
import com.github.codehive.model.entity.PasswordResetToken;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.request.recovery.ForgotPasswordRequest;
import com.github.codehive.model.request.recovery.RecoveryPasswordRequest;
import com.github.codehive.repository.PasswordResetTokenRepository;
import com.github.codehive.repository.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
@DisplayName("RecoveryPasswordController Integration Tests")
class RecoveryPasswordControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;

    @BeforeEach
    void setUp() {
        // Clean database before each test
        passwordResetTokenRepository.deleteAll();
        userRepository.deleteAll();

        // Create a test user
        testUser = new User();
        testUser.setEmail("testuser@example.com");
        testUser.setName("Test");
        testUser.setLastName("User");
        testUser.setPassword(passwordEncoder.encode("oldpassword123"));
        testUser.setEnrollmentNumber("ENR001");
        testUser.setRole(Role.STUDENT);
        testUser.setIsActive(true);
        userRepository.save(testUser);
    }

    @Nested
    @DisplayName("POST /api/recovery-password/forgot")
    class ForgotPasswordEndpointTests {

        @Test
        @DisplayName("Should return success message for existing user")
        void forgotPassword_WithExistingEmail_ReturnsSuccessMessage() throws Exception {
            // Given
            ForgotPasswordRequest request = new ForgotPasswordRequest();
            request.setEmail("testuser@example.com");

            // When/Then
            mockMvc.perform(post("/api/recovery-password/forgot")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.message").value("Password reset email sent"))
                    .andExpect(jsonPath("$.data.message").value("If the email exists, a password reset link has been sent"));
        }

        @Test
        @DisplayName("Should return same success message for non-existent email (security)")
        void forgotPassword_WithNonExistentEmail_ReturnsSameSuccessMessage() throws Exception {
            // Given
            ForgotPasswordRequest request = new ForgotPasswordRequest();
            request.setEmail("nonexistent@example.com");

            // When/Then - Should not reveal if email exists or not
            mockMvc.perform(post("/api/recovery-password/forgot")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Password reset email sent"))
                    .andExpect(jsonPath("$.data.message").value("If the email exists, a password reset link has been sent"));
        }

        @Test
        @DisplayName("Should create password reset token for existing user")
        void forgotPassword_WithExistingEmail_CreatesToken() throws Exception {
            // Given
            ForgotPasswordRequest request = new ForgotPasswordRequest();
            request.setEmail("testuser@example.com");

            // When
            mockMvc.perform(post("/api/recovery-password/forgot")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            // Then - verify token was created
            var tokens = passwordResetTokenRepository.findAll();
            assert tokens.size() == 1;
            assert tokens.get(0).getUser().getEmail().equals("testuser@example.com");
            assert !tokens.get(0).getUsed();
            assert tokens.get(0).getExpiryDate().isAfter(LocalDateTime.now());
        }

        @Test
        @DisplayName("Should invalidate old tokens when creating new one")
        void forgotPassword_WithExistingTokens_InvalidatesOldTokens() throws Exception {
            // Given - Create an existing token
            PasswordResetToken oldToken = new PasswordResetToken();
            oldToken.setToken(UUID.randomUUID().toString());
            oldToken.setUser(testUser);
            oldToken.setExpiryDate(LocalDateTime.now().plusMinutes(15));
            oldToken.setUsed(false);
            passwordResetTokenRepository.save(oldToken);

            ForgotPasswordRequest request = new ForgotPasswordRequest();
            request.setEmail("testuser@example.com");

            // When
            mockMvc.perform(post("/api/recovery-password/forgot")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            // Then - old token should be marked as used
            PasswordResetToken updatedOldToken = passwordResetTokenRepository.findById(oldToken.getId()).orElseThrow();
            assert updatedOldToken.getUsed();
        }

        @Test
        @DisplayName("Should return 400 with invalid email format")
        void forgotPassword_WithInvalidEmailFormat_ReturnsBadRequest() throws Exception {
            // Given
            ForgotPasswordRequest request = new ForgotPasswordRequest();
            request.setEmail("invalid-email-format");

            // When/Then
            mockMvc.perform(post("/api/recovery-password/forgot")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 with empty email")
        void forgotPassword_WithEmptyEmail_ReturnsBadRequest() throws Exception {
            // Given
            ForgotPasswordRequest request = new ForgotPasswordRequest();
            request.setEmail("");

            // When/Then
            mockMvc.perform(post("/api/recovery-password/forgot")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 with null email")
        void forgotPassword_WithNullEmail_ReturnsBadRequest() throws Exception {
            // Given
            ForgotPasswordRequest request = new ForgotPasswordRequest();
            // email is null

            // When/Then
            mockMvc.perform(post("/api/recovery-password/forgot")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 with malformed JSON")
        void forgotPassword_WithMalformedJSON_ReturnsBadRequest() throws Exception {
            // Given
            String malformedJson = "{\"email\": }";

            // When/Then
            mockMvc.perform(post("/api/recovery-password/forgot")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(malformedJson))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/recovery-password/reset")
    class ResetPasswordEndpointTests {

        @Test
        @DisplayName("Should reset password successfully with valid token")
        void resetPassword_WithValidToken_ResetsPasswordAndReturnsSuccess() throws Exception {
            // Given - Create a valid password reset token
            String tokenValue = UUID.randomUUID().toString();
            PasswordResetToken token = new PasswordResetToken();
            token.setToken(tokenValue);
            token.setUser(testUser);
            token.setExpiryDate(LocalDateTime.now().plusMinutes(15));
            token.setUsed(false);
            passwordResetTokenRepository.save(token);

            RecoveryPasswordRequest request = new RecoveryPasswordRequest();
            request.setToken(tokenValue);
            request.setNewPassword("newpassword123");

            // When
            mockMvc.perform(post("/api/recovery-password/reset")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Password reset successful"))
                    .andExpect(jsonPath("$.data.message").value("Password has been reset successfully"));

            // Then - verify password was updated
            User updatedUser = userRepository.findById(testUser.getId()).orElseThrow();
            assert passwordEncoder.matches("newpassword123", updatedUser.getPassword());
        }

        @Test
        @DisplayName("Should mark token as used after successful reset")
        void resetPassword_WithValidToken_MarksTokenAsUsed() throws Exception {
            // Given
            String tokenValue = UUID.randomUUID().toString();
            PasswordResetToken token = new PasswordResetToken();
            token.setToken(tokenValue);
            token.setUser(testUser);
            token.setExpiryDate(LocalDateTime.now().plusMinutes(15));
            token.setUsed(false);
            passwordResetTokenRepository.save(token);

            RecoveryPasswordRequest request = new RecoveryPasswordRequest();
            request.setToken(tokenValue);
            request.setNewPassword("newpassword123");

            // When
            mockMvc.perform(post("/api/recovery-password/reset")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            // Then - verify token is marked as used
            PasswordResetToken updatedToken = passwordResetTokenRepository.findByToken(tokenValue).orElseThrow();
            assert updatedToken.getUsed();
        }

        @Test
        @DisplayName("Should return 404 with non-existent token")
        void resetPassword_WithNonExistentToken_ReturnsNotFound() throws Exception {
            // Given
            RecoveryPasswordRequest request = new RecoveryPasswordRequest();
            request.setToken(UUID.randomUUID().toString());
            request.setNewPassword("newpassword123");

            // When/Then
            mockMvc.perform(post("/api/recovery-password/reset")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.error").value("Invalid or expired token"));
        }

        @Test
        @DisplayName("Should return 400 with expired token")
        void resetPassword_WithExpiredToken_ReturnsBadRequest() throws Exception {
            // Given - Create an expired token
            String tokenValue = UUID.randomUUID().toString();
            PasswordResetToken token = new PasswordResetToken();
            token.setToken(tokenValue);
            token.setUser(testUser);
            token.setExpiryDate(LocalDateTime.now().minusMinutes(1)); // Expired
            token.setUsed(false);
            passwordResetTokenRepository.save(token);

            RecoveryPasswordRequest request = new RecoveryPasswordRequest();
            request.setToken(tokenValue);
            request.setNewPassword("newpassword123");

            // When/Then
            mockMvc.perform(post("/api/recovery-password/reset")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("Token has expired"));
        }

        @Test
        @DisplayName("Should return 400 with already used token")
        void resetPassword_WithUsedToken_ReturnsBadRequest() throws Exception {
            // Given - Create a used token
            String tokenValue = UUID.randomUUID().toString();
            PasswordResetToken token = new PasswordResetToken();
            token.setToken(tokenValue);
            token.setUser(testUser);
            token.setExpiryDate(LocalDateTime.now().plusMinutes(15));
            token.setUsed(true); // Already used
            passwordResetTokenRepository.save(token);

            RecoveryPasswordRequest request = new RecoveryPasswordRequest();
            request.setToken(tokenValue);
            request.setNewPassword("newpassword123");

            // When/Then
            mockMvc.perform(post("/api/recovery-password/reset")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("Token has already been used"));
        }

        @Test
        @DisplayName("Should return 400 with short password")
        void resetPassword_WithShortPassword_ReturnsBadRequest() throws Exception {
            // Given
            String tokenValue = UUID.randomUUID().toString();
            PasswordResetToken token = new PasswordResetToken();
            token.setToken(tokenValue);
            token.setUser(testUser);
            token.setExpiryDate(LocalDateTime.now().plusMinutes(15));
            token.setUsed(false);
            passwordResetTokenRepository.save(token);

            RecoveryPasswordRequest request = new RecoveryPasswordRequest();
            request.setToken(tokenValue);
            request.setNewPassword("123"); // Too short

            // When/Then
            mockMvc.perform(post("/api/recovery-password/reset")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 with empty password")
        void resetPassword_WithEmptyPassword_ReturnsBadRequest() throws Exception {
            // Given
            String tokenValue = UUID.randomUUID().toString();
            PasswordResetToken token = new PasswordResetToken();
            token.setToken(tokenValue);
            token.setUser(testUser);
            token.setExpiryDate(LocalDateTime.now().plusMinutes(15));
            token.setUsed(false);
            passwordResetTokenRepository.save(token);

            RecoveryPasswordRequest request = new RecoveryPasswordRequest();
            request.setToken(tokenValue);
            request.setNewPassword("");

            // When/Then
            mockMvc.perform(post("/api/recovery-password/reset")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 with null token")
        void resetPassword_WithNullToken_ReturnsBadRequest() throws Exception {
            // Given
            RecoveryPasswordRequest request = new RecoveryPasswordRequest();
            request.setToken(null);
            request.setNewPassword("newpassword123");

            // When/Then
            mockMvc.perform(post("/api/recovery-password/reset")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 400 with null password")
        void resetPassword_WithNullPassword_ReturnsBadRequest() throws Exception {
            // Given
            String tokenValue = UUID.randomUUID().toString();
            RecoveryPasswordRequest request = new RecoveryPasswordRequest();
            request.setToken(tokenValue);
            request.setNewPassword(null);

            // When/Then
            mockMvc.perform(post("/api/recovery-password/reset")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should not allow reusing same token twice")
        void resetPassword_UsingSameTokenTwice_SecondAttemptFails() throws Exception {
            // Given
            String tokenValue = UUID.randomUUID().toString();
            PasswordResetToken token = new PasswordResetToken();
            token.setToken(tokenValue);
            token.setUser(testUser);
            token.setExpiryDate(LocalDateTime.now().plusMinutes(15));
            token.setUsed(false);
            passwordResetTokenRepository.save(token);

            RecoveryPasswordRequest request1 = new RecoveryPasswordRequest();
            request1.setToken(tokenValue);
            request1.setNewPassword("newpassword123");

            RecoveryPasswordRequest request2 = new RecoveryPasswordRequest();
            request2.setToken(tokenValue);
            request2.setNewPassword("anotherpassword123");

            // When - First reset
            mockMvc.perform(post("/api/recovery-password/reset")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request1)))
                    .andExpect(status().isOk());

            // Then - Second reset should fail
            mockMvc.perform(post("/api/recovery-password/reset")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request2)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("Token has already been used"));
        }

        @Test
        @DisplayName("Should encode new password in database")
        void resetPassword_WithValidToken_StoresEncodedPassword() throws Exception {
            // Given
            String tokenValue = UUID.randomUUID().toString();
            PasswordResetToken token = new PasswordResetToken();
            token.setToken(tokenValue);
            token.setUser(testUser);
            token.setExpiryDate(LocalDateTime.now().plusMinutes(15));
            token.setUsed(false);
            passwordResetTokenRepository.save(token);

            RecoveryPasswordRequest request = new RecoveryPasswordRequest();
            request.setToken(tokenValue);
            request.setNewPassword("mynewpassword123");

            // When
            mockMvc.perform(post("/api/recovery-password/reset")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            // Then - verify password is encoded, not plain text
            User updatedUser = userRepository.findById(testUser.getId()).orElseThrow();
            assert !updatedUser.getPassword().equals("mynewpassword123");
            assert passwordEncoder.matches("mynewpassword123", updatedUser.getPassword());
        }
    }

    @Nested
    @DisplayName("Content Type Tests")
    class ContentTypeTests {

        @Test
        @DisplayName("Should reject forgot password request without content type")
        void forgotPassword_WithoutContentType_ReturnsUnsupportedMediaType() throws Exception {
            // Given
            ForgotPasswordRequest request = new ForgotPasswordRequest();
            request.setEmail("testuser@example.com");

            // When/Then
            mockMvc.perform(post("/api/recovery-password/forgot")
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnsupportedMediaType());
        }

        @Test
        @DisplayName("Should reject reset password request with wrong content type")
        void resetPassword_WithWrongContentType_ReturnsUnsupportedMediaType() throws Exception {
            // Given
            RecoveryPasswordRequest request = new RecoveryPasswordRequest();
            request.setToken(UUID.randomUUID().toString());
            request.setNewPassword("newpassword123");

            // When/Then
            mockMvc.perform(post("/api/recovery-password/reset")
                    .contentType(MediaType.APPLICATION_XML)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnsupportedMediaType());
        }
    }

    @Nested
    @DisplayName("Security Tests")
    class SecurityTests {

        @Test
        @DisplayName("Should allow unauthenticated access to forgot password endpoint")
        void forgotPassword_WithoutAuthentication_IsAccessible() throws Exception {
            // Given
            ForgotPasswordRequest request = new ForgotPasswordRequest();
            request.setEmail("testuser@example.com");

            // When/Then
            mockMvc.perform(post("/api/recovery-password/forgot")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Should allow unauthenticated access to reset password endpoint")
        void resetPassword_WithoutAuthentication_IsAccessible() throws Exception {
            // Given
            String tokenValue = UUID.randomUUID().toString();
            PasswordResetToken token = new PasswordResetToken();
            token.setToken(tokenValue);
            token.setUser(testUser);
            token.setExpiryDate(LocalDateTime.now().plusMinutes(15));
            token.setUsed(false);
            passwordResetTokenRepository.save(token);

            RecoveryPasswordRequest request = new RecoveryPasswordRequest();
            request.setToken(tokenValue);
            request.setNewPassword("newpassword123");

            // When/Then
            mockMvc.perform(post("/api/recovery-password/reset")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Should not expose sensitive information in error messages")
        void resetPassword_WithInvalidToken_DoesNotExposeSensitiveInfo() throws Exception {
            // Given
            RecoveryPasswordRequest request = new RecoveryPasswordRequest();
            request.setToken("invalid-token");
            request.setNewPassword("newpassword123");

            // When/Then - Should not reveal database structure or user info
            mockMvc.perform(post("/api/recovery-password/reset")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.error").value("Invalid or expired token"));
        }
    }
}
