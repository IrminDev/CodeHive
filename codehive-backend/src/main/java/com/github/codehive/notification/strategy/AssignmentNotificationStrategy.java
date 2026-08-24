package com.github.codehive.notification.strategy;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.codehive.model.dto.queue.NotificationMessage;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentUpdate;
import com.github.codehive.model.entity.TestSuiteRevision;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.EnrollmentStatus;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.enums.SubmissionStatus;
import com.github.codehive.model.exception.EntityNotFoundException;
import com.github.codehive.notification.NotificationCallout;
import com.github.codehive.notification.NotificationEmailContent;
import com.github.codehive.notification.NotificationFact;
import com.github.codehive.notification.NotificationFormatService;
import com.github.codehive.notification.NotificationStrategy;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.AssignmentUpdateRepository;
import com.github.codehive.repository.GroupEnrollmentRepository;
import com.github.codehive.repository.SubmissionRepository;
import com.github.codehive.repository.TestCaseRepository;
import com.github.codehive.repository.TestSuiteRevisionRepository;

@Component
public class AssignmentNotificationStrategy implements NotificationStrategy {
    private static final int MAX_DIAGNOSTIC_CHARS = 2_000;
    private static final int MAX_DIAGNOSTIC_LINES = 20;
    private static final Set<NotificationType> TYPES = Set.of(
            NotificationType.ASSIGNMENT_READY,
            NotificationType.ASSIGNMENT_VALIDATION_FAILED,
            NotificationType.ASSIGNMENT_PUBLISHED,
            NotificationType.ASSIGNMENT_RESCHEDULED,
            NotificationType.ASSIGNMENT_UPDATED,
            NotificationType.ASSIGNMENT_TESTS_UPDATED,
            NotificationType.ASSIGNMENT_GRADES_CLEARED,
            NotificationType.ASSIGNMENT_DUE_SOON,
            NotificationType.ASSIGNMENT_CLOSE_SOON,
            NotificationType.ASSIGNMENT_DUE_SOON_NO_SUBMISSION,
            NotificationType.ASSIGNMENT_CLOSE_SOON_NO_SUBMISSION);

    private static final Map<String, String> CHANGE_LABELS = changeLabels();

    private final AssignmentRepository assignmentRepository;
    private final TestSuiteRevisionRepository testSuiteRevisionRepository;
    private final TestCaseRepository testCaseRepository;
    private final AssignmentUpdateRepository updateRepository;
    private final GroupEnrollmentRepository enrollmentRepository;
    private final SubmissionRepository submissionRepository;
    private final NotificationFormatService format;
    private final ObjectMapper objectMapper;

    public AssignmentNotificationStrategy(AssignmentRepository assignmentRepository,
                                          TestSuiteRevisionRepository testSuiteRevisionRepository,
                                          TestCaseRepository testCaseRepository,
                                          AssignmentUpdateRepository updateRepository,
                                          GroupEnrollmentRepository enrollmentRepository,
                                          SubmissionRepository submissionRepository,
                                          NotificationFormatService format,
                                          ObjectMapper objectMapper) {
        this.assignmentRepository = assignmentRepository;
        this.testSuiteRevisionRepository = testSuiteRevisionRepository;
        this.testCaseRepository = testCaseRepository;
        this.updateRepository = updateRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.submissionRepository = submissionRepository;
        this.format = format;
        this.objectMapper = objectMapper;
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
        AssignmentUpdate update = assignmentUpdate(message.resourceId());

        return switch (message.type()) {
            case ASSIGNMENT_READY -> assignmentReady(assignment, recipient);
            case ASSIGNMENT_VALIDATION_FAILED -> validationFailed(assignment, update, message, recipient);
            case ASSIGNMENT_PUBLISHED -> assignmentPublished(assignment, recipient);
            case ASSIGNMENT_RESCHEDULED -> assignmentRescheduled(assignment, update, recipient);
            case ASSIGNMENT_UPDATED -> assignmentUpdated(assignment, update);
            case ASSIGNMENT_TESTS_UPDATED -> testsUpdated(assignment, update);
            case ASSIGNMENT_GRADES_CLEARED -> gradesCleared(assignment, update);
            case ASSIGNMENT_DUE_SOON -> ownerReminder(assignment, message, recipient, true);
            case ASSIGNMENT_CLOSE_SOON -> ownerReminder(assignment, message, recipient, false);
            case ASSIGNMENT_DUE_SOON_NO_SUBMISSION -> studentReminder(
                    assignment, message, recipient, true);
            case ASSIGNMENT_CLOSE_SOON_NO_SUBMISSION -> studentReminder(
                    assignment, message, recipient, false);
            default -> throw new IllegalArgumentException(
                    "Unsupported assignment notification " + message.type());
        };
    }

