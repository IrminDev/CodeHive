package com.github.codehive.model.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "notification_dispatch_log")
public class NotificationDispatchLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 255)
    private String deduplicationKey;

    @Column(nullable = false, updatable = false)
    private Instant dispatchedAt;

    public NotificationDispatchLog() {
        this.dispatchedAt = Instant.now();
    }

    public NotificationDispatchLog(String deduplicationKey) {
        this();
        this.deduplicationKey = deduplicationKey;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getDeduplicationKey() { return deduplicationKey; }
    public void setDeduplicationKey(String deduplicationKey) { this.deduplicationKey = deduplicationKey; }
    public Instant getDispatchedAt() { return dispatchedAt; }
    public void setDispatchedAt(Instant dispatchedAt) { this.dispatchedAt = dispatchedAt; }
}
