package com.github.codehive.model.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "rate_limit_incidents", indexes = {
        @Index(name = "idx_rate_incident_user_time", columnList = "user_id,occurred_at"),
        @Index(name = "idx_rate_incident_policy_time", columnList = "policy_key,occurred_at")
})
public class RateLimitIncident {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "policy_key", nullable = false, length = 100)
    private String policyKey;

    @Column(name = "http_method", nullable = false, length = 10)
    private String httpMethod;

    @Column(name = "route_template", nullable = false, length = 250)
    private String routeTemplate;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Column(name = "correlation_id", length = 100)
    private String correlationId;

    public RateLimitIncident() {}

    public RateLimitIncident(User user, String policyKey, String httpMethod,
                             String routeTemplate, String correlationId) {
        this.user = user;
        this.policyKey = policyKey;
        this.httpMethod = httpMethod;
        this.routeTemplate = routeTemplate;
        this.correlationId = correlationId;
        this.occurredAt = Instant.now();
    }

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public String getPolicyKey() { return policyKey; }
    public String getHttpMethod() { return httpMethod; }
    public String getRouteTemplate() { return routeTemplate; }
    public Instant getOccurredAt() { return occurredAt; }
    public String getCorrelationId() { return correlationId; }
}
