package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.crypto.password.PasswordEncoder;

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
        byte[] csvData = "STUDENT,A,B,C,2020630001,a@b.com".getBytes();

        String taskId = service.submitCsvJob(csvData);

        assertThat(taskId).isNotBlank();
        verify(self).processAsync(csvData, taskId);
        verifyNoInteractions(webSocketHandler);
    }
}
