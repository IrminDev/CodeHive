package com.github.codehive.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.UserNotificationSettings;

public interface UserNotificationSettingsRepository extends JpaRepository<UserNotificationSettings, UUID> {
    Optional<UserNotificationSettings> findByUserId(UUID userId);
    void deleteByUserId(UUID userId);
}