    private NotificationEmailContent assignmentReady(Assignment assignment, User recipient) {
        List<NotificationFact> facts = baseFacts(assignment);
        add(facts, "Test cases", testCount(assignment));
        add(facts, "Languages", languages(assignment));
        add(facts, "Publishes", assignment.getLaunchDate() == null
                ? "Immediately" : format.format(assignment.getLaunchDate(), recipient));
        return content(NotificationType.ASSIGNMENT_READY,
                "Assignment ready: " + assignment.getTitle(),
                assignment.getTitle() + " passed validation and can be published.", facts, null,
                "Preview assignment", format.teacherAssignmentUrl(assignment.getId()));
    }

    private NotificationEmailContent validationFailed(Assignment assignment, AssignmentUpdate update,
                                                      NotificationMessage message, User recipient) {
        List<NotificationFact> facts = baseFacts(assignment);
        if (update != null) add(facts, "Update", updateKind(update));
        add(facts, "Failed", update != null
                ? format.format(update.getCompletedAt(), recipient)
                : format.format(message.occurredAt(), recipient));
        return content(NotificationType.ASSIGNMENT_VALIDATION_FAILED,
                "Assignment validation failed: " + assignment.getTitle(),
                "Validation failed. Current published version was not replaced.", facts,
                new NotificationCallout("Validation output", diagnostic(
                        assignment, update, message.resourceId(), message.schemaVersion())),
                "Review assignment", format.teacherAssignmentUrl(assignment.getId()));
    }

    private NotificationEmailContent assignmentPublished(Assignment assignment, User recipient) {
        List<NotificationFact> facts = groupFacts(assignment);
        add(facts, "Points", decimal(assignment.getMaxPoints()));
        add(facts, "Languages", languages(assignment));
        add(facts, "Due", format.format(assignment.getDueDate(), recipient));
        add(facts, "Closes", format.format(assignment.getCloseDate(), recipient));
        return content(NotificationType.ASSIGNMENT_PUBLISHED,
                "New assignment: " + assignment.getTitle(),
                assignment.getTitle() + " is now available in " + assignment.getGroup().getName() + ".",
                limit(facts), null, "Start assignment", format.assignmentUrl(assignment.getId()));
    }

    private NotificationEmailContent assignmentRescheduled(Assignment assignment, AssignmentUpdate update,
                                                            User recipient) {
        List<NotificationFact> facts = groupFacts(assignment);
        List<String> changed = changedFields(update, Set.of("launchDate", "dueDate", "closeDate",
                "clearLaunchDate", "clearDueDate", "clearCloseDate"));
        if (!changed.isEmpty()) add(facts, "Changed", String.join(", ", changed));
        add(facts, "Publishes", format.format(assignment.getLaunchDate(), recipient));
        add(facts, "Due", format.format(assignment.getDueDate(), recipient));
        add(facts, "Closes", format.format(assignment.getCloseDate(), recipient));
        return content(NotificationType.ASSIGNMENT_RESCHEDULED,
                "Schedule updated: " + assignment.getTitle(),
                "Review the new schedule before planning your next submission.", limit(facts),
                new NotificationCallout("Use the new dates",
                        "Late and close rules now follow this updated schedule."),
                "View assignment", format.assignmentUrl(assignment.getId()));
    }

    private NotificationEmailContent assignmentUpdated(Assignment assignment, AssignmentUpdate update) {
        List<NotificationFact> facts = groupFacts(assignment);
        List<String> changed = changedFields(update, null);
        add(facts, "Changed", changed.isEmpty() ? "Assignment information" : String.join(", ", changed));
        add(facts, "Time limit", assignment.getTimeLimitMs() == null
                ? null : assignment.getTimeLimitMs() + " ms");
        add(facts, "Memory limit", assignment.getMemoryLimitMb() == null
                ? null : assignment.getMemoryLimitMb() + " MB");
        return content(NotificationType.ASSIGNMENT_UPDATED,
                "Assignment updated: " + assignment.getTitle(),
                assignment.getTitle() + " has updated instructions or limits.", limit(facts), null,
                "Review changes", format.assignmentUrl(assignment.getId()));
    }

    private NotificationEmailContent testsUpdated(Assignment assignment, AssignmentUpdate update) {
        List<NotificationFact> facts = groupFacts(assignment);
        TestSuiteRevision suite = update != null && update.getTestSuiteRevision() != null
                ? update.getTestSuiteRevision() : assignment.getActiveTestSuiteRevision();
        if (suite != null) {
            add(facts, "Revision", suite.getRevisionNumber());
            add(facts, "Test cases", testCaseRepository
                    .findByTestSuiteRevisionIdOrderByOrderAsc(suite.getId()).size());
        }
        return content(NotificationType.ASSIGNMENT_TESTS_UPDATED,
                "Tests updated: " + assignment.getTitle(),
                "Updated tests are being applied to your current definitive submission.", facts,
                new NotificationCallout("Automatic reevaluation",
                        "CodeHive will send another email when your new result is ready."),
                "View assignment", format.assignmentUrl(assignment.getId()));
    }

