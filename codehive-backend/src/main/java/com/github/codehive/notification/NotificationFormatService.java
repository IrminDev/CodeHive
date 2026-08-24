package com.github.codehive.notification;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
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
        if (instant == null) return null;
        ZoneId timezone = preferenceService.getTimezone(recipient);
        return DATE_TIME.format(instant.atZone(timezone));
    }

    public String format(LocalDateTime dateTime, User recipient) {
        if (dateTime == null) return null;
        return format(dateTime.atZone(ZoneId.systemDefault()).toInstant(), recipient);
    }

    public Instant toInstant(LocalDateTime dateTime) {
        return dateTime == null ? null : dateTime.atZone(ZoneId.systemDefault()).toInstant();
    }

    public String remaining(Instant deadline, Instant occurredAt) {
        if (deadline == null || occurredAt == null || !deadline.isAfter(occurredAt)) return null;
        long minutes = Math.max(1, Duration.between(occurredAt, deadline).toMinutes());
        if (minutes >= 23 * 60) {
            long days = Math.max(1, Math.round(minutes / 1440.0));
            return days + (days == 1 ? " day remaining" : " days remaining");
        }
        if (minutes >= 90) {
            long hours = Math.max(1, Math.round(minutes / 60.0));
            return hours + (hours == 1 ? " hour remaining" : " hours remaining");
        }
        return minutes + (minutes == 1 ? " minute remaining" : " minutes remaining");
    }

    public String fullName(User user) {
        return user.getName() + " " + user.getLastName();
    }

    public String assignmentUrl(java.util.UUID assignmentId) {
        return frontendUrl + "/assignment/" + assignmentId;
    }

    public String submissionReportUrl(java.util.UUID assignmentId, java.util.UUID executionId) {
        return assignmentUrl(assignmentId) + "/report/" + executionId;
    }

    public String teacherGroupUrl(java.util.UUID groupId) {
        return frontendUrl + "/teacher/groups/" + groupId;
    }

    public String teacherAssignmentUrl(java.util.UUID assignmentId) {
        return frontendUrl + "/teacher/assignments/" + assignmentId + "/preview";
    }

    public String teacherGradesUrl(java.util.UUID groupId, java.util.UUID assignmentId,
                                   java.util.UUID studentId) {
        StringBuilder url = new StringBuilder(frontendUrl).append("/teacher/grades");
        String separator = "?";
        if (groupId != null) {
            url.append(separator).append("groupId=").append(groupId);
            separator = "&";
        }
        if (assignmentId != null) {
            url.append(separator).append("assignmentId=").append(assignmentId);
            separator = "&";
        }
        if (studentId != null) url.append(separator).append("studentId=").append(studentId);
        return url.toString();
    }

    public String studentGradesUrl(java.util.UUID assignmentId) {
        return frontendUrl + "/grades?assignmentId=" + assignmentId;
    }

    public String studentGroupsUrl() {
        return frontendUrl + "/groups";
    }

    public String studentGroupUrl(java.util.UUID groupId) {
        return frontendUrl + "/groups/" + groupId;
    }

    public String teacherDashboardUrl() {
        return frontendUrl + "/teacher";
    }

    public String studentDashboardUrl() {
        return frontendUrl + "/dashboard";
    }
}
