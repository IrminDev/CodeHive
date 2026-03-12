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

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
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
import org.springframework.mock.web.MockMultipartFile;
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
import com.github.codehive.model.response.auth.CsvBulkRegisterResponse;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.utils.JwtUtil;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private MailSenderService mailSenderService;

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
        testUser.setLastName("Doe Smith");
        testUser.setEnrollmentNumber("ENR001");
        testUser.setRole(Role.STUDENT);
        testUser.setProfilePictureUrl("https://example.com/pic.jpg");
        testUser.setIsActive(true);
        testUser.setTemporaryPassword(false);

        // Setup login request
        loginRequest = new LoginRequest();
        loginRequest.setIdentifier("test@example.com");
        loginRequest.setPassword("password123");

        // Setup signup request (admin-driven, no password)
        signUpRequest = new SignUpRequest();
        signUpRequest.setEmail("newuser@example.com");
        signUpRequest.setName("Jane");
        signUpRequest.setFatherLastName("Smith");
        signUpRequest.setMotherLastName("Doe");
        signUpRequest.setEnrollmentNumber("ENR002");
        signUpRequest.setRole(Role.STUDENT);
    }

    @Nested
    @DisplayName("Login Tests")
    class LoginTests {

        @Test
        @DisplayName("Returns token and user data for valid credentials")
        void login_WithValidCredentials_ReturnsAuthResponse() {
            // Given
            when(userRepository.findByEmail(loginRequest.getIdentifier())).thenReturn(Optional.of(testUser));
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
            assertThat(response.getUser().getLastName()).isEqualTo("Doe Smith");

            verify(userRepository).findByEmail(loginRequest.getIdentifier());
            verify(passwordEncoder).matches(loginRequest.getPassword(), testUser.getPassword());
            verify(jwtUtil).generateToken(any(Map.class), anyString());
        }

        @Test
        @DisplayName("Throws exception when user not found")
        void login_WithNonExistentEmail_ThrowsIncorrectCredentialsException() {
            // Given
            when(userRepository.findByEmail(loginRequest.getIdentifier())).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> authService.login(loginRequest))
                    .isInstanceOf(IncorrectCredentialsException.class)
                    .hasMessage("Invalid credentials");

            verify(userRepository).findByEmail(loginRequest.getIdentifier());
            verify(passwordEncoder, never()).matches(anyString(), anyString());
            verify(jwtUtil, never()).generateToken(any(), anyString());
        }

        @Test
        @DisplayName("Throws exception when password is incorrect")
        void login_WithIncorrectPassword_ThrowsIncorrectCredentialsException() {
            // Given
            when(userRepository.findByEmail(loginRequest.getIdentifier())).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPassword())).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> authService.login(loginRequest))
                    .isInstanceOf(IncorrectCredentialsException.class)
                    .hasMessage("Invalid credentials");

            verify(userRepository).findByEmail(loginRequest.getIdentifier());
            verify(passwordEncoder).matches(loginRequest.getPassword(), testUser.getPassword());
            verify(jwtUtil, never()).generateToken(any(), anyString());
        }

        @Test
        @DisplayName("Generates JWT token with correct claims")
        void login_GeneratesTokenWithCorrectClaims() {
            // Given
            when(userRepository.findByEmail(loginRequest.getIdentifier())).thenReturn(Optional.of(testUser));
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

        @Test
        @DisplayName("Returns token and user data when logging in with enrollment number")
        void login_WithEnrollmentNumber_ReturnsAuthResponse() {
            // Given
            LoginRequest enrollmentLoginRequest = new LoginRequest();
            enrollmentLoginRequest.setIdentifier("ENR001");
            enrollmentLoginRequest.setPassword("password123");
            
            when(userRepository.findByEnrollmentNumber("ENR001")).thenReturn(Optional.of(testUser));
            when(passwordEncoder.matches(enrollmentLoginRequest.getPassword(), testUser.getPassword())).thenReturn(true);
            when(jwtUtil.generateToken(any(Map.class), anyString())).thenReturn("jwt-token-123");

            // When
            AuthResponse response = authService.login(enrollmentLoginRequest);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo("jwt-token-123");
            assertThat(response.getUser()).isNotNull();

            verify(userRepository).findByEnrollmentNumber("ENR001");
            verify(passwordEncoder).matches(enrollmentLoginRequest.getPassword(), testUser.getPassword());
            verify(jwtUtil).generateToken(any(Map.class), anyString());
        }
    }

    @Nested
    @DisplayName("Registration Tests")
    class RegistrationTests {

        @Test
        @DisplayName("Returns user data for valid registration")
        void register_WithValidData_ReturnsUserDTO() {
            // Given
            when(userRepository.findByEmail(signUpRequest.getEmail())).thenReturn(Optional.empty());
            when(userRepository.findByEnrollmentNumber(signUpRequest.getEnrollmentNumber())).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");

            User savedUser = new User();
            savedUser.setId(2L);
            savedUser.setEmail(signUpRequest.getEmail());
            savedUser.setPassword("encodedPassword");
            savedUser.setName(signUpRequest.getName());
            savedUser.setLastName("Smith Doe");
            savedUser.setEnrollmentNumber(signUpRequest.getEnrollmentNumber());
            savedUser.setRole(Role.STUDENT);
            savedUser.setIsActive(true);
            savedUser.setTemporaryPassword(true);

            when(userRepository.save(any(User.class))).thenReturn(savedUser);

            // When
            UserDTO result = authService.register(signUpRequest);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getEmail()).isEqualTo(signUpRequest.getEmail());
            assertThat(result.getName()).isEqualTo(signUpRequest.getName());
            assertThat(result.getLastName()).isEqualTo("Smith Doe");
            assertThat(result.getRole()).isEqualTo(Role.STUDENT);
            assertThat(result.getTemporaryPassword()).isTrue();

            verify(userRepository).findByEmail(signUpRequest.getEmail());
            verify(userRepository).findByEnrollmentNumber(signUpRequest.getEnrollmentNumber());
            verify(passwordEncoder).encode(anyString());
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Throws exception when email already exists")
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
        @DisplayName("Throws exception when enrollment number already exists")
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
        @DisplayName("Generates and encodes a random password")
        void register_GeneratesAndEncodesRandomPassword() {
            // Given
            when(userRepository.findByEmail(signUpRequest.getEmail())).thenReturn(Optional.empty());
            when(userRepository.findByEnrollmentNumber(signUpRequest.getEnrollmentNumber())).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encodedRandomPassword");

            User savedUser = new User();
            savedUser.setId(2L);
            savedUser.setEmail(signUpRequest.getEmail());
            savedUser.setName(signUpRequest.getName());
            savedUser.setLastName("Smith Doe");
            savedUser.setEnrollmentNumber(signUpRequest.getEnrollmentNumber());
            savedUser.setPassword("encodedRandomPassword");
            savedUser.setRole(Role.STUDENT);
            savedUser.setTemporaryPassword(true);
            when(userRepository.save(any(User.class))).thenReturn(savedUser);

            // When
            authService.register(signUpRequest);

            // Then
            verify(passwordEncoder).encode(anyString());
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Sets the role from the request")
        void register_SetsRoleFromRequest() {
            // Given
            signUpRequest.setRole(Role.TEACHER);
            when(userRepository.findByEmail(signUpRequest.getEmail())).thenReturn(Optional.empty());
            when(userRepository.findByEnrollmentNumber(signUpRequest.getEnrollmentNumber())).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");

            User savedUser = new User();
            savedUser.setId(2L);
            savedUser.setEmail(signUpRequest.getEmail());
            savedUser.setName(signUpRequest.getName());
            savedUser.setLastName("Smith Doe");
            savedUser.setEnrollmentNumber(signUpRequest.getEnrollmentNumber());
            savedUser.setPassword("encodedPassword");
            savedUser.setRole(Role.TEACHER);
            savedUser.setTemporaryPassword(true);
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                assertThat(user.getRole()).isEqualTo(Role.TEACHER);
                return savedUser;
            });

            // When
            authService.register(signUpRequest);

            // Then
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Sets user as active by default")
        void register_SetsUserAsActiveByDefault() {
            // Given
            when(userRepository.findByEmail(signUpRequest.getEmail())).thenReturn(Optional.empty());
            when(userRepository.findByEnrollmentNumber(signUpRequest.getEnrollmentNumber())).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");

            User savedUser = new User();
            savedUser.setId(2L);
            savedUser.setEmail(signUpRequest.getEmail());
            savedUser.setName(signUpRequest.getName());
            savedUser.setLastName("Smith Doe");
            savedUser.setEnrollmentNumber(signUpRequest.getEnrollmentNumber());
            savedUser.setPassword("encodedPassword");
            savedUser.setRole(Role.STUDENT);
            savedUser.setIsActive(true);
            savedUser.setTemporaryPassword(true);
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

        @Test
        @DisplayName("Sets temporaryPassword flag to true")
        void register_SetsTemporaryPasswordTrue() {
            // Given
            when(userRepository.findByEmail(signUpRequest.getEmail())).thenReturn(Optional.empty());
            when(userRepository.findByEnrollmentNumber(signUpRequest.getEnrollmentNumber())).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");

            User savedUser = new User();
            savedUser.setId(2L);
            savedUser.setEmail(signUpRequest.getEmail());
            savedUser.setName(signUpRequest.getName());
            savedUser.setLastName("Smith Doe");
            savedUser.setEnrollmentNumber(signUpRequest.getEnrollmentNumber());
            savedUser.setPassword("encodedPassword");
            savedUser.setRole(Role.STUDENT);
            savedUser.setTemporaryPassword(true);
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                assertThat(user.getTemporaryPassword()).isTrue();
                return savedUser;
            });

            // When
            authService.register(signUpRequest);

            // Then
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Sends welcome email with temporary password")
        void register_SendsWelcomeEmailWithTemporaryPassword() {
            // Given
            when(userRepository.findByEmail(signUpRequest.getEmail())).thenReturn(Optional.empty());
            when(userRepository.findByEnrollmentNumber(signUpRequest.getEnrollmentNumber())).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");

            User savedUser = new User();
            savedUser.setId(2L);
            savedUser.setEmail(signUpRequest.getEmail());
            savedUser.setName(signUpRequest.getName());
            savedUser.setLastName("Smith Doe");
            savedUser.setEnrollmentNumber(signUpRequest.getEnrollmentNumber());
            savedUser.setPassword("encodedPassword");
            savedUser.setRole(Role.STUDENT);
            savedUser.setTemporaryPassword(true);
            when(userRepository.save(any(User.class))).thenReturn(savedUser);

            // When
            authService.register(signUpRequest);

            // Then
            verify(mailSenderService).sendWelcomeEmail(eq(signUpRequest.getEmail()), eq(signUpRequest.getName()), anyString());
        }

        @Test
        @DisplayName("Concatenates father and mother last names")
        void register_ConcatenatesLastNames() {
            // Given
            when(userRepository.findByEmail(signUpRequest.getEmail())).thenReturn(Optional.empty());
            when(userRepository.findByEnrollmentNumber(signUpRequest.getEnrollmentNumber())).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");

            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);

            User savedUser = new User();
            savedUser.setId(2L);
            savedUser.setEmail(signUpRequest.getEmail());
            savedUser.setName(signUpRequest.getName());
            savedUser.setLastName("Smith Doe");
            savedUser.setEnrollmentNumber(signUpRequest.getEnrollmentNumber());
            savedUser.setPassword("encodedPassword");
            savedUser.setRole(Role.STUDENT);
            savedUser.setTemporaryPassword(true);
            when(userRepository.save(userCaptor.capture())).thenReturn(savedUser);

            // When
            authService.register(signUpRequest);

            // Then
            User capturedUser = userCaptor.getValue();
            assertThat(capturedUser.getLastName()).isEqualTo("Smith Doe");
        }

        @Test
        @DisplayName("Does not send email when registration fails due to duplicate email")
        void register_WithDuplicateEmail_DoesNotSendEmail() {
            // Given
            when(userRepository.findByEmail(signUpRequest.getEmail())).thenReturn(Optional.of(testUser));

            // When & Then
            assertThatThrownBy(() -> authService.register(signUpRequest))
                    .isInstanceOf(AlreadyRegisteredEmailException.class);

            verify(mailSenderService, never()).sendWelcomeEmail(anyString(), anyString(), anyString());
        }
    }

    @Nested
    @DisplayName("CSV Bulk Registration Tests")
    class CsvBulkRegistrationTests {

        @Test
        @DisplayName("Processes valid CSV and registers all users")
        void registerFromCsv_WithValidCsv_RegistersAllUsers() throws IOException {
            // Given
            String csv = "STUDENT,Juan,Garcia,Lopez,20230001,juan@example.com\n"
                       + "TEACHER,Maria,Hernandez,Ruiz,T00001,maria@example.com\n";
            MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv",
                    csv.getBytes(StandardCharsets.UTF_8));

            when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
            when(userRepository.findByEnrollmentNumber(anyString())).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            CsvBulkRegisterResponse response = authService.registerFromCsv(file);

            // Then
            assertThat(response.getTotalProcessed()).isEqualTo(2);
            assertThat(response.getSuccessCount()).isEqualTo(2);
            assertThat(response.getErrorCount()).isEqualTo(0);
            assertThat(response.getErrors()).isNull();

            verify(userRepository, times(2)).save(any(User.class));
            verify(mailSenderService, times(2)).sendWelcomeEmail(anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("Reports error for rows with insufficient columns")
        void registerFromCsv_WithInsufficientColumns_ReportsError() throws IOException {
            // Given
            String csv = "STUDENT,Juan,Garcia\n";
            MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv",
                    csv.getBytes(StandardCharsets.UTF_8));

            // When
            CsvBulkRegisterResponse response = authService.registerFromCsv(file);

            // Then
            assertThat(response.getTotalProcessed()).isEqualTo(1);
            assertThat(response.getSuccessCount()).isEqualTo(0);
            assertThat(response.getErrorCount()).isEqualTo(1);
            assertThat(response.getErrors()).anyMatch(e -> e.contains("Expected 6 columns"));

            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Reports error for invalid role")
        void registerFromCsv_WithInvalidRole_ReportsError() throws IOException {
            // Given
            String csv = "INVALID_ROLE,Juan,Garcia,Lopez,20230001,juan@example.com\n";
            MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv",
                    csv.getBytes(StandardCharsets.UTF_8));

            // When
            CsvBulkRegisterResponse response = authService.registerFromCsv(file);

            // Then
            assertThat(response.getSuccessCount()).isEqualTo(0);
            assertThat(response.getErrorCount()).isEqualTo(1);
            assertThat(response.getErrors()).anyMatch(e -> e.contains("Invalid role"));

            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Reports error for invalid email format")
        void registerFromCsv_WithInvalidEmail_ReportsError() throws IOException {
            // Given
            String csv = "STUDENT,Juan,Garcia,Lopez,20230001,invalid-email\n";
            MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv",
                    csv.getBytes(StandardCharsets.UTF_8));

            // When
            CsvBulkRegisterResponse response = authService.registerFromCsv(file);

            // Then
            assertThat(response.getSuccessCount()).isEqualTo(0);
            assertThat(response.getErrorCount()).isEqualTo(1);
            assertThat(response.getErrors()).anyMatch(e -> e.contains("email is invalid"));

            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Reports error for duplicate emails within CSV")
        void registerFromCsv_WithDuplicateEmailsInCsv_ReportsError() throws IOException {
            // Given
            String csv = "STUDENT,Juan,Garcia,Lopez,20230001,juan@example.com\n"
                       + "STUDENT,Pedro,Martinez,Ruiz,20230002,juan@example.com\n";
            MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv",
                    csv.getBytes(StandardCharsets.UTF_8));

            when(userRepository.findByEmail("juan@example.com")).thenReturn(Optional.empty());
            when(userRepository.findByEnrollmentNumber("20230001")).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            CsvBulkRegisterResponse response = authService.registerFromCsv(file);

            // Then
            assertThat(response.getSuccessCount()).isEqualTo(1);
            assertThat(response.getErrorCount()).isEqualTo(1);
            assertThat(response.getErrors()).anyMatch(e -> e.contains("Duplicate email"));
        }

        @Test
        @DisplayName("Reports error for duplicate enrollment numbers within CSV")
        void registerFromCsv_WithDuplicateEnrollmentsInCsv_ReportsError() throws IOException {
            // Given
            String csv = "STUDENT,Juan,Garcia,Lopez,20230001,juan@example.com\n"
                       + "STUDENT,Pedro,Martinez,Ruiz,20230001,pedro@example.com\n";
            MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv",
                    csv.getBytes(StandardCharsets.UTF_8));

            when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
            when(userRepository.findByEnrollmentNumber("20230001")).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            CsvBulkRegisterResponse response = authService.registerFromCsv(file);

            // Then
            assertThat(response.getSuccessCount()).isEqualTo(1);
            assertThat(response.getErrorCount()).isEqualTo(1);
            assertThat(response.getErrors()).anyMatch(e -> e.contains("Duplicate enrollment number"));
        }

        @Test
        @DisplayName("Reports error when email already exists in database")
        void registerFromCsv_WithExistingEmailInDb_ReportsError() throws IOException {
            // Given
            String csv = "STUDENT,Juan,Garcia,Lopez,20230001,existing@example.com\n";
            MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv",
                    csv.getBytes(StandardCharsets.UTF_8));

            when(userRepository.findByEmail("existing@example.com")).thenReturn(Optional.of(testUser));

            // When
            CsvBulkRegisterResponse response = authService.registerFromCsv(file);

            // Then
            assertThat(response.getSuccessCount()).isEqualTo(0);
            assertThat(response.getErrorCount()).isEqualTo(1);
            assertThat(response.getErrors()).anyMatch(e -> e.contains("already registered"));

            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Reports error when enrollment number already exists in database")
        void registerFromCsv_WithExistingEnrollmentInDb_ReportsError() throws IOException {
            // Given
            String csv = "STUDENT,Juan,Garcia,Lopez,ENR001,juan@example.com\n";
            MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv",
                    csv.getBytes(StandardCharsets.UTF_8));

            when(userRepository.findByEmail("juan@example.com")).thenReturn(Optional.empty());
            when(userRepository.findByEnrollmentNumber("ENR001")).thenReturn(Optional.of(testUser));

            // When
            CsvBulkRegisterResponse response = authService.registerFromCsv(file);

            // Then
            assertThat(response.getSuccessCount()).isEqualTo(0);
            assertThat(response.getErrorCount()).isEqualTo(1);
            assertThat(response.getErrors()).anyMatch(e -> e.contains("already registered"));

            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Handles mix of valid and invalid rows")
        void registerFromCsv_WithMixedRows_ProcessesCorrectly() throws IOException {
            // Given
            String csv = "STUDENT,Juan,Garcia,Lopez,20230001,juan@example.com\n"
                       + "INVALID,Bad,Row,Data,20230002,bad@example.com\n"
                       + "TEACHER,Maria,Hernandez,Ruiz,T00001,maria@example.com\n";
            MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv",
                    csv.getBytes(StandardCharsets.UTF_8));

            when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
            when(userRepository.findByEnrollmentNumber(anyString())).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            CsvBulkRegisterResponse response = authService.registerFromCsv(file);

            // Then
            assertThat(response.getTotalProcessed()).isEqualTo(3);
            assertThat(response.getSuccessCount()).isEqualTo(2);
            assertThat(response.getErrorCount()).isEqualTo(1);
            assertThat(response.getErrors()).hasSize(1);

            verify(userRepository, times(2)).save(any(User.class));
            verify(mailSenderService, times(2)).sendWelcomeEmail(anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("Sends welcome email for each successfully registered user from CSV")
        void registerFromCsv_SendsEmailForEachRegisteredUser() throws IOException {
            // Given
            String csv = "STUDENT,Juan,Garcia,Lopez,20230001,juan@example.com\n";
            MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv",
                    csv.getBytes(StandardCharsets.UTF_8));

            when(userRepository.findByEmail("juan@example.com")).thenReturn(Optional.empty());
            when(userRepository.findByEnrollmentNumber("20230001")).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            authService.registerFromCsv(file);

            // Then
            verify(mailSenderService).sendWelcomeEmail(eq("juan@example.com"), eq("Juan"), anyString());
        }

        @Test
        @DisplayName("Reports error for empty required fields")
        void registerFromCsv_WithEmptyFields_ReportsError() throws IOException {
            // Given
            String csv = "STUDENT,,Garcia,Lopez,20230001,juan@example.com\n";
            MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv",
                    csv.getBytes(StandardCharsets.UTF_8));

            // When
            CsvBulkRegisterResponse response = authService.registerFromCsv(file);

            // Then
            assertThat(response.getSuccessCount()).isEqualTo(0);
            assertThat(response.getErrorCount()).isEqualTo(1);
            assertThat(response.getErrors()).anyMatch(e -> e.contains("name is empty"));

            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Handles empty CSV file")
        void registerFromCsv_WithEmptyCsv_ReturnsZeroCounts() throws IOException {
            // Given
            MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv",
                    "".getBytes(StandardCharsets.UTF_8));

            // When
            CsvBulkRegisterResponse response = authService.registerFromCsv(file);

            // Then
            assertThat(response.getTotalProcessed()).isEqualTo(0);
            assertThat(response.getSuccessCount()).isEqualTo(0);
            assertThat(response.getErrorCount()).isEqualTo(0);

            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Role parsing is case-insensitive")
        void registerFromCsv_WithLowercaseRole_ParsesCorrectly() throws IOException {
            // Given
            String csv = "student,Juan,Garcia,Lopez,20230001,juan@example.com\n";
            MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv",
                    csv.getBytes(StandardCharsets.UTF_8));

            when(userRepository.findByEmail("juan@example.com")).thenReturn(Optional.empty());
            when(userRepository.findByEnrollmentNumber("20230001")).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                assertThat(user.getRole()).isEqualTo(Role.STUDENT);
                return user;
            });

            // When
            CsvBulkRegisterResponse response = authService.registerFromCsv(file);

            // Then
            assertThat(response.getSuccessCount()).isEqualTo(1);
        }
    }
}
