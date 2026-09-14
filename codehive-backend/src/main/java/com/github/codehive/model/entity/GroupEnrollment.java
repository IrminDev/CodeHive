package com.github.codehive.model.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import com.github.codehive.model.enums.EnrollmentStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "group_enrollments", uniqueConstraints = @UniqueConstraint(
        name = "uk_group_enrollment_group_student", columnNames = {"group_id", "student_id"}))
public class GroupEnrollment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private ClassGroup group;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private EnrollmentStatus status;

    @Column(nullable = false)
    private LocalDateTime joinedAt;

    private LocalDateTime endedAt;

    public GroupEnrollment() {
        joinedAt = LocalDateTime.now();
        status = EnrollmentStatus.ACTIVE;
    }

    public GroupEnrollment(ClassGroup group, User student) {
        this();
        this.group = group;
        this.student = student;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public ClassGroup getGroup() { return group; }
    public void setGroup(ClassGroup group) { this.group = group; }
    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public EnrollmentStatus getStatus() { return status; }
    public void setStatus(EnrollmentStatus status) { this.status = status; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }
}
