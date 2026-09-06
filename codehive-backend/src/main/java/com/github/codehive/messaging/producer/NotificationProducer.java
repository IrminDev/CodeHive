package com.github.codehive.messaging.producer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import com.github.codehive.config.RabbitConfig;
import com.github.codehive.model.dto.queue.NotificationMessage;

@Component
public class NotificationProducer {
    private static final Logger logger = LoggerFactory.getLogger(NotificationProducer.class);
    private final RabbitTemplate rabbitTemplate;

    public NotificationProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
        this.rabbitTemplate.setMandatory(true);
    }

    public void send(NotificationMessage message) {
        rabbitTemplate.convertAndSend(RabbitConfig.NOTIFICATION_EXCHANGE,
                RabbitConfig.NOTIFICATION_EMAIL_ROUTING_KEY, message);
        logger.info("[NOTIFICATION] Published type={} recipient={} id={}",
                message.type(), message.recipientId(), message.notificationId());
    }

    public void retry(NotificationMessage message) {
        rabbitTemplate.convertAndSend(RabbitConfig.NOTIFICATION_RETRY_EXCHANGE,
                RabbitConfig.NOTIFICATION_RETRY_ROUTING_KEY, message);
        logger.warn("[NOTIFICATION] Scheduled retry attempt={} type={} recipient={} id={}",
                message.attempt(), message.type(), message.recipientId(), message.notificationId());
    }

    public void deadLetter(NotificationMessage message) {
        rabbitTemplate.convertAndSend(RabbitConfig.NOTIFICATION_EXCHANGE,
                RabbitConfig.NOTIFICATION_FAILED_ROUTING_KEY, message);
        logger.error("[NOTIFICATION] Moved to DLQ type={} recipient={} id={}",
                message.type(), message.recipientId(), message.notificationId());
    }
}
