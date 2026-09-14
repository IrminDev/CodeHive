package com.github.codehive.messaging.listener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.config.RabbitConfig;
import com.github.codehive.messaging.producer.NotificationProducer;
import com.github.codehive.model.dto.queue.NotificationMessage;
import com.github.codehive.model.entity.User;
import com.github.codehive.notification.NotificationEmailContent;
import com.github.codehive.notification.NotificationStrategyRegistry;
import com.github.codehive.repository.UserRepository;
import com.github.codehive.service.MailSenderService;
import com.github.codehive.service.NotificationPreferenceService;

@Component
public class NotificationEmailListener {
    private static final Logger logger = LoggerFactory.getLogger(NotificationEmailListener.class);

    private final UserRepository userRepository;
    private final NotificationPreferenceService preferenceService;
    private final NotificationStrategyRegistry strategyRegistry;
    private final MailSenderService mailSenderService;
    private final NotificationProducer producer;
    private final int maxAttempts;

    public NotificationEmailListener(UserRepository userRepository,
                                     NotificationPreferenceService preferenceService,
                                     NotificationStrategyRegistry strategyRegistry,
                                     MailSenderService mailSenderService,
                                     NotificationProducer producer,
                                     @Value("${notification.email.max-attempts:5}") int maxAttempts) {
        this.userRepository = userRepository;
        this.preferenceService = preferenceService;
        this.strategyRegistry = strategyRegistry;
        this.mailSenderService = mailSenderService;
        this.producer = producer;
        this.maxAttempts = maxAttempts;
    }

    @Transactional(readOnly = true)
    @RabbitListener(queues = RabbitConfig.NOTIFICATION_EMAIL_QUEUE)
    public void handle(NotificationMessage message) {
        try {
            if (message.schemaVersion() != 1) {
                logger.error("[NOTIFICATION] Unsupported schema version={} id={}",
                        message.schemaVersion(), message.notificationId());
                producer.deadLetter(message);
                return;
            }
            User recipient = userRepository.findById(message.recipientId()).orElse(null);
            if (recipient == null || !preferenceService.isEnabled(recipient, message.type())) {
                logger.info("[NOTIFICATION] Skipped type={} recipient={} id={}",
                        message.type(), message.recipientId(), message.notificationId());
                return;
            }
            NotificationEmailContent content = strategyRegistry.get(message.type()).build(message, recipient);
            mailSenderService.sendNotificationEmail(recipient.getEmail(), content);
            logger.info("[NOTIFICATION] Sent type={} recipient={} id={}",
                    message.type(), message.recipientId(), message.notificationId());
        } catch (Exception exception) {
            logger.error("[NOTIFICATION] Delivery failed type={} recipient={} id={} attempt={}",
                    message.type(), message.recipientId(), message.notificationId(), message.attempt(), exception);
            NotificationMessage retry = message.nextAttempt();
            if (retry.attempt() >= maxAttempts) {
                producer.deadLetter(retry);
            } else {
                producer.retry(retry);
            }
        }
    }
}
