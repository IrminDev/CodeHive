package com.github.codehive.model.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import com.github.codehive.model.enums.Language;

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
@Table(name = "submissions")
public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;
    
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private Language language;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private Boolean deliveredLate;

    public Submission() {
        this.createdAt = LocalDateTime.now();
        this.deliveredLate = false;
    }

    public Submission(Assignment assignment, Language language) {
        this();
        this.assignment = assignment;
        this.language = language;
    }

    public Submission(Assignment assignment, User student, Language language, Boolean deliveredLate) {
        this(assignment, language);
        this.student = student;
        this.deliveredLate = deliveredLate;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Assignment getAssignment() {
        return assignment;
    }

    public void setAssignment(Assignment assignment) {
        this.assignment = assignment;
    }

    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public Boolean getDeliveredLate() { return deliveredLate; }
    public void setDeliveredLate(Boolean deliveredLate) { this.deliveredLate = deliveredLate; }

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
}
