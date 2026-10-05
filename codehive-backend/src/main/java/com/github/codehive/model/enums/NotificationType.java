package com.github.codehive.model.enums;

import java.util.EnumSet;
import java.util.Set;

public enum NotificationType {
    STUDENT_ENROLLED(Role.TEACHER, false, null),
    STUDENT_LEFT(Role.TEACHER, false, null),
    ASSIGNMENT_SUBMITTED(Role.TEACHER, false, null),
    LATE_ASSIGNMENT_SUBMITTED(Role.TEACHER, false, null),
    ASSIGNMENT_DUE_SOON(Role.TEACHER, true, 1440),
    ASSIGNMENT_CLOSE_SOON(Role.TEACHER, true, 1440),
    ASSIGNMENT_VALIDATION_FAILED(Role.TEACHER, false, null),
    ASSIGNMENT_READY(Role.TEACHER, false, null),
    ASSIGNMENT_GRADES_CLEARED(Role.TEACHER, false, null),

    ASSIGNMENT_PUBLISHED(Role.STUDENT, false, null),
    ASSIGNMENT_DUE_SOON_NO_SUBMISSION(Role.STUDENT, true, 1440),
    ASSIGNMENT_CLOSE_SOON_NO_SUBMISSION(Role.STUDENT, true, 120),
    ASSIGNMENT_RESCHEDULED(Role.STUDENT, false, null),
    ASSIGNMENT_UPDATED(Role.STUDENT, false, null),
    ASSIGNMENT_TESTS_UPDATED(Role.STUDENT, false, null),
    SUBMISSION_EVALUATED(Role.STUDENT, false, null),
    SUBMISSION_REEVALUATED(Role.STUDENT, false, null),
    FEEDBACK_RECEIVED(Role.STUDENT, false, null),
    GRADE_RETURNED(Role.STUDENT, false, null),
    REMOVED_FROM_GROUP(Role.STUDENT, false, null),
    GROUP_ARCHIVED(Role.STUDENT, false, null);

    public static final Set<Integer> ALLOWED_LEAD_MINUTES = Set.of(120, 1440, 2880, 10080);

    private final Role audience;
    private final boolean reminder;
    private final Integer defaultLeadMinutes;

    NotificationType(Role audience, boolean reminder, Integer defaultLeadMinutes) {
        this.audience = audience;
        this.reminder = reminder;
        this.defaultLeadMinutes = defaultLeadMinutes;
    }

    public Role getAudience() {
        return audience;
    }

    public boolean isReminder() {
        return reminder;
    }

    public Integer getDefaultLeadMinutes() {
        return defaultLeadMinutes;
    }

    public static Set<NotificationType> forRole(Role role) {
        EnumSet<NotificationType> result = EnumSet.noneOf(NotificationType.class);
        for (NotificationType type : values()) {
            if (type.audience == role) result.add(type);
        }
        return result;
    }
}
