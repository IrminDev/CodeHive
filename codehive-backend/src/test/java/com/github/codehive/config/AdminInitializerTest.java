package com.github.codehive.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.enums.Scope;
import com.github.codehive.repository.UserRepository;

@DisplayName("AdminInitializer bootstrap")
class AdminInitializerTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private AdminInitializer initializer;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        initializer = new AdminInitializer(userRepository, passwordEncoder);
        ReflectionTestUtils.setField(initializer, "adminName", "Super");
        ReflectionTestUtils.setField(initializer, "adminLastName", "Admin");
        ReflectionTestUtils.setField(initializer, "adminEnrollmentNumber", "ADMIN-001");
    }

    @Test
    @DisplayName("fails fast when password is blank")
    void blankPassword_throws() {
        ReflectionTestUtils.setField(initializer, "adminEmail", "admin@codehive.test");
        ReflectionTestUtils.setField(initializer, "adminPassword", "");

        assertThatThrownBy(() -> initializer.run()).isInstanceOf(IllegalStateException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("fails fast when email is blank")
    void blankEmail_throws() {
        ReflectionTestUtils.setField(initializer, "adminEmail", "");
        ReflectionTestUtils.setField(initializer, "adminPassword", "Strong#Pass1");

        assertThatThrownBy(() -> initializer.run()).isInstanceOf(IllegalStateException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("rejects the well-known default password")
    void legacyDefaultPassword_throws() {
        ReflectionTestUtils.setField(initializer, "adminEmail", "admin@codehive.test");
        ReflectionTestUtils.setField(initializer, "adminPassword", "Admin@12345");

        assertThatThrownBy(() -> initializer.run()).isInstanceOf(IllegalStateException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("creates a super admin with a valid explicit configuration")
    void validConfig_createsSuperAdmin() {
        ReflectionTestUtils.setField(initializer, "adminEmail", "admin@codehive.test");
        ReflectionTestUtils.setField(initializer, "adminPassword", "Strong#Pass1");
        when(userRepository.findByEmail("admin@codehive.test")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Strong#Pass1")).thenReturn("ENC");

        initializer.run();

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo("admin@codehive.test");
        assertThat(saved.getPassword()).isEqualTo("ENC");
        assertThat(saved.getRole()).isEqualTo(Role.ADMIN);
        assertThat(saved.getScopes()).contains(Scope.SUPER_ADMIN);
    }

    @Test
    @DisplayName("does not create when a super admin already exists")
    void existingAdmin_doesNotCreate() {
        ReflectionTestUtils.setField(initializer, "adminEmail", "admin@codehive.test");
        ReflectionTestUtils.setField(initializer, "adminPassword", "Strong#Pass1");
        when(userRepository.findByEmail("admin@codehive.test"))
                .thenReturn(Optional.of(mock(User.class)));

        initializer.run();

        verify(userRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(anyString());
    }
}