    private NotificationEmailContent gradesCleared(Assignment assignment, AssignmentUpdate update) {
        List<NotificationFact> facts = baseFacts(assignment);
        add(facts, "Trigger", update == null ? "Evaluation criteria changed" : updateKind(update));
        add(facts, "Current maximum", decimal(assignment.getMaxPoints()));
        return content(NotificationType.ASSIGNMENT_GRADES_CLEARED,
                "Grades require review: " + assignment.getTitle(),
                "Returned and draft scores were cleared after grading criteria changed.", facts,
                new NotificationCallout("Action required",
                        "Review current work and assign grades again before returning them."),
                "Open gradebook", format.teacherGradesUrl(
                        assignment.getGroup().getId(), assignment.getId(), null));
    }

    private NotificationEmailContent ownerReminder(Assignment assignment, NotificationMessage message,
                                                   User recipient, boolean due) {
        java.time.Instant deadline = due ? assignment.getDueDate() : assignment.getCloseDate();
        int active = activeStudents(assignment);
        int submitted = submittedStudents(assignment);
        List<NotificationFact> facts = groupFacts(assignment);
        add(facts, due ? "Due" : "Closes", format.format(deadline, recipient));
        add(facts, "Time remaining", format.remaining(deadline, message.occurredAt()));
        add(facts, "Submitted", submitted + " of " + active);
        add(facts, "Missing", Math.max(0, active - submitted));
        NotificationType type = due ? NotificationType.ASSIGNMENT_DUE_SOON
                : NotificationType.ASSIGNMENT_CLOSE_SOON;
        String consequence = due
                ? "Later submissions will be marked late."
                : "Students cannot create definitive submissions after this time.";
        return content(type,
                (due ? "Due soon: " : "Closing soon: ") + assignment.getTitle(),
                assignment.getTitle() + (due ? " is approaching its due date." : " will stop accepting work soon."),
                limit(facts), new NotificationCallout(due ? "Late-submission rule" : "Hard close", consequence),
                "Open gradebook", format.teacherGradesUrl(
                        assignment.getGroup().getId(), assignment.getId(), null));
    }

    private NotificationEmailContent studentReminder(Assignment assignment, NotificationMessage message,
                                                     User recipient, boolean due) {
        java.time.Instant deadline = due ? assignment.getDueDate() : assignment.getCloseDate();
        List<NotificationFact> facts = groupFacts(assignment);
        add(facts, due ? "Due" : "Closes", format.format(deadline, recipient));
        add(facts, "Time remaining", format.remaining(deadline, message.occurredAt()));
        if (due) add(facts, "Late window ends", format.format(assignment.getCloseDate(), recipient));
        add(facts, "Submission", "No definitive submission");
        NotificationType type = due ? NotificationType.ASSIGNMENT_DUE_SOON_NO_SUBMISSION
                : NotificationType.ASSIGNMENT_CLOSE_SOON_NO_SUBMISSION;
        return content(type,
                (due ? "Due soon: " : "Closing soon: ") + assignment.getTitle(),
                "You have not submitted definitive work for " + assignment.getTitle() + ".",
                limit(facts), new NotificationCallout(due ? "Avoid a late flag" : "Submit before close",
                        due ? "Submit before the due date to stay on time."
                                : "Definitive submissions are blocked after the close time."),
                due ? "Continue assignment" : "Submit now", format.assignmentUrl(assignment.getId()));
    }

    private AssignmentUpdate assignmentUpdate(UUID resourceId) {
        return resourceId == null ? null : updateRepository.findById(resourceId).orElse(null);
    }

