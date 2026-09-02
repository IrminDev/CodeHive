package com.github.codehive.notification.strategy;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.github.codehive.model.dto.queue.NotificationMessage;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.notification.NotificationEmailContent;
import com.github.codehive.notification.NotificationFormatService;
import com.github.codehive.notification.NotificationStrategy;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.TestSuiteRevisionRepository;
import com.github.codehive.model.enums.RevisionStatus;

@Component
public class AssignmentNotificationStrategy implements NotificationStrategy {
    private static final int MAX_DIAGNOSTIC_CHARS = 12_000;
    private static final int MAX_DIAGNOSTIC_LINES = 80;
    private static final Set<NotificationType> TYPES = Set.of(
            NotificationType.ASSIGNMENT_READY,
            NotificationType.ASSIGNMENT_VALIDATION_FAILED,
            NotificationType.ASSIGNMENT_PUBLISHED,
            NotificationType.ASSIGNMENT_RESCHEDULED,
            NotificationType.ASSIGNMENT_UPDATED,
            NotificationType.ASSIGNMENT_TESTS_UPDATED,
            NotificationType.ASSIGNMENT_GRADES_CLEARED,
            NotificationType.FEEDBACK_RECEIVED,
            NotificationType.GRADE_RETURNED,
            NotificationType.ASSIGNMENT_DUE_SOON,
            NotificationType.ASSIGNMENT_CLOSE_SOON,
            NotificationType.ASSIGNMENT_DUE_SOON_NO_SUBMISSION,
            NotificationType.ASSIGNMENT_CLOSE_SOON_NO_SUBMISSION);

    private final AssignmentRepository assignmentRepository;
    private final TestSuiteRevisionRepository testSuiteRevisionRepository;
    private final NotificationFormatService format;

    public AssignmentNotificationStrategy(AssignmentRepository assignmentRepository,
                                          TestSuiteRevisionRepository testSuiteRevisionRepository,
                                          NotificationFormatService format) {
        this.assignmentRepository = assignmentRepository;
        this.testSuiteRevisionRepository = testSuiteRevisionRepository;
        this.format = format;
    }

    @Override
    public Set<NotificationType> supportedTypes() {
        return TYPES;
    }

