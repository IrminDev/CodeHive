package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.github.codehive.model.entity.User;
import com.github.codehive.model.response.auth.CsvProgressMessage;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.websocket.CsvProgressWebSocketHandler;

@DisplayName("CsvRegistrationService job submission")
class CsvRegistrationServiceTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private MailSenderService mailSenderService;
    private CsvProgressWebSocketHandler webSocketHandler;
    private ObjectProvider<CsvRegistrationService> selfProvider;
    private CsvRegistrationService service;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        mailSenderService = mock(MailSenderService.class);
        webSocketHandler = mock(CsvProgressWebSocketHandler.class);
        selfProvider = mock(ObjectProvider.class);
        service = new CsvRegistrationService(userRepository, passwordEncoder, mailSenderService,
                webSocketHandler, selfProvider);
    }

    @Test
    @DisplayName("runs the import immediately and does not gate it on the websocket")
    void submitCsvJob_runsImportImmediatelyWithoutWebSocket() {
        CsvRegistrationService self = mock(CsvRegistrationService.class);
        when(selfProvider.getObject()).thenReturn(self);
        UUID requesterId = UUID.randomUUID();
        User requester = mock(User.class);
        when(requester.getId()).thenReturn(requesterId);
        when(requester.canParticipate()).thenReturn(true);
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(requester));
        byte[] csvData = "STUDENT,A,B,C,2020630001,a@b.com".getBytes();

        String taskId = service.submitCsvJob(csvData, "admin@test.com");

        assertThat(taskId).isNotBlank();
        verify(self).processAsync(csvData, taskId, requesterId);
        // The handler only learns who owns the task; it is never handed the import to run.
        verify(webSocketHandler).registerTask(taskId, requesterId);
        verifyNoMoreInteractions(webSocketHandler);
    }

    @Test
    @DisplayName("progress messages do not echo the email or enrollment number")
    void progressMessages_doNotLeakPii() {
        String email = "existing@test.com";
        String enrollment = "2020630001";
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(mock(User.class)));
        byte[] csvData = ("STUDENT,Ada,Lovelace,King," + enrollment + "," + email).getBytes();
        String taskId = "task-1";

        service.processAsync(csvData, taskId, UUID.randomUUID());

        ArgumentCaptor<CsvProgressMessage> captor = ArgumentCaptor.forClass(CsvProgressMessage.class);
        verify(webSocketHandler, atLeastOnce()).sendProgress(eq(taskId), captor.capture());
        assertThat(captor.getAllValues()).anyMatch(m -> m.getMessage().contains("already registered"));
        assertThat(captor.getAllValues())
                .noneMatch(m -> m.getMessage().contains(email) || m.getMessage().contains(enrollment));
    }
}
