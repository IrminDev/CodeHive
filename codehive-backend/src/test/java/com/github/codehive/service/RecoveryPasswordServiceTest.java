package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.github.codehive.model.entity.PasswordResetToken;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.model.exception.recovery.ExpiredRecoveryTokenException;
import com.github.codehive.model.exception.recovery.TokenAlreadyUsedException;
import com.github.codehive.model.exception.recovery.TokenNotFoundException;
import com.github.codehive.repository.PasswordResetTokenRepository;
import com.github.codehive.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("RecoveryPasswordService Unit Tests")
class RecoveryPasswordServiceTest {

    @Mock
    private MailSenderService mailSenderService;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private RecoveryPasswordService recoveryPasswordService;

    private User testUser;
    private PasswordResetToken validToken;

    @BeforeEach
    void setUp() {
        // Setup test user
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setPassword("oldEncodedPassword");
        testUser.setName("John");
        testUser.setLastName("Doe");
        testUser.setEnrollmentNumber("ENR001");
        testUser.setRole(Role.STUDENT);
        testUser.setIsActive(true);

        // Setup valid token
        validToken = new PasswordResetToken();
        validToken.setId(1L);
        validToken.setToken("valid-token-123");
        validToken.setExpiryDate(LocalDateTime.now().plusMinutes(10));
        validToken.setUsed(false);
        validToken.setUser(testUser);
    }

    @Nested
    @DisplayName("Send Password Reset Email Tests")
    class SendPasswordResetEmailTests {

        @Test
        @DisplayName("Should send reset email for valid active user")
        void sendPasswordResetEmail_WithValidActiveUser_SendsEmailAndCreatesToken() {
            // Given
            String email = "test@example.com";
            when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));
            when(passwordResetTokenRepository.findByUserAndUsedFalse(testUser)).thenReturn(Collections.emptyList());

            // When
            recoveryPasswordService.sendPasswordResetEmail(email);

            // Then
            ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
            verify(userRepository).findByEmail(email);
            verify(passwordResetTokenRepository).findByUserAndUsedFalse(testUser);
            verify(passwordResetTokenRepository).save(tokenCaptor.capture());
            verify(mailSenderService).sendPasswordResetEmail(eq(email), anyString());

            PasswordResetToken savedToken = tokenCaptor.getValue();
            assertThat(savedToken.getToken()).isNotNull();
            assertThat(savedToken.getUser()).isEqualTo(testUser);
            assertThat(savedToken.getUsed()).isFalse();
            assertThat(savedToken.getExpiryDate()).isAfter(LocalDateTime.now());
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void sendPasswordResetEmail_WithNonExistentUser_ThrowsEntityNotFoundException() {
            // Given
            String email = "nonexistent@example.com";
            when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> recoveryPasswordService.sendPasswordResetEmail(email))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("User not found with email");

