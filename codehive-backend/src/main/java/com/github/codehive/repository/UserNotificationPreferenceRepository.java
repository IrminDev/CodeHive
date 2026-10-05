package com.github.codehive.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.UserNotificationPreference;
import com.github.codehive.model.enums.NotificationType;

public interface UserNotificationPreferenceRepository extends JpaRepository<UserNotificationPreference, UUID> {
    List<UserNotificationPreference> findByUserId(UUID userId);
    Optional<UserNotificationPreference> findByUserIdAndType(UUID userId, NotificationType type);
    void deleteByUserId(UUID userId);
}
