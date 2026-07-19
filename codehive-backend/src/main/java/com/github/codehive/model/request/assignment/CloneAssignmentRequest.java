package com.github.codehive.model.request.assignment;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public class CloneAssignmentRequest {
    @NotNull(message = "Target group ID is required")
    private UUID targetGroupId;
    private Instant launchDate;
    private Instant dueDate;
    private Instant closeDate;

    public UUID getTargetGroupId() { return targetGroupId; }
    public void setTargetGroupId(UUID targetGroupId) { this.targetGroupId = targetGroupId; }
    public Instant getLaunchDate() { return launchDate; }
    public void setLaunchDate(Instant launchDate) { this.launchDate = launchDate; }
    public Instant getDueDate() { return dueDate; }
    public void setDueDate(Instant dueDate) { this.dueDate = dueDate; }
    public Instant getCloseDate() { return closeDate; }
    public void setCloseDate(Instant closeDate) { this.closeDate = closeDate; }
}
