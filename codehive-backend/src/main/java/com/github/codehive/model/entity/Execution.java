package com.github.codehive.model.entity;

import java.time.LocalDateTime;

import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.ExecutionType;

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
@Table(name = "executions")
public class Execution {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = true)
    private Submission submission; // NULLABLE for PRACTICE executions
    
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ExecutionType executionType;
    
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ExecutionStatus status;
    
    @Column(nullable = true)
    private Long timeMs;
    
    @Column(nullable = true)
    private Long memoryMb;
    
    @Column(nullable = false)
    private Boolean isOutdated;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Execution() {
        this.createdAt = LocalDateTime.now();
        this.isOutdated = false;
        this.status = ExecutionStatus.PENDING;
    }

    public Execution(Submission submission, ExecutionType executionType) {
        this();
        this.submission = submission;
        this.executionType = executionType;
    }

    public Execution(ExecutionType executionType) {
        this();
        this.executionType = executionType;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Submission getSubmission() {
        return submission;
    }

    public void setSubmission(Submission submission) {
        this.submission = submission;
    }

    public ExecutionType getExecutionType() {
        return executionType;
    }

    public void setExecutionType(ExecutionType executionType) {
        this.executionType = executionType;
    }

    public ExecutionStatus getStatus() {
        return status;
    }

    public void setStatus(ExecutionStatus status) {
        this.status = status;
    }

    public Long getTimeMs() {
        return timeMs;
    }

    public void setTimeMs(Long timeMs) {
        this.timeMs = timeMs;
    }

    public Long getMemoryMb() {
        return memoryMb;
    }

    public void setMemoryMb(Long memoryMb) {
        this.memoryMb = memoryMb;
    }

    public Boolean getIsOutdated() {
        return isOutdated;
    }

    public void setIsOutdated(Boolean isOutdated) {
        this.isOutdated = isOutdated;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
