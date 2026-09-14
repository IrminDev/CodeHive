package com.github.codehive.model.dto.admin;

import java.time.Instant;
import java.util.Map;

public record AdminStatisticsDTO(
        Instant generatedAt,
        Instant from,
        Instant to,
        UserStatistics users,
        ResourceStatistics resources,
        Map<String, Long> assignmentValidation,
        Map<String, Long> executionVerdicts,
        long incidents) {

    public record UserStatistics(long total, long active, long blocked,
                                 long students, long teachers, long admins, long registeredInPeriod) {}

    public record ResourceStatistics(long activeGroups, long archivedGroups,
                                     long activeAssignments, long submissionsInPeriod,
                                     long executionsInPeriod) {}
}
