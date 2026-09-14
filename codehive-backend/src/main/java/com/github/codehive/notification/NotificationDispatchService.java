package com.github.codehive.notification;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import com.github.codehive.messaging.producer.NotificationProducer;
import com.github.codehive.model.dto.queue.NotificationMessage;
import com.github.codehive.model.entity.NotificationDispatchLog;
import com.github.codehive.model.entity.User;
import com.github.codehive.repository.NotificationDispatchLogRepository;
import com.github.codehive.service.NotificationPreferenceService;

@Service
public class NotificationDispatchService {
    private final NotificationProducer producer;
    private final NotificationPreferenceService preferenceService;
    private final NotificationDispatchLogRepository dispatchLogRepository;

    public NotificationDispatchService(NotificationProducer producer,
                                       NotificationPreferenceService preferenceService,
                                       NotificationDispatchLogRepository dispatchLogRepository) {
        this.producer = producer;
        this.preferenceService = preferenceService;
        this.dispatchLogRepository = dispatchLogRepository;
    }

    public void sendIfEnabled(User recipient, NotificationMessage message) {
        if (preferenceService.isEnabled(recipient, message.type())) {
            producer.send(message);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean sendOnceIfEnabled(String deduplicationKey, User recipient, NotificationMessage message) {
        if (!preferenceService.isEnabled(recipient, message.type())
                || dispatchLogRepository.existsByDeduplicationKey(deduplicationKey)) {
            return false;
        }
        dispatchLogRepository.save(new NotificationDispatchLog(deduplicationKey));
        producer.send(message);
        return true;
    }

    public static UUID deterministicId(UUID eventId, UUID recipientId) {
        return UUID.nameUUIDFromBytes((eventId + ":" + recipientId).getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }
}
