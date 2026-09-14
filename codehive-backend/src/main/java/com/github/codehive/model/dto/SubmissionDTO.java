package com.github.codehive.model.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.SubmissionStatus;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubmissionDTO {
    private UUID id;
    private UUID assignmentId;
    private UUID studentId;
    private Language language;
    private LocalDateTime createdAt;
    private Boolean deliveredLate;
    private UUID studentWorkId;
    private SubmissionStatus status;
    private Instant withdrawnAt;

    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }
    public Boolean getDeliveredLate() { return deliveredLate; }
    public void setDeliveredLate(Boolean deliveredLate) { this.deliveredLate = deliveredLate; }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(UUID assignmentId) {
        this.assignmentId = assignmentId;
    }

    public Language getLanguage() {
        return language;
    }

    public void setLanguage(Language language) {
        this.language = language;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public UUID getStudentWorkId() { return studentWorkId; }
    public void setStudentWorkId(UUID studentWorkId) { this.studentWorkId = studentWorkId; }
    public SubmissionStatus getStatus() { return status; }
    public void setStatus(SubmissionStatus status) { this.status = status; }
    public Instant getWithdrawnAt() { return withdrawnAt; }
    public void setWithdrawnAt(Instant withdrawnAt) { this.withdrawnAt = withdrawnAt; }
}
