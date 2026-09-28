package com.github.codehive.model.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "assignment_grades")
public class AssignmentGrade {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_work_id", nullable = false, unique = true)
    private StudentAssignmentWork studentWork;

    @Column(name = "grade_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal value;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal maxPointsSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private GradeStatus status = GradeStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "graded_by_id", nullable = false)
    private User gradedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "graded_submission_id")
    private Submission gradedSubmission;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    private Instant returnedAt;

    public UUID getId() { return id; }
    public StudentAssignmentWork getStudentWork() { return studentWork; }
    public void setStudentWork(StudentAssignmentWork studentWork) { this.studentWork = studentWork; }
    public BigDecimal getValue() { return value; }
    public void setValue(BigDecimal value) { this.value = value; }
    public BigDecimal getMaxPointsSnapshot() { return maxPointsSnapshot; }
    public void setMaxPointsSnapshot(BigDecimal maxPointsSnapshot) { this.maxPointsSnapshot = maxPointsSnapshot; }
    public GradeStatus getStatus() { return status; }
    public void setStatus(GradeStatus status) { this.status = status; }
    public User getGradedBy() { return gradedBy; }
    public void setGradedBy(User gradedBy) { this.gradedBy = gradedBy; }
    public Submission getGradedSubmission() { return gradedSubmission; }
    public void setGradedSubmission(Submission gradedSubmission) { this.gradedSubmission = gradedSubmission; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public Instant getReturnedAt() { return returnedAt; }
    public void setReturnedAt(Instant returnedAt) { this.returnedAt = returnedAt; }
}
