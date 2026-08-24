package com.github.codehive.model.enums;

import java.util.EnumSet;
import java.util.Set;

public enum NotificationType {
    STUDENT_ENROLLED(NotificationAudience.OWNER, false, null),
    STUDENT_LEFT(NotificationAudience.OWNER, false, null),
    STUDENT_ENROLLMENT_CANCELLED(NotificationAudience.OWNER, false, null),
    ASSIGNMENT_SUBMITTED(NotificationAudience.OWNER, false, null),
    LATE_ASSIGNMENT_SUBMITTED(NotificationAudience.OWNER, false, null),
    ASSIGNMENT_DUE_SOON(NotificationAudience.OWNER, true, 1440),
    ASSIGNMENT_CLOSE_SOON(NotificationAudience.OWNER, true, 1440),
    ASSIGNMENT_VALIDATION_FAILED(NotificationAudience.OWNER, false, null),
    ASSIGNMENT_READY(NotificationAudience.OWNER, false, null),
    ASSIGNMENT_GRADES_CLEARED(NotificationAudience.OWNER, false, null),

    ASSIGNMENT_PUBLISHED(NotificationAudience.STUDENT, false, null),
    ASSIGNMENT_DUE_SOON_NO_SUBMISSION(NotificationAudience.STUDENT, true, 1440),
    ASSIGNMENT_CLOSE_SOON_NO_SUBMISSION(NotificationAudience.STUDENT, true, 120),
    ASSIGNMENT_RESCHEDULED(NotificationAudience.STUDENT, false, null),
    ASSIGNMENT_UPDATED(NotificationAudience.STUDENT, false, null),
    ASSIGNMENT_TESTS_UPDATED(NotificationAudience.STUDENT, false, null),
    SUBMISSION_EVALUATED(NotificationAudience.STUDENT, false, null),
    SUBMISSION_REEVALUATED(NotificationAudience.STUDENT, false, null),
    FEEDBACK_RECEIVED(NotificationAudience.STUDENT, false, null),
    GRADE_RETURNED(NotificationAudience.STUDENT, false, null),
    REMOVED_FROM_GROUP(NotificationAudience.STUDENT, false, null),
    GROUP_ARCHIVED(NotificationAudience.STUDENT, false, null);

    public static final Set<Integer> ALLOWED_LEAD_MINUTES = Set.of(120, 1440, 2880, 10080);

    private final NotificationAudience audience;
    private final boolean reminder;
    private final Integer defaultLeadMinutes;

    NotificationType(NotificationAudience audience, boolean reminder, Integer defaultLeadMinutes) {
        this.audience = audience;
        this.reminder = reminder;
        this.defaultLeadMinutes = defaultLeadMinutes;
    }

    public NotificationAudience getAudience() {
        return audience;
    }

    public boolean isReminder() {
        return reminder;
    }

    public Integer getDefaultLeadMinutes() {
        return defaultLeadMinutes;
    }

    public static Set<NotificationType> forUser(com.github.codehive.model.entity.User user) {
        EnumSet<NotificationType> result = EnumSet.noneOf(NotificationType.class);
        for (NotificationType type : values()) {
            if (type.audience == NotificationAudience.STUDENT && user.getRole() == Role.STUDENT) {
                result.add(type);
            }
            if (type.audience == NotificationAudience.OWNER && user.canManageGroups()) {
                result.add(type);
            }
        }
        return result;
    }
}
