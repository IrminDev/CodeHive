package com.github.codehive.model.dto;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.github.codehive.model.enums.AssignmentValidationStatus;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.Language;

public record TeacherDashboardDTO(
        Summary summary,
        List<ValidationItem> validationItems,
        List<GradingItem> gradingItems,
        List<DeadlineItem> upcomingDeadlines,
        List<RecentSubmission> recentSubmissions) {

    public record Summary(long activeGroups, long activeStudents, long activeAssignments,
                          long needsGrading, long validationIssues) {
    }

    public record ValidationItem(UUID assignmentId, UUID groupId, String groupName,
                                 String title, AssignmentValidationStatus status) {
    }

    public record GradingItem(UUID assignmentId, UUID groupId, String groupName,
                              String title, long submitted, long needsGrading) {
    }

    public record DeadlineItem(UUID assignmentId, UUID groupId, String title,
                               Instant launchDate, Instant dueDate, Instant closeDate) {
    }

    public record RecentSubmission(UUID submissionId, UUID assignmentId, UUID groupId,
                                   String assignmentTitle, UUID studentId, String studentName,
                                   Language language, LocalDateTime submittedAt,
                                   ExecutionStatus verdict) {
    }
}