    private String diagnostic(Assignment assignment, AssignmentUpdate update, UUID resourceId,
                              int schemaVersion) {
        String diagnostic = update != null ? update.getFailureMessage() : null;
        if ((diagnostic == null || diagnostic.isBlank()) && update == null && resourceId != null) {
            diagnostic = testSuiteRevisionRepository.findById(resourceId)
                    .map(TestSuiteRevision::getFailureMessage).orElse(null);
        }
        if (diagnostic == null || diagnostic.isBlank()) {
            return schemaVersion == 1
                    ? "Open assignment for validation details from this legacy notification."
                    : "Worker did not provide diagnostic output. Open assignment for validation status.";
        }
        String cleaned = diagnostic.replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "")
                .replace("\r\n", "\n").trim();
        boolean truncated = cleaned.length() > MAX_DIAGNOSTIC_CHARS;
        if (truncated) cleaned = cleaned.substring(0, MAX_DIAGNOSTIC_CHARS);
        String[] lines = cleaned.split("\n", -1);
        int count = Math.min(lines.length, MAX_DIAGNOSTIC_LINES);
        String result = String.join("\n", java.util.Arrays.copyOf(lines, count));
        if (truncated || lines.length > count) {
            result += "\n… output truncated; open assignment for full failure details.";
        }
        return result;
    }

    private List<String> changedFields(AssignmentUpdate update, Set<String> allowed) {
        if (update == null || update.getProposedMetadataJson() == null) return List.of();
        try {
            JsonNode root = objectMapper.readTree(update.getProposedMetadataJson());
            List<String> changed = new ArrayList<>();
            root.properties().forEach(entry -> {
                if ((allowed == null || allowed.contains(entry.getKey()))
                        && !entry.getValue().isNull()
                        && (!entry.getValue().isBoolean() || entry.getValue().booleanValue())) {
                    String label = CHANGE_LABELS.get(entry.getKey());
                    if (label != null && !changed.contains(label)) changed.add(label);
                }
            });
            return changed.stream().limit(5).toList();
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private List<NotificationFact> baseFacts(Assignment assignment) {
        return new ArrayList<>(List.of(
                new NotificationFact("Assignment", assignment.getTitle()),
                new NotificationFact("Group", assignment.getGroup().getName())));
    }

    private List<NotificationFact> groupFacts(Assignment assignment) {
        return new ArrayList<>(List.of(
                new NotificationFact("Group", assignment.getGroup().getName())));
    }

    private int activeStudents(Assignment assignment) {
        return (int) enrollmentRepository.findByGroupIdAndStatusOrderByJoinedAtAsc(
                        assignment.getGroup().getId(), EnrollmentStatus.ACTIVE).stream()
                .filter(enrollment -> enrollment.getStudent().canParticipate())
                .count();
    }

    private int submittedStudents(Assignment assignment) {
        return (int) submissionRepository.findByAssignmentId(assignment.getId()).stream()
                .filter(submission -> submission.getStatus() == SubmissionStatus.SUBMITTED)
                .filter(submission -> submission.getStudent().canParticipate())
                .map(submission -> submission.getStudent().getId()).distinct().count();
    }

    private Integer testCount(Assignment assignment) {
        TestSuiteRevision suite = assignment.getActiveTestSuiteRevision();
        return suite == null ? null
                : testCaseRepository.findByTestSuiteRevisionIdOrderByOrderAsc(suite.getId()).size();
    }

    private String languages(Assignment assignment) {
        if (assignment.getAllowedLanguages() == null || assignment.getAllowedLanguages().isEmpty()) return null;
        return assignment.getAllowedLanguages().stream().map(Enum::name)
                .collect(java.util.stream.Collectors.joining(", "));
    }

    private String updateKind(AssignmentUpdate update) {
        return switch (update.getKind()) {
            case TEST_SUITE -> "Test suite changed";
            case REFERENCE_ONLY -> "Reference solution changed";
            case METADATA -> changedFields(update, null).contains("Maximum points")
                    ? "Maximum points changed" : "Assignment settings changed";
        };
    }

    private String decimal(BigDecimal value) {
        return value == null ? null : value.stripTrailingZeros().toPlainString();
    }

    private List<NotificationFact> limit(List<NotificationFact> facts) {
        return List.copyOf(facts.subList(0, Math.min(5, facts.size())));
    }

    private void add(List<NotificationFact> facts, String label, Object value) {
        if (value == null) return;
        String text = String.valueOf(value);
        if (!text.isBlank()) facts.add(new NotificationFact(label, text));
    }

    private NotificationEmailContent content(NotificationType type, String subject, String summary,
                                             List<NotificationFact> facts, NotificationCallout callout,
                                             String ctaLabel, String ctaUrl) {
        return new NotificationEmailContent(type, subject, summary, facts, callout, ctaLabel, ctaUrl);
    }

    private static Map<String, String> changeLabels() {
        Map<String, String> labels = new LinkedHashMap<>();
        labels.put("title", "Title");
        labels.put("description", "Description");
        labels.put("constraints", "Constraints");
        labels.put("hints", "Hints");
        labels.put("tags", "Tags");
        labels.put("allowedLanguages", "Languages");
        labels.put("timeLimitMs", "Time limit");
        labels.put("memoryLimitMb", "Memory limit");
        labels.put("comparatorType", "Comparator");
        labels.put("maxPoints", "Maximum points");
        labels.put("launchDate", "Publication date");
        labels.put("dueDate", "Due date");
        labels.put("closeDate", "Close date");
        labels.put("clearLaunchDate", "Publication date");
        labels.put("clearDueDate", "Due date");
        labels.put("clearCloseDate", "Close date");
        labels.put("examples", "Examples");
        return Map.copyOf(labels);
    }
}
