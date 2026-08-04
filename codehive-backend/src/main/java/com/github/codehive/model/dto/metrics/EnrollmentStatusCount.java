package com.github.codehive.model.dto.metrics;

import com.github.codehive.model.enums.EnrollmentStatus;

/** Aggregated enrollment count for one status of a group (metric M12). */
public record EnrollmentStatusCount(EnrollmentStatus status, Long total) {
}
