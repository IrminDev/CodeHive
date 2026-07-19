package com.github.codehive.model.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.github.codehive.model.enums.EnrollmentStatus;

public class EnrollmentDTO {
    private UUID id;
    private UUID groupId;
    private UserDTO student;
    private EnrollmentStatus status;
    private LocalDateTime joinedAt;
    private LocalDateTime endedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }
    public UserDTO getStudent() { return student; }
    public void setStudent(UserDTO student) { this.student = student; }
    public EnrollmentStatus getStatus() { return status; }
    public void setStatus(EnrollmentStatus status) { this.status = status; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }
}
