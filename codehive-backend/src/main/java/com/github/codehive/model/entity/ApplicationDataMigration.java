package com.github.codehive.model.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "application_data_migrations")
public class ApplicationDataMigration {
    @Id
    @Column(length = 100)
    private String id;

    @Column(nullable = false, updatable = false)
    private LocalDateTime appliedAt;

    protected ApplicationDataMigration() {}

    public ApplicationDataMigration(String id) {
        this.id = id;
        this.appliedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public LocalDateTime getAppliedAt() { return appliedAt; }
}
