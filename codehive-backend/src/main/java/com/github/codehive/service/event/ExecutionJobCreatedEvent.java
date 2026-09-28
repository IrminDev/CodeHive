package com.github.codehive.service.event;

import com.github.codehive.model.dto.queue.ExecutionJob;

public record ExecutionJobCreatedEvent(ExecutionJob job) {
}
