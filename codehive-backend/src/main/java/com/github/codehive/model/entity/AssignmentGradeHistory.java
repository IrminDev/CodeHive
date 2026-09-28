package com.github.codehive.model.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.github.codehive.model.enums.GradeChangeReason;
import com.github.codehive.model.enums.GradeStatus;

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

@Entity
@Table(name = "assignment_grade_history")
public class AssignmentGradeHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_work_id", nullable = false)
    private StudentAssignmentWork studentWork;

    @Column(name = "grade_value", precision = 12, scale = 2)
    private BigDecimal value;

    @Column(precision = 12, scale = 2)
    private BigDecimal maxPoints;

    @Enumerated(EnumType.STRING)
    @Column(length = 15)
    private GradeStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private GradeChangeReason reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public StudentAssignmentWork getStudentWork() { return studentWork; }
    public void setStudentWork(StudentAssignmentWork studentWork) { this.studentWork = studentWork; }
    public BigDecimal getValue() { return value; }
    public void setValue(BigDecimal value) { this.value = value; }
    public BigDecimal getMaxPoints() { return maxPoints; }
    public void setMaxPoints(BigDecimal maxPoints) { this.maxPoints = maxPoints; }
    public GradeStatus getStatus() { return status; }
    public void setStatus(GradeStatus status) { this.status = status; }
    public GradeChangeReason getReason() { return reason; }
    public void setReason(GradeChangeReason reason) { this.reason = reason; }
    public User getActor() { return actor; }
    public void setActor(User actor) { this.actor = actor; }
    public Instant getCreatedAt() { return createdAt; }
}
