package com.github.codehive.notification.strategy;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.github.codehive.model.dto.queue.NotificationMessage;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentFeedback;
import com.github.codehive.model.entity.AssignmentGrade;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.FeedbackStatus;
import com.github.codehive.model.enums.GradeStatus;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.notification.NotificationCallout;
import com.github.codehive.notification.NotificationEmailContent;
import com.github.codehive.notification.NotificationFact;
import com.github.codehive.notification.NotificationFormatService;
import com.github.codehive.notification.NotificationStrategy;
import com.github.codehive.repository.AssignmentFeedbackRepository;
import com.github.codehive.repository.AssignmentGradeRepository;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.UserRepository;

@Component
public class StudentReviewNotificationStrategy implements NotificationStrategy {
    private static final int MAX_FEEDBACK_PREVIEW = 240;
    private static final Set<NotificationType> TYPES = Set.of(
            NotificationType.FEEDBACK_RECEIVED,
            NotificationType.GRADE_RETURNED);

    private final AssignmentRepository assignmentRepository;
    private final AssignmentFeedbackRepository feedbackRepository;
    private final AssignmentGradeRepository gradeRepository;
    private final UserRepository userRepository;
    private final NotificationFormatService format;

    public StudentReviewNotificationStrategy(AssignmentRepository assignmentRepository,
                                             AssignmentFeedbackRepository feedbackRepository,
                                             AssignmentGradeRepository gradeRepository,
                                             UserRepository userRepository,
                                             NotificationFormatService format) {
        this.assignmentRepository = assignmentRepository;
        this.feedbackRepository = feedbackRepository;
        this.gradeRepository = gradeRepository;
        this.userRepository = userRepository;
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
        return switch (message.type()) {
            case FEEDBACK_RECEIVED -> feedback(message, assignment, recipient);
            case GRADE_RETURNED -> grade(message, assignment, recipient);
            default -> throw new IllegalArgumentException("Unsupported review notification " + message.type());
        };
    }

    private NotificationEmailContent feedback(NotificationMessage message, Assignment assignment,
                                              User recipient) {
        AssignmentFeedback feedback = message.resourceId() == null ? null
                : feedbackRepository.findById(message.resourceId())
                        .filter(item -> item.getStatus() == FeedbackStatus.PUBLISHED).orElse(null);
        User author = feedback != null ? feedback.getAuthor() : actor(message);
        List<NotificationFact> facts = baseFacts(assignment);
        if (author != null) facts.add(new NotificationFact("Teacher", format.fullName(author)));
        if (feedback != null) add(facts, "Sent", format.format(feedback.getCreatedAt(), recipient));
        NotificationCallout callout = feedback == null ? null
                : new NotificationCallout("Feedback preview", preview(feedback.getBody()));
        return new NotificationEmailContent(NotificationType.FEEDBACK_RECEIVED,
                "New feedback: " + assignment.getTitle(),
                (author == null ? "Your teacher" : format.fullName(author))
                        + " left feedback on " + assignment.getTitle() + ".",
                facts, callout, "View feedback", format.studentGradesUrl(assignment.getId()));
    }

    private NotificationEmailContent grade(NotificationMessage message, Assignment assignment,
                                           User recipient) {
        AssignmentGrade grade = message.resourceId() == null ? null
                : gradeRepository.findById(message.resourceId())
                        .filter(item -> item.getStatus() == GradeStatus.RETURNED).orElse(null);
        User grader = grade != null ? grade.getGradedBy() : actor(message);
        List<NotificationFact> facts = new ArrayList<>(List.of(
                new NotificationFact("Group", assignment.getGroup().getName())));
        if (grade != null) {
            facts.add(new NotificationFact("Score", decimal(grade.getValue()) + " / "
                    + decimal(grade.getMaxPointsSnapshot())));
            add(facts, "Percentage", percentage(grade));
        }
        if (grader != null) facts.add(new NotificationFact("Graded by", format.fullName(grader)));
        if (grade != null) add(facts, "Returned", format.format(grade.getReturnedAt(), recipient));
        return new NotificationEmailContent(NotificationType.GRADE_RETURNED,
                "Grade returned: " + assignment.getTitle(),
                "Your grade for " + assignment.getTitle() + " is ready to review.",
                facts, null, "View grade", format.studentGradesUrl(assignment.getId()));
    }

    private User actor(NotificationMessage message) {
        return message.actorId() == null ? null : userRepository.findById(message.actorId()).orElse(null);
    }

    private List<NotificationFact> baseFacts(Assignment assignment) {
        return new ArrayList<>(List.of(
                new NotificationFact("Assignment", assignment.getTitle()),
                new NotificationFact("Group", assignment.getGroup().getName())));
    }

    private String preview(String body) {
        if (body == null || body.isBlank()) return "Open CodeHive to read the feedback.";
        String normalized = body.replaceAll("[\\p{Cntrl}&&[^\\t\\r\\n]]", "")
                .replaceAll("\\s+", " ").trim();
        if (normalized.length() <= MAX_FEEDBACK_PREVIEW) return normalized;
        return normalized.substring(0, MAX_FEEDBACK_PREVIEW).stripTrailing() + "…";
    }

    private String percentage(AssignmentGrade grade) {
        BigDecimal maximum = grade.getMaxPointsSnapshot();
        if (maximum == null || maximum.signum() == 0 || grade.getValue() == null) return null;
        return grade.getValue().multiply(BigDecimal.valueOf(100))
                .divide(maximum, 1, RoundingMode.HALF_UP)
                .stripTrailingZeros().toPlainString() + "%";
    }

    private String decimal(BigDecimal value) {
        return value == null ? "0" : value.stripTrailingZeros().toPlainString();
    }

    private void add(List<NotificationFact> facts, String label, String value) {
        if (value != null && !value.isBlank()) facts.add(new NotificationFact(label, value));
    }
}
