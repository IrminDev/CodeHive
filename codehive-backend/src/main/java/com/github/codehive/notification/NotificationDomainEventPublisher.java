package com.github.codehive.notification;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import com.github.codehive.notification.event.NotificationDomainEvent;

@Component
public class NotificationDomainEventPublisher {
    private final ApplicationEventPublisher eventPublisher;

    public NotificationDomainEventPublisher(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    public void publish(NotificationDomainEvent event) {
        eventPublisher.publishEvent(event);
    }
}
