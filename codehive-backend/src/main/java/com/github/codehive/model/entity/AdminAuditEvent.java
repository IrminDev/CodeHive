package com.github.codehive.model.entity;

import java.time.Instant;
import java.util.UUID;

import com.github.codehive.model.enums.AdminAuditAction;
import com.github.codehive.model.enums.AdminAuditOutcome;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "admin_audit_events", indexes = {
        @Index(name = "idx_admin_audit_time", columnList = "occurred_at"),
        @Index(name = "idx_admin_audit_actor", columnList = "actor_id,occurred_at"),
        @Index(name = "idx_admin_audit_target", columnList = "target_id,occurred_at")
})
public class AdminAuditEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_id")
    private User target;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private AdminAuditAction action;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AdminAuditOutcome outcome;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(length = 1000)
    private String details;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(name = "correlation_id", length = 100)
    private String correlationId;

    public AdminAuditEvent() {}

    public AdminAuditEvent(User actor, User target, AdminAuditAction action,
                           AdminAuditOutcome outcome, String reason, String details,
                           String correlationId) {
        this.actor = actor;
        this.target = target;
        this.action = action;
        this.outcome = outcome;
        this.reason = reason;
        this.details = details;
        this.correlationId = correlationId;
        this.occurredAt = Instant.now();
    }

    public UUID getId() { return id; }
    public User getActor() { return actor; }
    public User getTarget() { return target; }
    public AdminAuditAction getAction() { return action; }
    public AdminAuditOutcome getOutcome() { return outcome; }
    public String getReason() { return reason; }
    public String getDetails() { return details; }
    public Instant getOccurredAt() { return occurredAt; }
    public String getCorrelationId() { return correlationId; }
}
