package com.github.codehive.notification.strategy;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.github.codehive.model.dto.queue.NotificationMessage;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.entity.Submission;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.notification.NotificationCallout;
import com.github.codehive.notification.NotificationEmailContent;
import com.github.codehive.notification.NotificationFact;
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
        return switch (message.type()) {
            case ASSIGNMENT_SUBMITTED -> submitted(message.type(), submission, recipient, false);
            case LATE_ASSIGNMENT_SUBMITTED -> submitted(message.type(), submission, recipient, true);
            case SUBMISSION_EVALUATED -> evaluated(message, submission, false);
            case SUBMISSION_REEVALUATED -> evaluated(message, submission, true);
            default -> throw new IllegalArgumentException(
                    "Unsupported submission notification " + message.type());
        };
    }

    private NotificationEmailContent submitted(NotificationType type, Submission submission,
                                               User recipient, boolean late) {
        List<NotificationFact> facts = late
                ? lateFacts(submission, recipient) : teacherFacts(submission, recipient);
        String student = format.fullName(submission.getStudent());
        String summary = student + (late ? " submitted after the due date." : " submitted definitive work.");
        NotificationCallout callout = late
                ? new NotificationCallout("Accepted as late",
                        "Submission remains available for evaluation and is permanently marked late.")
                : null;
        return new NotificationEmailContent(type,
                (late ? "Late submission: " : "New submission: ")
                        + submission.getAssignment().getTitle(),
                summary, limit(facts), callout, "Review submission",
                format.teacherGradesUrl(submission.getAssignment().getGroup().getId(),
                        submission.getAssignment().getId(), submission.getStudent().getId()));
    }

    private NotificationEmailContent evaluated(NotificationMessage message, Submission submission,
                                               boolean reevaluated) {
        Execution execution = message.resourceId() == null ? null
                : executionRepository.findById(message.resourceId()).orElse(null);
        List<NotificationFact> facts = evaluationFacts(submission);
        NotificationCallout callout = null;
        if (execution != null) {
            facts.add(0, new NotificationFact("Result", verdict(execution.getStatus())));
            add(facts, "Execution time", execution.getTimeMs() == null
                    ? null : execution.getTimeMs() + " ms");
            add(facts, "Peak memory", execution.getMemoryMb() == null
                    ? null : execution.getMemoryMb() + " MB");
            if (reevaluated) {
                Execution previous = executionRepository
                        .findTopBySubmissionIdAndCreatedAtBeforeOrderByCreatedAtDesc(
                                submission.getId(), execution.getCreatedAt()).orElse(null);
                if (previous != null) {
                    callout = new NotificationCallout("Result changed",
                            verdict(previous.getStatus()) + " → " + verdict(execution.getStatus()));
                }
            }
        }
        if (reevaluated && callout == null) {
            callout = new NotificationCallout("Updated tests",
                    "Your current submission was evaluated against the latest test suite.");
        }
        String ctaUrl = execution == null
                ? format.assignmentUrl(submission.getAssignment().getId())
                : format.submissionReportUrl(submission.getAssignment().getId(), execution.getId());
        return new NotificationEmailContent(
                reevaluated ? NotificationType.SUBMISSION_REEVALUATED
                        : NotificationType.SUBMISSION_EVALUATED,
                (reevaluated ? "Submission re-evaluated: " : "Submission evaluated: ")
                        + submission.getAssignment().getTitle(),
                reevaluated
                        ? "Your result was updated after assignment tests changed."
                        : "Your definitive submission has finished evaluation.",
                limit(facts), callout, execution == null ? "View assignment" : "View report", ctaUrl);
    }

    private List<NotificationFact> teacherFacts(Submission submission, User recipient) {
        List<NotificationFact> facts = new ArrayList<>();
        facts.add(new NotificationFact("Student", format.fullName(submission.getStudent())));
        if (submission.getStudent().getEnrollmentNumber() != null
                && !submission.getStudent().getEnrollmentNumber().isBlank()) {
            facts.add(new NotificationFact("Enrollment number",
                    submission.getStudent().getEnrollmentNumber()));
        }
        facts.add(new NotificationFact("Attempt", String.valueOf(attempt(submission))));
        facts.add(new NotificationFact("Language", submission.getLanguage().name()));
        add(facts, "Submitted", format.format(submission.getCreatedAt(), recipient));
        return facts;
    }

    private List<NotificationFact> lateFacts(Submission submission, User recipient) {
        List<NotificationFact> facts = new ArrayList<>();
        facts.add(new NotificationFact("Student", format.fullName(submission.getStudent())));
        if (submission.getStudent().getEnrollmentNumber() != null
                && !submission.getStudent().getEnrollmentNumber().isBlank()) {
            facts.add(new NotificationFact("Enrollment number",
                    submission.getStudent().getEnrollmentNumber()));
        }
        add(facts, "Submitted", format.format(submission.getCreatedAt(), recipient));
        add(facts, "Due", format.format(submission.getAssignment().getDueDate(), recipient));
        add(facts, "Late by", lateBy(submission));
        return facts;
    }

    private List<NotificationFact> evaluationFacts(Submission submission) {
        List<NotificationFact> facts = new ArrayList<>();
        facts.add(new NotificationFact("Attempt", String.valueOf(attempt(submission))));
        facts.add(new NotificationFact("Language", submission.getLanguage().name()));
        return facts;
    }

    private long attempt(Submission submission) {
        return submissionRepository.findByAssignmentAndStudentOrderByCreatedAtDesc(
                        submission.getAssignment(), submission.getStudent()).stream()
                .filter(item -> !item.getCreatedAt().isAfter(submission.getCreatedAt()))
                .count();
    }

    private String lateBy(Submission submission) {
        if (submission.getAssignment().getDueDate() == null) return null;
        java.time.Instant submittedAt = format.toInstant(submission.getCreatedAt());
        if (submittedAt == null || !submittedAt.isAfter(submission.getAssignment().getDueDate())) return null;
        long minutes = Duration.between(submission.getAssignment().getDueDate(), submittedAt).toMinutes();
        if (minutes >= 1440) {
            long days = minutes / 1440;
            return days + (days == 1 ? " day" : " days");
        }
        if (minutes >= 60) {
            long hours = minutes / 60;
            return hours + (hours == 1 ? " hour" : " hours");
        }
        return Math.max(1, minutes) + " minutes";
    }

    private String verdict(ExecutionStatus status) {
        if (status == null) return "Result unavailable";
        return switch (status) {
            case AC -> "Accepted (AC)";
            case WA -> "Wrong answer (WA)";
            case TLE -> "Time limit exceeded (TLE)";
            case MLE -> "Memory limit exceeded (MLE)";
            case OLE -> "Output limit exceeded (OLE)";
            case RTE -> "Runtime error (RTE)";
            case CE -> "Compilation error (CE)";
            case PENDING -> "Pending";
        };
    }

    private List<NotificationFact> limit(List<NotificationFact> facts) {
        return List.copyOf(facts.subList(0, Math.min(5, facts.size())));
    }

    private void add(List<NotificationFact> facts, String label, String value) {
        if (value != null && !value.isBlank()) facts.add(new NotificationFact(label, value));
    }
}