    @Override
    public NotificationEmailContent build(NotificationMessage message, User recipient) {
        Assignment assignment = assignmentRepository.findById(message.assignmentId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Assignment not found: " + message.assignmentId()));
        List<String> details = List.of(
                "Assignment: " + assignment.getTitle(),
                "Group: " + assignment.getGroup().getName(),
                "Due: " + format.format(assignment.getDueDate(), recipient),
                "Closes: " + format.format(assignment.getCloseDate(), recipient));

        return switch (message.type()) {
            case ASSIGNMENT_READY -> teacher(
                    "Assignment ready: " + assignment.getTitle(), "VALIDATION COMPLETE",
                    "Your assignment is ready",
                    "The worker generated all expected outputs successfully.", details);
            case ASSIGNMENT_VALIDATION_FAILED -> teacher(
                    "Assignment validation failed: " + assignment.getTitle(), "ACTION REQUIRED",
                    "The assignment could not be validated",
                    "Review the reference solution and test inputs before trying again.",
                    validationFailureDetails(assignment, details));
            case ASSIGNMENT_PUBLISHED -> student(
                    "New assignment: " + assignment.getTitle(), "NEW ASSIGNMENT",
                    "A new coding assignment is available",
                    "Open the assignment to review the problem, examples, limits, and accepted languages.",
                    assignment, details);
            case ASSIGNMENT_RESCHEDULED -> student(
                    "Schedule updated: " + assignment.getTitle(), "SCHEDULE UPDATED",
                    "An assignment schedule changed",
                    "Review the latest due and close dates so you can plan your submission.",
                    assignment, details);
            case ASSIGNMENT_UPDATED -> student(
                    "Assignment updated: " + assignment.getTitle(), "ASSIGNMENT UPDATED",
                    "An assignment was updated",
                    "Open the assignment to review the latest information.",
                    assignment, details);
            case ASSIGNMENT_TESTS_UPDATED -> student(
                    "Tests updated: " + assignment.getTitle(), "TESTS UPDATED",
                    "The assignment test suite changed",
                    "Your current submission is being evaluated against the updated tests.",
                    assignment, details);
            case ASSIGNMENT_GRADES_CLEARED -> teacher(
                    "Grades require review: " + assignment.getTitle(), "GRADES CLEARED",
                    "Assignment grades were cleared",
                    "The evaluation criteria or maximum points changed. Review and grade current work again.",
                    details);
            case FEEDBACK_RECEIVED -> student(
                    "New feedback: " + assignment.getTitle(), "NEW FEEDBACK",
                    "You received feedback from your teacher",
                    "Open the assignment to review the new comment.",
                    assignment, details);
            case GRADE_RETURNED -> student(
                    "Grade returned: " + assignment.getTitle(), "GRADE RETURNED",
                    "Your teacher returned a grade",
                    "Open the assignment to review your grade and feedback.",
                    assignment, details);
            case ASSIGNMENT_DUE_SOON -> teacher(
                    "Due soon: " + assignment.getTitle(), "DUE SOON",
                    "Your assignment due date is approaching",
                    "Submissions received after the due date will be marked late.", details);
            case ASSIGNMENT_CLOSE_SOON -> teacher(
                    "Closing soon: " + assignment.getTitle(), "CLOSING SOON",
                    "Your assignment will stop accepting submissions",
                    "Students will not be able to create definitive submissions after the close date.", details);
            case ASSIGNMENT_DUE_SOON_NO_SUBMISSION -> student(
                    "Due soon: " + assignment.getTitle(), "DUE SOON",
                    "You have not submitted this assignment",
                    "Submit before the due date to avoid a late-delivery flag.", assignment, details);
            case ASSIGNMENT_CLOSE_SOON_NO_SUBMISSION -> student(
                    "Closing soon: " + assignment.getTitle(), "CLOSING SOON",
                    "This assignment will close soon",
                    "You have no definitive submission yet. Submit before the close date.", assignment, details);
            default -> throw new IllegalArgumentException("Unsupported assignment notification " + message.type());
        };
    }

    private NotificationEmailContent teacher(String subject, String badge, String title, String message,
                                             List<String> details) {
        return new NotificationEmailContent(subject, badge, title, message, "Assignment details", details,
                "Open teacher dashboard", format.teacherDashboardUrl());
    }

    private NotificationEmailContent student(String subject, String badge, String title, String message,
                                             Assignment assignment, List<String> details) {
        return new NotificationEmailContent(subject, badge, title, message, "Assignment details", details,
                "Open assignment", format.assignmentUrl(assignment.getId()));
    }

    private List<String> validationFailureDetails(Assignment assignment, List<String> details) {
        List<String> lines = new ArrayList<>(details);
        String diagnostic = testSuiteRevisionRepository
                .findTopByAssignmentIdAndStatusOrderByRevisionNumberDesc(
                        assignment.getId(), RevisionStatus.FAILED)
                .map(revision -> revision.getFailureMessage())
                .filter(message -> message != null && !message.isBlank())
                .orElse("The worker did not provide diagnostic output.");

        diagnostic = diagnostic.replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "");
        boolean truncated = diagnostic.length() > MAX_DIAGNOSTIC_CHARS;
        if (truncated) diagnostic = diagnostic.substring(0, MAX_DIAGNOSTIC_CHARS);

        lines.add("Validation output:");
        String[] diagnosticLines = diagnostic.replace("\r\n", "\n").split("\n", -1);
        int lineCount = Math.min(diagnosticLines.length, MAX_DIAGNOSTIC_LINES);
        for (int index = 0; index < lineCount; index++) {
            lines.add("  " + diagnosticLines[index]);
        }
        if (truncated || diagnosticLines.length > MAX_DIAGNOSTIC_LINES) {
            lines.add("  … diagnostic output truncated; open the assignment to review the full failure.");
        }
        return List.copyOf(lines);
    }
}
