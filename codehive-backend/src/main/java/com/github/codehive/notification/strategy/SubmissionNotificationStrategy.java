package com.github.codehive.notification.strategy;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.github.codehive.model.dto.queue.NotificationMessage;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.notification.NotificationEmailContent;
import com.github.codehive.notification.NotificationFormatService;
import com.github.codehive.notification.NotificationStrategy;
import com.github.codehive.repository.ExecutionRepository;
import com.github.codehive.repository.SubmissionRepository;

@Component
public class SubmissionNotificationStrategy implements NotificationStrategy {
    private static final Set<NotificationType> TYPES = Set.of(
            NotificationType.ASSIGNMENT_SUBMITTED,
            NotificationType.LATE_ASSIGNMENT_SUBMITTED,
            NotificationType.SUBMISSION_EVALUATED,
            NotificationType.SUBMISSION_REEVALUATED);

    private final SubmissionRepository submissionRepository;
    private final ExecutionRepository executionRepository;
    private final NotificationFormatService format;

    public SubmissionNotificationStrategy(SubmissionRepository submissionRepository,
                                          ExecutionRepository executionRepository,
                                          NotificationFormatService format) {
        this.submissionRepository = submissionRepository;
        this.executionRepository = executionRepository;
        this.format = format;
    }

    @Override
    public Set<NotificationType> supportedTypes() {
        return TYPES;
    }

    @Override
    public NotificationEmailContent build(NotificationMessage message, User recipient) {
        Submission submission = submissionRepository.findById(message.submissionId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Submission not found: " + message.submissionId()));
        List<String> details = List.of(
                "Assignment: " + submission.getAssignment().getTitle(),
                "Group: " + submission.getAssignment().getGroup().getName(),
                "Student: " + format.fullName(submission.getStudent()),
                "Language: " + submission.getLanguage().name(),
                "Late: " + (Boolean.TRUE.equals(submission.getDeliveredLate()) ? "Yes" : "No"));

        return switch (message.type()) {
            case ASSIGNMENT_SUBMITTED -> teacher(
                    "New submission: " + submission.getAssignment().getTitle(), "NEW SUBMISSION",
                    format.fullName(submission.getStudent()) + " submitted an assignment",
                    "A new definitive submission was received.", details);
            case LATE_ASSIGNMENT_SUBMITTED -> teacher(
                    "Late submission: " + submission.getAssignment().getTitle(), "LATE SUBMISSION",
                    format.fullName(submission.getStudent()) + " submitted after the due date",
                    "The submission was accepted and permanently marked as late.", details);
            case SUBMISSION_EVALUATED -> evaluated(submission, details);
            case SUBMISSION_REEVALUATED -> new NotificationEmailContent(
                    "Submission re-evaluated: " + submission.getAssignment().getTitle(), "RESULT UPDATED",
                    "Your submission was evaluated against updated tests",
                    "Open the assignment to review the latest result.",
                    "Submission details", details, "Review result",
                    format.assignmentUrl(submission.getAssignment().getId()));
            default -> throw new IllegalArgumentException("Unsupported submission notification " + message.type());
        };
    }

    private NotificationEmailContent evaluated(Submission submission, List<String> baseDetails) {
        Execution execution = executionRepository.findTopBySubmissionIdOrderByCreatedAtDesc(
                submission.getId()).orElse(null);
        java.util.ArrayList<String> details = new java.util.ArrayList<>(baseDetails);
        if (execution != null) details.add("Result: " + execution.getStatus().name());
        return new NotificationEmailContent(
                "Submission evaluated: " + submission.getAssignment().getTitle(), "RESULT READY",
                "Your submission has been evaluated",
                "Open the assignment to review the execution result and per-test feedback.",
                "Submission details", details, "Review result",
                format.assignmentUrl(submission.getAssignment().getId()));
    }

    private NotificationEmailContent teacher(String subject, String badge, String title, String message,
                                             List<String> details) {
        return new NotificationEmailContent(subject, badge, title, message, "Submission details", details,
                "Open teacher dashboard", format.teacherDashboardUrl());
    }
}
