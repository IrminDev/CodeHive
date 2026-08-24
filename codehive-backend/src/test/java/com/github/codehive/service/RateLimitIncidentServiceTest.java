package com.github.codehive.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.github.codehive.model.entity.RateLimitIncident;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;
import com.github.codehive.repository.RateLimitIncidentRepository;
import com.github.codehive.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class RateLimitIncidentServiceTest {
    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock private RateLimitIncidentRepository incidentRepository;
    @Mock private UserRepository userRepository;
    private RateLimitIncidentService service;

    @BeforeEach
    void setUp() {
        service = new RateLimitIncidentService(incidentRepository, userRepository);
    }

    @Test
    void authenticatedViolationStoresMetadataAndIncrementsLifetimeCounter() {
        User user = new User("Rate", "Limited", "2026630001", "rate@example.com", "encoded", Role.STUDENT);
        user.setId(USER_ID);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        service.record(USER_ID, "executions.submit", "POST", "/api/execution/check", "correlation-1");

        verify(incidentRepository).save(any(RateLimitIncident.class));
        verify(userRepository).incrementRateLimitViolation(eq(USER_ID), any());
    }

    @Test
    void deletedUserViolationIsNotStored() {
        User user = new User("Deleted", "User", "2026630001", "deleted@example.com", "encoded", Role.STUDENT);
        user.setId(USER_ID);
        user.setIsActive(false);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        service.record(USER_ID, "global.authenticated", "GET", "/api/groups", null);

        verify(incidentRepository, never()).save(any());
        verify(userRepository, never()).incrementRateLimitViolation(any(), any());
    }
}
