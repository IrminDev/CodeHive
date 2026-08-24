package com.github.codehive.notification.strategy;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.github.codehive.model.dto.queue.NotificationMessage;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.notification.NotificationCallout;
import com.github.codehive.notification.NotificationEmailContent;
import com.github.codehive.notification.NotificationFact;
import com.github.codehive.notification.NotificationFormatService;
import com.github.codehive.notification.NotificationStrategy;
import com.github.codehive.repository.ClassGroupRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.UserRepository;

@Component
public class GroupNotificationStrategy implements NotificationStrategy {
    private static final Set<NotificationType> TYPES = Set.of(
            NotificationType.STUDENT_ENROLLED,
            NotificationType.STUDENT_LEFT,
            NotificationType.STUDENT_ENROLLMENT_CANCELLED,
            NotificationType.REMOVED_FROM_GROUP,
            NotificationType.GROUP_ARCHIVED);

    private final ClassGroupRepository groupRepository;
    private final GroupEnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final NotificationFormatService format;

    public GroupNotificationStrategy(ClassGroupRepository groupRepository,
                                     GroupEnrollmentRepository enrollmentRepository,
                                     UserRepository userRepository,
                                     NotificationFormatService format) {
        this.groupRepository = groupRepository;
        this.enrollmentRepository = enrollmentRepository;
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
        GroupEnrollment enrollment = enrollment(message, group, actor);
        User student = enrollment != null ? enrollment.getStudent() : actor;
        String studentName = student != null ? format.fullName(student) : "A student";
        return switch (message.type()) {
            case STUDENT_ENROLLED -> content(message.type(),
                    studentName + " joined " + group.getName(),
                    studentName + " can now access published assignments in " + group.getName() + ".",
                    enrollmentFacts(group, student, enrollment, recipient, true), null,
                    "View roster", format.teacherGroupUrl(group.getId()));
            case STUDENT_LEFT -> content(message.type(),
                    studentName + " left " + group.getName(),
                    studentName + " left the group. Previous submissions and enrollment history remain available.",
                    enrollmentFacts(group, student, enrollment, recipient, false), null,
                    "View roster", format.teacherGroupUrl(group.getId()));
            case STUDENT_ENROLLMENT_CANCELLED -> content(message.type(),
                    "Enrollment cancelled in " + group.getName(),
                    studentName + " no longer has student access after an account role change.",
                    enrollmentFacts(group, student, enrollment, recipient, false),
                    new NotificationCallout("History retained",
                            "Previous submissions and academic records remain available to group managers."),
                    "View roster", format.teacherGroupUrl(group.getId()));
            case REMOVED_FROM_GROUP -> content(message.type(),
                    "You were removed from " + group.getName(),
                    "Your active access ended. Previous submissions remain recorded.",
                    removalFacts(group, actor, enrollment, recipient),
                    new NotificationCallout("Access ended",
                            "You cannot open assignments or submit new work for this group."),
                    "View my groups", format.studentGroupsUrl());
            case GROUP_ARCHIVED -> content(message.type(),
                    group.getName() + " was archived",
                    "Group content remains available, but new definitive submissions are disabled.",
                    archiveFacts(group, recipient),
                    new NotificationCallout("Read-only group",
                            "Existing assignments and submission history remain visible."),
                    "View group", format.studentGroupUrl(group.getId()));
            default -> throw new IllegalArgumentException("Unsupported group notification " + message.type());
        };
    }

    private GroupEnrollment enrollment(NotificationMessage message, ClassGroup group, User actor) {
        if (message.resourceId() != null) {
            GroupEnrollment exact = enrollmentRepository.findById(message.resourceId()).orElse(null);
            if (exact != null) return exact;
        }
        if (actor == null) return null;
        return enrollmentRepository.findByGroupIdAndStudentId(group.getId(), actor.getId()).orElse(null);
    }

    private List<NotificationFact> enrollmentFacts(ClassGroup group, User student,
                                                    GroupEnrollment enrollment, User recipient,
                                                    boolean joined) {
        java.util.ArrayList<NotificationFact> facts = new java.util.ArrayList<>();
        facts.add(new NotificationFact("Group", group.getName()));
        if (student != null) {
            facts.add(new NotificationFact("Student", format.fullName(student)));
            if (student.getEnrollmentNumber() != null && !student.getEnrollmentNumber().isBlank()) {
                facts.add(new NotificationFact("Enrollment number", student.getEnrollmentNumber()));
            }
        }
        if (enrollment != null) add(facts, joined ? "Joined" : "Ended",
                format.format(joined ? enrollment.getJoinedAt() : enrollment.getEndedAt(), recipient));
        return List.copyOf(facts);
    }

    private List<NotificationFact> removalFacts(ClassGroup group, User actor,
                                                GroupEnrollment enrollment, User recipient) {
        java.util.ArrayList<NotificationFact> facts = new java.util.ArrayList<>();
        facts.add(new NotificationFact("Group", group.getName()));
        if (actor != null) facts.add(new NotificationFact("Removed by", format.fullName(actor)));
        if (enrollment != null) add(facts, "Removed", format.format(enrollment.getEndedAt(), recipient));
        return List.copyOf(facts);
    }

    private List<NotificationFact> archiveFacts(ClassGroup group, User recipient) {
        java.util.ArrayList<NotificationFact> facts = new java.util.ArrayList<>();
        facts.add(new NotificationFact("Group", group.getName()));
        if (group.getOwner() != null) facts.add(new NotificationFact("Owner", format.fullName(group.getOwner())));
        add(facts, "Archived", format.format(group.getUpdatedAt(), recipient));
        return List.copyOf(facts);
    }

    private void add(List<NotificationFact> facts, String label, String value) {
        if (value != null && !value.isBlank()) facts.add(new NotificationFact(label, value));
    }

    private NotificationEmailContent content(NotificationType type, String subject, String summary,
                                             List<NotificationFact> facts, NotificationCallout callout,
                                             String ctaLabel, String ctaUrl) {
        return new NotificationEmailContent(type, subject, summary, facts, callout, ctaLabel, ctaUrl);
    }
}
