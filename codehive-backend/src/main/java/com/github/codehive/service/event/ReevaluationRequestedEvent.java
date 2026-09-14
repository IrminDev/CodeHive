package com.github.codehive.service.event;

import java.util.UUID;

public record ReevaluationRequestedEvent(
        UUID assignmentId,
        UUID testSuiteRevisionId
) {
}
