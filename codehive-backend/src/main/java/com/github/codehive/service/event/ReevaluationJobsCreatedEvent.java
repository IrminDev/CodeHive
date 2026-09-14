package com.github.codehive.service.event;

import java.util.List;
import java.util.UUID;

public record ReevaluationJobsCreatedEvent(
        UUID batchId,
        List<UUID> executionIds
) {
}
