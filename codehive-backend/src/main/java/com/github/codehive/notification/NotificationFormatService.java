package com.github.codehive.notification;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.github.codehive.model.entity.User;
import com.github.codehive.service.NotificationPreferenceService;

@Component
public class NotificationFormatService {
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter
            .ofPattern("MMMM d, uuuu 'at' h:mm a", Locale.US);

    private final NotificationPreferenceService preferenceService;
    private final String frontendUrl;

    public NotificationFormatService(NotificationPreferenceService preferenceService,
                                     @Value("${frontend.url}") String frontendUrl) {
        this.preferenceService = preferenceService;
        this.frontendUrl = frontendUrl;
    }

    public String format(Instant instant, User recipient) {
        if (instant == null) return "Not configured";
        ZoneId timezone = preferenceService.getTimezone(recipient);
        return DATE_TIME.format(instant.atZone(timezone)) + " (" + timezone.getId() + ")";
    }

    public String fullName(User user) {
        return user.getName() + " " + user.getLastName();
    }

    public String assignmentUrl(java.util.UUID assignmentId) {
        return frontendUrl + "/assignment/" + assignmentId;
    }

    public String teacherDashboardUrl() {
        return frontendUrl + "/teacher";
    }

    public String studentDashboardUrl() {
        return frontendUrl + "/dashboard";
    }
}
