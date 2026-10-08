package com.github.codehive.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.data.domain.Page;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;
import com.github.codehive.model.exception.handler.GlobalExceptionHandler;
import com.github.codehive.repository.*;
import com.github.codehive.service.assistant.AssistantUsageService;

class OwnerStudentUsageControllerTest {
    private static final UUID USER = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID GROUP = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private final AssistantUsageRepository usage = mock(AssistantUsageRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final ClassGroupRepository groups = mock(ClassGroupRepository.class);
    private MockMvc mvc;
    private final UsernamePasswordAuthenticationToken principal =
            new UsernamePasswordAuthenticationToken("student@example.com", "unused");

    @BeforeEach
    void setup() {
        var service = new AssistantUsageService(usage, users, groups,
                mock(AssignmentRepository.class), mock(AssignmentAiPolicyRepository.class));
        mvc = MockMvcBuilders.standaloneSetup(new OwnerAssistantUsageController(service))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
        var student = new User("Grace", "Hopper", "FIXED", principal.getName(), "unused", Role.TEACHER);
        student.setId(UUID.fromString("00000000-0000-0000-0000-000000000003"));
        when(users.findByEmail(principal.getName())).thenReturn(Optional.of(student));
        var group = new ClassGroup();
        group.setId(GROUP);
        group.setName("Historical class");
        group.setOwner(student);
        when(groups.findById(GROUP)).thenReturn(Optional.of(group));
        when(usage.hasPersonalGroup(USER, GROUP)).thenReturn(true);
        when(usage.rows(any(), any(), any(), anyInt(), anyInt(), anyString(), anyBoolean()))
                .thenReturn(Page.empty());
        when(usage.trend(any())).thenReturn(List.of());
    }

    @ParameterizedTest
    @ValueSource(strings = { "", "/assignments" })
    void routeGroupIsNotTreatedAsClientQueryFilter(String suffix) throws Exception {
        mvc.perform(get("/api/groups/" + GROUP + "/assistant-usage/students/" + USER + suffix).principal(principal)
                        .param("from", "2026-01-01T00:00:00Z").param("to", "2026-01-02T00:00:00Z"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.filters.userId").value(USER.toString()))
                .andExpect(jsonPath("$.data.filters.groupId").value(GROUP.toString()));
        verify(usage).hasPersonalGroup(USER, GROUP);
        if (suffix.isEmpty()) {
            verify(usage).educational(argThat(filters -> USER.equals(filters.userId())
                    && GROUP.equals(filters.groupId())
                    && Instant.parse("2026-01-01T00:00:00Z").equals(filters.from())));
        }
    }

    @Test
    void queryIdentityOverrideRemainsRejected() throws Exception {
        mvc.perform(get("/api/groups/" + GROUP + "/assistant-usage/students/" + USER).principal(principal)
                        .param("userId", GROUP.toString()))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(usage);
    }

    @Test
    void nonOwnerCannotReadStudentUsage() throws Exception {
        var other = new User(); other.setId(GROUP);
        var group = new ClassGroup(); group.setId(GROUP); group.setOwner(other);
        when(groups.findById(GROUP)).thenReturn(Optional.of(group));
        mvc.perform(get("/api/groups/" + GROUP + "/assistant-usage/students/" + USER).principal(principal))
                .andExpect(status().isForbidden());
        verifyNoInteractions(usage);
    }

    @Test
    void groupWithoutOwnEnrollmentOrHistoryRemainsForbidden() throws Exception {
        when(usage.hasPersonalGroup(USER, GROUP)).thenReturn(false);
        mvc.perform(get("/api/groups/" + GROUP + "/assistant-usage/students/" + USER).principal(principal))
                .andExpect(status().isForbidden());
        verify(usage, never()).educational(any());
    }
}
