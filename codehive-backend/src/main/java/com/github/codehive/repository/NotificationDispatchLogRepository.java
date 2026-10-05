package com.github.codehive.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.NotificationDispatchLog;

public interface NotificationDispatchLogRepository extends JpaRepository<NotificationDispatchLog, UUID> {
    boolean existsByDeduplicationKey(String deduplicationKey);
}
