package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.github.codehive.model.dto.UserDTO;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.exception.auth.AlreadyRegisteredEmailException;
import com.github.codehive.model.exception.auth.AlreadyRegisteredEnrollmentNumberException;
import com.github.codehive.model.exception.auth.IncorrectCredentialsException;
import com.github.codehive.model.request.auth.LoginRequest;
import com.github.codehive.model.request.auth.SignUpRequest;
import com.github.codehive.model.response.auth.AuthResponse;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.utils.JwtUtil;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private LoginRequest loginRequest;
    private SignUpRequest signUpRequest;

    @BeforeEach
    void setUp() {
        // Setup test user
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setPassword("encodedPassword123");
        testUser.setName("John");
        testUser.setLastName("Doe");
        testUser.setEnrollmentNumber("ENR001");
        testUser.setRole(Role.STUDENT);
        testUser.setProfilePictureUrl("https://example.com/pic.jpg");
        testUser.setIsActive(true);

        // Setup login request
        loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");

        // Setup signup request
        signUpRequest = new SignUpRequest();
        signUpRequest.setEmail("newuser@example.com");
        signUpRequest.setPassword("password123");
        signUpRequest.setName("Jane");
        signUpRequest.setLastName("Smith");
        signUpRequest.setEnrollmentNumber("ENR002");
        signUpRequest.setProfilePictureUrl("https://example.com/jane.jpg");
    }

    @Nested
    @DisplayName("Login Tests")
    class LoginTests {

        @Test
        @DisplayName("Should successfully login with valid credentials")
        void login_WithValidCredentials_ReturnsAuthResponse() {
            // Given
            when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPassword())).thenReturn(true);
            when(jwtUtil.generateToken(any(Map.class), anyString())).thenReturn("jwt-token-123");

            // When
            AuthResponse response = authService.login(loginRequest);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo("jwt-token-123");
            assertThat(response.getUser()).isNotNull();
            assertThat(response.getUser().getEmail()).isEqualTo("test@example.com");
            assertThat(response.getUser().getName()).isEqualTo("John");
            assertThat(response.getUser().getLastName()).isEqualTo("Doe");

            verify(userRepository).findByEmail(loginRequest.getEmail());
            verify(passwordEncoder).matches(loginRequest.getPassword(), testUser.getPassword());
            verify(jwtUtil).generateToken(any(Map.class), anyString());
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void login_WithNonExistentEmail_ThrowsIncorrectCredentialsException() {
            // Given
            when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> authService.login(loginRequest))
                    .isInstanceOf(IncorrectCredentialsException.class)
                    .hasMessage("Invalid credentials");

            verify(userRepository).findByEmail(loginRequest.getEmail());
            verify(passwordEncoder, never()).matches(anyString(), anyString());
            verify(jwtUtil, never()).generateToken(any(), anyString());
        }

        @Test
        @DisplayName("Should throw exception when password is incorrect")
        void login_WithIncorrectPassword_ThrowsIncorrectCredentialsException() {
            // Given
            when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPassword())).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> authService.login(loginRequest))
                    .isInstanceOf(IncorrectCredentialsException.class)
                    .hasMessage("Invalid credentials");

            verify(userRepository).findByEmail(loginRequest.getEmail());
            verify(passwordEncoder).matches(loginRequest.getPassword(), testUser.getPassword());
            verify(jwtUtil, never()).generateToken(any(), anyString());
        }

        @Test
        @DisplayName("Should generate JWT token with correct claims")
        void login_GeneratesTokenWithCorrectClaims() {
            // Given
            when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPassword())).thenReturn(true);
            when(jwtUtil.generateToken(any(Map.class), anyString())).thenAnswer(invocation -> {
                Map<String, Object> claims = invocation.getArgument(0);
                assertThat(claims).containsEntry("userId", 1L);
                assertThat(claims).containsEntry("role", "STUDENT");
                return "jwt-token-123";
            });

            // When
            authService.login(loginRequest);

            // Then
            verify(jwtUtil).generateToken(any(Map.class), anyString());
        }
    }

    @Nested
    @DisplayName("Registration Tests")
    class RegistrationTests {

        @Test
        @DisplayName("Should successfully register new user with valid data")
        void register_WithValidData_ReturnsAuthResponse() {
            // Given
            when(userRepository.findByEmail(signUpRequest.getEmail())).thenReturn(Optional.empty());
            when(userRepository.findByEnrollmentNumber(signUpRequest.getEnrollmentNumber())).thenReturn(Optional.empty());
            when(passwordEncoder.encode(signUpRequest.getPassword())).thenReturn("encodedPassword");
            when(jwtUtil.generateToken(any(Map.class), anyString())).thenReturn("jwt-token-456");
            
            User savedUser = new User();
            savedUser.setId(2L);
            savedUser.setEmail(signUpRequest.getEmail());
            savedUser.setPassword("encodedPassword");
            savedUser.setName(signUpRequest.getName());
            savedUser.setLastName(signUpRequest.getLastName());
            savedUser.setEnrollmentNumber(signUpRequest.getEnrollmentNumber());
            savedUser.setRole(Role.STUDENT);
            savedUser.setProfilePictureUrl(signUpRequest.getProfilePictureUrl());
            savedUser.setIsActive(true);
            
            when(userRepository.save(any(User.class))).thenReturn(savedUser);

            // When
            AuthResponse response = authService.register(signUpRequest);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo("jwt-token-456");
            assertThat(response.getUser()).isNotNull();
            assertThat(response.getUser().getEmail()).isEqualTo(signUpRequest.getEmail());
            assertThat(response.getUser().getName()).isEqualTo(signUpRequest.getName());
            assertThat(response.getUser().getLastName()).isEqualTo(signUpRequest.getLastName());
            assertThat(response.getUser().getRole()).isEqualTo(Role.STUDENT);

            verify(userRepository).findByEmail(signUpRequest.getEmail());
            verify(userRepository).findByEnrollmentNumber(signUpRequest.getEnrollmentNumber());
            verify(passwordEncoder).encode(signUpRequest.getPassword());
            verify(userRepository).save(any(User.class));
            verify(jwtUtil).generateToken(any(Map.class), anyString());
        }

        @Test
        @DisplayName("Should throw exception when email already exists")
        void register_WithDuplicateEmail_ThrowsAlreadyRegisteredEmailException() {
            // Given
            when(userRepository.findByEmail(signUpRequest.getEmail())).thenReturn(Optional.of(testUser));

            // When & Then
            assertThatThrownBy(() -> authService.register(signUpRequest))
                    .isInstanceOf(AlreadyRegisteredEmailException.class)
                    .hasMessage("Email is already registered");

            verify(userRepository).findByEmail(signUpRequest.getEmail());
            verify(userRepository, never()).findByEnrollmentNumber(anyString());
            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when enrollment number already exists")
        void register_WithDuplicateEnrollmentNumber_ThrowsAlreadyRegisteredEnrollmentNumberException() {
            // Given
            when(userRepository.findByEmail(signUpRequest.getEmail())).thenReturn(Optional.empty());
            when(userRepository.findByEnrollmentNumber(signUpRequest.getEnrollmentNumber()))
                    .thenReturn(Optional.of(testUser));

            // When & Then
            assertThatThrownBy(() -> authService.register(signUpRequest))
                    .isInstanceOf(AlreadyRegisteredEnrollmentNumberException.class)
                    .hasMessage("Enrollment number is already registered");

            verify(userRepository).findByEmail(signUpRequest.getEmail());
            verify(userRepository).findByEnrollmentNumber(signUpRequest.getEnrollmentNumber());
            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Should encode password before saving")
        void register_EncodesPasswordBeforeSaving() {
            // Given
            when(userRepository.findByEmail(signUpRequest.getEmail())).thenReturn(Optional.empty());
            when(userRepository.findByEnrollmentNumber(signUpRequest.getEnrollmentNumber())).thenReturn(Optional.empty());
            when(passwordEncoder.encode(signUpRequest.getPassword())).thenReturn("super-secure-encoded-password");
            when(jwtUtil.generateToken(any(Map.class), anyString())).thenReturn("jwt-token");
            
            User savedUser = new User();
            savedUser.setId(2L);
            savedUser.setEmail(signUpRequest.getEmail());
            savedUser.setPassword("super-secure-encoded-password");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);

            // When
            authService.register(signUpRequest);

            // Then
            verify(passwordEncoder).encode("password123");
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should set default role to STUDENT")
        void register_SetsDefaultRoleToStudent() {
            // Given
            when(userRepository.findByEmail(signUpRequest.getEmail())).thenReturn(Optional.empty());
            when(userRepository.findByEnrollmentNumber(signUpRequest.getEnrollmentNumber())).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(jwtUtil.generateToken(any(Map.class), anyString())).thenReturn("jwt-token");
            
            User savedUser = new User();
            savedUser.setId(2L);
            savedUser.setRole(Role.STUDENT);
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                assertThat(user.getRole()).isEqualTo(Role.STUDENT);
                return savedUser;
            });

            // When
            authService.register(signUpRequest);

            // Then
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should set user as active by default")
        void register_SetsUserAsActiveByDefault() {
            // Given
            when(userRepository.findByEmail(signUpRequest.getEmail())).thenReturn(Optional.empty());
            when(userRepository.findByEnrollmentNumber(signUpRequest.getEnrollmentNumber())).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(jwtUtil.generateToken(any(Map.class), anyString())).thenReturn("jwt-token");
            
            User savedUser = new User();
            savedUser.setId(2L);
            savedUser.setIsActive(true);
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                assertThat(user.getIsActive()).isTrue();
                return savedUser;
            });

            // When
            authService.register(signUpRequest);

            // Then
            verify(userRepository).save(any(User.class));
        }
    }
}
