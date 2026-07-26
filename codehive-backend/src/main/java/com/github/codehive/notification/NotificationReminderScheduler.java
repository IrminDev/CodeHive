package com.github.codehive.notification;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.github.codehive.model.dto.queue.NotificationMessage;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.GroupEnrollment;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.service.NotificationPreferenceService;

@Component
public class NotificationReminderScheduler {
    private static final Logger logger = LoggerFactory.getLogger(NotificationReminderScheduler.class);
    private static final Duration MAXIMUM_LOOKAHEAD = Duration.ofDays(7);

    private final AssignmentRepository assignmentRepository;
    private final GroupEnrollmentRepository enrollmentRepository;
    private final SubmissionRepository submissionRepository;
    private final NotificationPreferenceService preferenceService;
    private final NotificationDispatchService dispatchService;

    public NotificationReminderScheduler(AssignmentRepository assignmentRepository,
                                         GroupEnrollmentRepository enrollmentRepository,
                                         SubmissionRepository submissionRepository,
                                         NotificationPreferenceService preferenceService,
                                         NotificationDispatchService dispatchService) {
        this.assignmentRepository = assignmentRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.submissionRepository = submissionRepository;
        this.preferenceService = preferenceService;
        this.dispatchService = dispatchService;
    }

    @Transactional(readOnly = true)
    @Scheduled(fixedDelayString = "${notification.reminder.fixed-delay-ms:600000}",
            initialDelayString = "${notification.reminder.initial-delay-ms:60000}")
    public void publishDueNotifications() {
        Instant now = Instant.now();
        publishNewAssignments(now);
        List<Assignment> candidates = assignmentRepository.findReminderCandidates(
                AssignmentValidationStatus.READY, now, now.plus(MAXIMUM_LOOKAHEAD));
        for (Assignment assignment : candidates) {
            publishTeacherReminder(assignment, NotificationType.ASSIGNMENT_DUE_SOON,
                    assignment.getDueDate(), now);
            publishTeacherReminder(assignment, NotificationType.ASSIGNMENT_CLOSE_SOON,
                    assignment.getCloseDate(), now);
            List<GroupEnrollment> enrollments = enrollmentRepository
                    .findByGroupIdAndStatusOrderByJoinedAtAsc(
                            assignment.getGroup().getId(), EnrollmentStatus.ACTIVE);
            for (GroupEnrollment enrollment : enrollments) {
                User student = enrollment.getStudent();
                if (submissionRepository.existsByAssignmentIdAndStudentId(assignment.getId(), student.getId())) {
                    continue;
                }
                publishStudentReminder(assignment, student,
                        NotificationType.ASSIGNMENT_DUE_SOON_NO_SUBMISSION,
                        assignment.getDueDate(), now);
                publishStudentReminder(assignment, student,
                        NotificationType.ASSIGNMENT_CLOSE_SOON_NO_SUBMISSION,
                        assignment.getCloseDate(), now);
            }
        }
    }

    private void publishNewAssignments(Instant now) {
        for (Assignment assignment : assignmentRepository.findReadyActiveForNotifications(
                AssignmentValidationStatus.READY)) {
            if (assignment.getLaunchDate() != null && now.isBefore(assignment.getLaunchDate())) continue;
            List<GroupEnrollment> enrollments = enrollmentRepository
                    .findByGroupIdAndStatusOrderByJoinedAtAsc(
                            assignment.getGroup().getId(), EnrollmentStatus.ACTIVE);
            for (GroupEnrollment enrollment : enrollments) {
                User student = enrollment.getStudent();
                NotificationMessage message = message(NotificationType.ASSIGNMENT_PUBLISHED,
                        student, assignment);
                String key = "ASSIGNMENT_PUBLISHED:" + assignment.getId() + ":" + student.getId();
                dispatchService.sendOnceIfEnabled(key, student, message);
            }
        }
    }

    private void publishTeacherReminder(Assignment assignment, NotificationType type,
                                        Instant deadline, Instant now) {
        User teacher = assignment.getGroup().getOwner();
        if (isInsideWindow(teacher, type, deadline, now)) {
            publishOnce(assignment, teacher, type);
        }
    }

    private void publishStudentReminder(Assignment assignment, User student, NotificationType type,
                                        Instant deadline, Instant now) {
        if (isInsideWindow(student, type, deadline, now)) {
            publishOnce(assignment, student, type);
        }
    }

    private boolean isInsideWindow(User recipient, NotificationType type, Instant deadline, Instant now) {
        if (deadline == null || !now.isBefore(deadline) || !preferenceService.isEnabled(recipient, type)) {
            return false;
        }
        int leadMinutes = preferenceService.getReminderLeadMinutes(recipient, type);
        return !now.isBefore(deadline.minus(Duration.ofMinutes(leadMinutes)));
    }

    private void publishOnce(Assignment assignment, User recipient, NotificationType type) {
        int lead = preferenceService.getReminderLeadMinutes(recipient, type);
        String key = type + ":" + assignment.getId() + ":" + recipient.getId() + ":" + lead;
        if (dispatchService.sendOnceIfEnabled(key, recipient, message(type, recipient, assignment))) {
            logger.info("[NOTIFICATION] Scheduled type={} assignment={} recipient={}",
                    type, assignment.getId(), recipient.getId());
        }
    }

    private NotificationMessage message(NotificationType type, User recipient, Assignment assignment) {
        return new NotificationMessage(UUID.randomUUID(), type, recipient.getId(),
                assignment.getAuthor().getId(), assignment.getGroup().getId(), assignment.getId(),
                null, Instant.now(), 0, 1);
    }
}
