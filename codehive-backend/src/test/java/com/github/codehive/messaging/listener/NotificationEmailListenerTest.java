package com.github.codehive.messaging.listener;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.github.codehive.messaging.producer.NotificationProducer;
import com.github.codehive.model.dto.queue.NotificationMessage;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.enums.Role;
import com.github.codehive.notification.NotificationEmailContent;
import com.github.codehive.notification.NotificationStrategy;
import com.github.codehive.notification.NotificationStrategyRegistry;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.service.MailSenderService;
import com.github.codehive.service.NotificationPreferenceService;

@ExtendWith(MockitoExtension.class)
class NotificationEmailListenerTest {
    private static final UUID NOTIFICATION_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000010");
    private static final UUID RECIPIENT_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID RESOURCE_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000030");

    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationPreferenceService preferenceService;
    @Mock
    private NotificationStrategyRegistry strategyRegistry;
    @Mock
    private MailSenderService mailSenderService;
    @Mock
    private NotificationProducer producer;
    @Mock
    private NotificationStrategy strategy;

    private NotificationEmailListener listener;
    private User recipient;

    @BeforeEach
    void setUp() {
        listener = new NotificationEmailListener(
                userRepository, preferenceService, strategyRegistry, mailSenderService, producer, 3);
        recipient = new User("Ada", "Lovelace", "20260001", "ada@example.com", "encoded", Role.STUDENT);
        recipient.setId(RECIPIENT_ID);
    }

    @Test
    void rendersAndSendsEnabledNotification() {
        NotificationMessage message = message(0, 1);
        NotificationEmailContent content = new NotificationEmailContent(
                NotificationType.ASSIGNMENT_PUBLISHED,
                "Subject", "Message", java.util.List.of(), null, "Open", "/");
        when(userRepository.findById(RECIPIENT_ID)).thenReturn(Optional.of(recipient));
        when(preferenceService.isEnabled(recipient, message.type())).thenReturn(true);
        when(strategyRegistry.get(message.type())).thenReturn(strategy);
        when(strategy.build(message, recipient)).thenReturn(content);

        listener.handle(message);

        verify(mailSenderService).sendNotificationEmail(recipient.getEmail(), content);
        verify(producer, never()).retry(any());
        verify(producer, never()).deadLetter(any());
    }

    @Test
    void skipsNotificationWhenUserDisabledIt() {
        NotificationMessage message = message(0, 1);
        when(userRepository.findById(RECIPIENT_ID)).thenReturn(Optional.of(recipient));
        when(preferenceService.isEnabled(recipient, message.type())).thenReturn(false);

        listener.handle(message);

        verify(strategyRegistry, never()).get(any());
        verify(mailSenderService, never()).sendNotificationEmail(any(), any());
    }

    @Test
    void acceptsSchemaTwoNotificationWithResourceContext() {
        NotificationMessage message = message(0, 2, RESOURCE_ID);
        NotificationEmailContent content = new NotificationEmailContent(
                NotificationType.ASSIGNMENT_PUBLISHED,
                "Subject", "Message", java.util.List.of(), null, "Open", "/");
        when(userRepository.findById(RECIPIENT_ID)).thenReturn(Optional.of(recipient));
        when(preferenceService.isEnabled(recipient, message.type())).thenReturn(true);
        when(strategyRegistry.get(message.type())).thenReturn(strategy);
        when(strategy.build(message, recipient)).thenReturn(content);

        listener.handle(message);

        verify(mailSenderService).sendNotificationEmail(recipient.getEmail(), content);
    }

    @Test
    void retriesTransientDeliveryFailureWithIncrementedAttempt() {
        NotificationMessage message = message(0, 2, RESOURCE_ID);
        when(userRepository.findById(RECIPIENT_ID)).thenReturn(Optional.of(recipient));
        when(preferenceService.isEnabled(recipient, message.type())).thenReturn(true);
        when(strategyRegistry.get(message.type())).thenThrow(new IllegalStateException("temporary"));

        listener.handle(message);

        ArgumentCaptor<NotificationMessage> captor = ArgumentCaptor.forClass(NotificationMessage.class);
        verify(producer).retry(captor.capture());
        verify(producer, never()).deadLetter(any());
        org.assertj.core.api.Assertions.assertThat(captor.getValue().attempt()).isEqualTo(1);
        org.assertj.core.api.Assertions.assertThat(captor.getValue().resourceId()).isEqualTo(RESOURCE_ID);
        org.assertj.core.api.Assertions.assertThat(captor.getValue().schemaVersion()).isEqualTo(2);
    }

    @Test
    void deadLettersUnsupportedSchemaImmediately() {
        NotificationMessage message = message(0, 3);

        listener.handle(message);

        verify(producer).deadLetter(message);
        verify(userRepository, never()).findById(any());
    }

    private NotificationMessage message(int attempt, int schemaVersion) {
        return message(attempt, schemaVersion, null);
    }

    private NotificationMessage message(int attempt, int schemaVersion, UUID resourceId) {
        return new NotificationMessage(
                NOTIFICATION_ID,
                NotificationType.ASSIGNMENT_PUBLISHED,
                RECIPIENT_ID,
                null,
                null,
                UUID.fromString("00000000-0000-0000-0000-000000000020"),
                null,
                resourceId,
                Instant.parse("2026-07-24T12:00:00Z"),
                attempt,
                schemaVersion);
    }
}
