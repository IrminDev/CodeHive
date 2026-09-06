package com.github.codehive.notification;

import java.util.Set;

import com.github.codehive.model.dto.queue.NotificationMessage;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.NotificationType;

public interface NotificationStrategy {
    Set<NotificationType> supportedTypes();
    NotificationEmailContent build(NotificationMessage message, User recipient);
}