            verify(userRepository).findByEmail(email);
            verify(passwordResetTokenRepository, never()).save(any());
            verify(mailSenderService, never()).sendPasswordResetEmail(anyString(), anyString());
        }

        @Test
        @DisplayName("Should throw exception when user is inactive")
        void sendPasswordResetEmail_WithInactiveUser_ThrowsEntityNotFoundException() {
            // Given
            String email = "inactive@example.com";
            testUser.setIsActive(false);
            when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));

            // When & Then
            assertThatThrownBy(() -> recoveryPasswordService.sendPasswordResetEmail(email))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("User account is inactive");

            verify(userRepository).findByEmail(email);
            verify(passwordResetTokenRepository, never()).save(any());
            verify(mailSenderService, never()).sendPasswordResetEmail(anyString(), anyString());
        }

        @Test
        @DisplayName("Should invalidate old unused tokens before creating new one")
        void sendPasswordResetEmail_InvalidatesOldUnusedTokens() {
            // Given
            String email = "test@example.com";
            
            PasswordResetToken oldToken1 = new PasswordResetToken();
            oldToken1.setId(10L);
            oldToken1.setToken("old-token-1");
            oldToken1.setUsed(false);
            
            PasswordResetToken oldToken2 = new PasswordResetToken();
            oldToken2.setId(11L);
            oldToken2.setToken("old-token-2");
            oldToken2.setUsed(false);
            
            when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));
            when(passwordResetTokenRepository.findByUserAndUsedFalse(testUser))
                    .thenReturn(Arrays.asList(oldToken1, oldToken2));

            // When
            recoveryPasswordService.sendPasswordResetEmail(email);

            // Then
            verify(passwordResetTokenRepository, times(2)).save(any(PasswordResetToken.class)); // 2 old + 1 new
            assertThat(oldToken1.getUsed()).isTrue();
            assertThat(oldToken2.getUsed()).isTrue();
            verify(mailSenderService).sendPasswordResetEmail(eq(email), anyString());
        }

        @Test
        @DisplayName("Should generate unique token")
        void sendPasswordResetEmail_GeneratesUniqueToken() {
            // Given
            String email = "test@example.com";
            when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));
            when(passwordResetTokenRepository.findByUserAndUsedFalse(testUser)).thenReturn(Collections.emptyList());

            // When
            recoveryPasswordService.sendPasswordResetEmail(email);

            // Then
            ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
            verify(passwordResetTokenRepository).save(tokenCaptor.capture());
            
            String generatedToken = tokenCaptor.getValue().getToken();
            assertThat(generatedToken).isNotNull();
            assertThat(generatedToken).isNotEmpty();
            assertThat(generatedToken.length()).isGreaterThan(30); // UUID format
        }

        @Test
        @DisplayName("Should set expiry date to 15 minutes from now")
        void sendPasswordResetEmail_SetsExpiryDateTo15Minutes() {
            // Given
            String email = "test@example.com";
            when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));
            when(passwordResetTokenRepository.findByUserAndUsedFalse(testUser)).thenReturn(Collections.emptyList());

            LocalDateTime beforeCall = LocalDateTime.now().plusMinutes(14);
            
            // When
            recoveryPasswordService.sendPasswordResetEmail(email);
            
            LocalDateTime afterCall = LocalDateTime.now().plusMinutes(16);

            // Then
            ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
            verify(passwordResetTokenRepository).save(tokenCaptor.capture());
            
            LocalDateTime expiryDate = tokenCaptor.getValue().getExpiryDate();
            assertThat(expiryDate).isBetween(beforeCall, afterCall);
        }
    }

    @Nested
    @DisplayName("Reset Password Tests")
    class ResetPasswordTests {

        @Test
        @DisplayName("Should successfully reset password with valid token")
        void resetPassword_WithValidToken_ResetsPasswordAndMarksTokenAsUsed() {
            // Given
            String token = "valid-token-123";
            String newPassword = "newSecurePassword123";
            String encodedPassword = "encodedNewPassword";
            
            when(passwordResetTokenRepository.findByToken(token)).thenReturn(Optional.of(validToken));
            when(passwordEncoder.encode(newPassword)).thenReturn(encodedPassword);

            // When
            recoveryPasswordService.resetPassword(token, newPassword);

            // Then
            verify(passwordResetTokenRepository).findByToken(token);
            verify(passwordEncoder).encode(newPassword);
            verify(userRepository).save(testUser);
            verify(passwordResetTokenRepository).save(validToken);
            
            assertThat(testUser.getPassword()).isEqualTo(encodedPassword);
            assertThat(validToken.getUsed()).isTrue();
        }

        @Test
        @DisplayName("Should throw exception when token not found")
        void resetPassword_WithNonExistentToken_ThrowsTokenNotFoundException() {
            // Given
            String token = "non-existent-token";
            String newPassword = "newPassword123";
            
            when(passwordResetTokenRepository.findByToken(token)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> recoveryPasswordService.resetPassword(token, newPassword))
                    .isInstanceOf(TokenNotFoundException.class)
                    .hasMessageContaining("Invalid password reset token");

            verify(passwordResetTokenRepository).findByToken(token);
            verify(passwordEncoder, never()).encode(anyString());
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when token is expired")
        void resetPassword_WithExpiredToken_ThrowsExpiredRecoveryTokenException() {
            // Given
            String token = "expired-token";
            String newPassword = "newPassword123";
            
            validToken.setExpiryDate(LocalDateTime.now().minusMinutes(10)); // Expired
            when(passwordResetTokenRepository.findByToken(token)).thenReturn(Optional.of(validToken));

            // When & Then
            assertThatThrownBy(() -> recoveryPasswordService.resetPassword(token, newPassword))
                    .isInstanceOf(ExpiredRecoveryTokenException.class)
                    .hasMessageContaining("Password reset token has expired");

            verify(passwordResetTokenRepository).findByToken(token);
            verify(passwordEncoder, never()).encode(anyString());
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when token already used")
        void resetPassword_WithUsedToken_ThrowsTokenAlreadyUsedException() {
            // Given
            String token = "used-token";
            String newPassword = "newPassword123";
            
            validToken.setUsed(true);
            when(passwordResetTokenRepository.findByToken(token)).thenReturn(Optional.of(validToken));

            // When & Then
            assertThatThrownBy(() -> recoveryPasswordService.resetPassword(token, newPassword))
                    .isInstanceOf(TokenAlreadyUsedException.class)
                    .hasMessageContaining("This password reset token has already been used");

            verify(passwordResetTokenRepository).findByToken(token);
            verify(passwordEncoder, never()).encode(anyString());
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should encode new password before saving")
        void resetPassword_EncodesPasswordBeforeSaving() {
            // Given
            String token = "valid-token-123";
            String newPassword = "myNewPassword123!";
            String encodedPassword = "super-secure-encoded-password";
            
            when(passwordResetTokenRepository.findByToken(token)).thenReturn(Optional.of(validToken));
            when(passwordEncoder.encode(newPassword)).thenReturn(encodedPassword);

            // When
            recoveryPasswordService.resetPassword(token, newPassword);

            // Then
            verify(passwordEncoder).encode(newPassword);
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            
            assertThat(userCaptor.getValue().getPassword()).isEqualTo(encodedPassword);
        }

        @Test
        @DisplayName("Should validate token expiry date precisely")
        void resetPassword_ValidatesExpiryDatePrecisely() {
            // Given - Token expires in exactly 1 second
            String token = "about-to-expire-token";
            String newPassword = "newPassword123";
            
            validToken.setExpiryDate(LocalDateTime.now().plusSeconds(1));
            when(passwordResetTokenRepository.findByToken(token)).thenReturn(Optional.of(validToken));
            when(passwordEncoder.encode(anyString())).thenReturn("encoded");

            // When - Should still work as it's not expired yet
            recoveryPasswordService.resetPassword(token, newPassword);

            // Then
            verify(userRepository).save(any(User.class));
            assertThat(validToken.getUsed()).isTrue();
        }

        @Test
        @DisplayName("Should not modify user if token validation fails")
        void resetPassword_DoesNotModifyUserWhenValidationFails() {
            // Given
            String token = "expired-token";
            String newPassword = "newPassword123";
            String originalPassword = testUser.getPassword();
            
            validToken.setExpiryDate(LocalDateTime.now().minusMinutes(1));
            when(passwordResetTokenRepository.findByToken(token)).thenReturn(Optional.of(validToken));

            // When & Then
            assertThatThrownBy(() -> recoveryPasswordService.resetPassword(token, newPassword))
                    .isInstanceOf(ExpiredRecoveryTokenException.class);

            assertThat(testUser.getPassword()).isEqualTo(originalPassword);
            verify(userRepository, never()).save(any());
        }
    }
}
