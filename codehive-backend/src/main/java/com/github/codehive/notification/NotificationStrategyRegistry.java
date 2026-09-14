package com.github.codehive.notification;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.github.codehive.model.enums.NotificationType;

@Component
public class NotificationStrategyRegistry {
    private final Map<NotificationType, NotificationStrategy> strategies =
            new EnumMap<>(NotificationType.class);

    public NotificationStrategyRegistry(List<NotificationStrategy> strategyList) {
        for (NotificationStrategy strategy : strategyList) {
            for (NotificationType type : strategy.supportedTypes()) {
                NotificationStrategy previous = strategies.put(type, strategy);
                if (previous != null) {
                    throw new IllegalStateException("Multiple notification strategies support " + type);
                }
            }
        }
        for (NotificationType type : NotificationType.values()) {
            if (!strategies.containsKey(type)) {
                throw new IllegalStateException("No notification strategy registered for " + type);
            }
        }
    }

    public NotificationStrategy get(NotificationType type) {
        NotificationStrategy strategy = strategies.get(type);
        if (strategy == null) {
            throw new IllegalArgumentException("No notification strategy registered for " + type);
        }
        return strategy;
    }
}
