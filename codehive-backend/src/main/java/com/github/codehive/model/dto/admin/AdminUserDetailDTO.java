package com.github.codehive.model.dto.admin;

import java.time.Instant;

public record AdminUserDetailDTO(
        AdminUserSummaryDTO user,
        ResourceCounts resources,
        long lifetimeRateLimitViolations,
        Instant lastRateLimitViolationAt) {

    public record ResourceCounts(
            long ownedGroups,
            long activeOwnedGroups,
            long archivedOwnedGroups,
            long enrollments,
            long activeEnrollments,
            long authoredAssignments,
            long activeAuthoredAssignments,
            long participatedAssignments,
            long submissions,
            long executions) {
    }
}
