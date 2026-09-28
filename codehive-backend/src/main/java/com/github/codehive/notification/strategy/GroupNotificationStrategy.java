package com.github.codehive.notification.strategy;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.github.codehive.model.dto.queue.NotificationMessage;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.notification.NotificationEmailContent;
import com.github.codehive.notification.NotificationFormatService;
import com.github.codehive.notification.NotificationStrategy;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.UserRepository;

@Component
public class GroupNotificationStrategy implements NotificationStrategy {
    private static final Set<NotificationType> TYPES = Set.of(
            NotificationType.STUDENT_ENROLLED,
            NotificationType.STUDENT_LEFT,
            NotificationType.REMOVED_FROM_GROUP,
            NotificationType.GROUP_ARCHIVED);

    private final ClassGroupRepository groupRepository;
    private final UserRepository userRepository;
    private final NotificationFormatService format;

    public GroupNotificationStrategy(ClassGroupRepository groupRepository, UserRepository userRepository,
                                     NotificationFormatService format) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.format = format;
    }

    @Override
    public Set<NotificationType> supportedTypes() {
        return TYPES;
    }

    @Override
    public NotificationEmailContent build(NotificationMessage message, User recipient) {
        ClassGroup group = groupRepository.findById(message.groupId())
                .orElseThrow(() -> new EntityNotFoundException("Group not found: " + message.groupId()));
        User actor = message.actorId() != null ? userRepository.findById(message.actorId()).orElse(null) : null;
        String actorName = actor != null ? format.fullName(actor) : "A student";
        return switch (message.type()) {
            case STUDENT_ENROLLED -> content(
                    "A student joined " + group.getName(), "NEW ENROLLMENT",
                    actorName + " joined your group",
                    "A new student is now enrolled and can access published assignments.",
                    group, List.of("Student: " + actorName), format.teacherDashboardUrl());
            case STUDENT_LEFT -> content(
                    "A student left " + group.getName(), "ENROLLMENT UPDATE",
                    actorName + " left your group",
                    "The student's enrollment history and previous submissions remain available.",
                    group, List.of("Student: " + actorName), format.teacherDashboardUrl());
            case REMOVED_FROM_GROUP -> content(
                    "You were removed from " + group.getName(), "GROUP UPDATE",
                    "Your group enrollment changed",
                    "You no longer have active access to this group. Previous submissions remain recorded.",
                    group, List.of(), format.studentDashboardUrl());
            case GROUP_ARCHIVED -> content(
                    group.getName() + " was archived", "GROUP ARCHIVED",
                    "Your group is now read-only",
                    "The teacher archived this group. Existing content remains available, but new submissions are disabled.",
                    group, List.of(), format.studentDashboardUrl());
            default -> throw new IllegalArgumentException("Unsupported group notification " + message.type());
        };
    }

    private NotificationEmailContent content(String subject, String badge, String title, String body,
                                             ClassGroup group, List<String> extraDetails, String actionUrl) {
        java.util.ArrayList<String> details = new java.util.ArrayList<>();
        details.add("Group: " + group.getName());
        details.addAll(extraDetails);
        return new NotificationEmailContent(subject, badge, title, body, "Group details", details,
                "Open CodeHive", actionUrl);
    }
}
