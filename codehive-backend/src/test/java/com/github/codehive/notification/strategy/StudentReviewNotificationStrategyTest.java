package com.github.codehive.notification.strategy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.github.codehive.model.dto.queue.NotificationMessage;
import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.entity.AssignmentFeedback;
import com.github.codehive.model.entity.AssignmentGrade;
import com.github.codehive.model.entity.ClassGroup;
import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.FeedbackStatus;
import com.github.codehive.model.enums.GradeStatus;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.model.enums.Role;
import com.github.codehive.notification.NotificationFormatService;
import com.github.codehive.repository.AssignmentFeedbackRepository;
import com.github.codehive.repository.AssignmentGradeRepository;
import com.github.codehive.repository.AssignmentRepository;
import com.github.codehive.repository.UserRepository;

class StudentReviewNotificationStrategyTest {
    private static final UUID ASSIGNMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID RECIPIENT_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID RESOURCE_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");

    private final AssignmentRepository assignmentRepository = mock(AssignmentRepository.class);
    private final AssignmentFeedbackRepository feedbackRepository = mock(AssignmentFeedbackRepository.class);
    private final AssignmentGradeRepository gradeRepository = mock(AssignmentGradeRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final NotificationFormatService format = mock(NotificationFormatService.class);
    private final StudentReviewNotificationStrategy strategy = new StudentReviewNotificationStrategy(
            assignmentRepository, feedbackRepository, gradeRepository, userRepository, format);

    private final User teacher = new User(
            "Grace", "Hopper", "T-1", "grace@example.com", "encoded", Role.TEACHER);
    private final User student = new User(
            "Ada", "Lovelace", "S-1", "ada@example.com", "encoded", Role.STUDENT);
    private Assignment assignment;

    @BeforeEach
    void setUp() {
        assignment = new Assignment();
        assignment.setId(ASSIGNMENT_ID);
        assignment.setTitle("Graph paths");
        assignment.setGroup(new ClassGroup("Algorithms", null, teacher, "CODE1234"));
        when(assignmentRepository.findById(ASSIGNMENT_ID)).thenReturn(Optional.of(assignment));
        when(format.studentGradesUrl(ASSIGNMENT_ID)).thenReturn(
                "https://codehive.example/grades?assignmentId=" + ASSIGNMENT_ID);
        when(format.fullName(teacher)).thenReturn("Grace Hopper");
        when(format.format(any(Instant.class), eq(student))).thenReturn("August 22, 2026 at 5:00 PM");
    }

    @Test
    void includesBoundedWhitespaceNormalizedFeedbackPreview() {
        AssignmentFeedback feedback = new AssignmentFeedback();
        feedback.setAuthor(teacher);
        feedback.setStatus(FeedbackStatus.PUBLISHED);
        feedback.setBody("First line\n\n" + "x".repeat(300));
        when(feedbackRepository.findById(RESOURCE_ID)).thenReturn(Optional.of(feedback));

        var content = strategy.build(message(NotificationType.FEEDBACK_RECEIVED), student);

        assertThat(content.callout().title()).isEqualTo("Feedback preview");
        assertThat(content.callout().body())
                .startsWith("First line x")
                .endsWith("…")
                .hasSize(241)
                .doesNotContain("\n");
    }

    @Test
    void includesReturnedScoreAndPercentageFromExactGrade() {
        AssignmentGrade grade = new AssignmentGrade();
        grade.setValue(new BigDecimal("8.50"));
        grade.setMaxPointsSnapshot(new BigDecimal("10.00"));
        grade.setStatus(GradeStatus.RETURNED);
        grade.setGradedBy(teacher);
        grade.setReturnedAt(Instant.parse("2026-08-22T23:00:00Z"));
        when(gradeRepository.findById(RESOURCE_ID)).thenReturn(Optional.of(grade));

        var content = strategy.build(message(NotificationType.GRADE_RETURNED), student);

        assertThat(content.facts())
                .anySatisfy(fact -> assertThat(fact).extracting("label", "value")
                        .containsExactly("Score", "8.5 / 10"))
                .anySatisfy(fact -> assertThat(fact).extracting("label", "value")
                        .containsExactly("Percentage", "85%"));
    }

    private NotificationMessage message(NotificationType type) {
        return new NotificationMessage(
                UUID.fromString("00000000-0000-0000-0000-000000000004"),
                type, RECIPIENT_ID, null, null, ASSIGNMENT_ID, null, RESOURCE_ID,
                Instant.parse("2026-08-22T23:00:00Z"), 0, 2);
    }
}
