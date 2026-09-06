package com.github.codehive.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.github.codehive.model.entity.ClassGroup;

public interface ClassGroupRepository extends JpaRepository<ClassGroup, UUID> {
    Optional<ClassGroup> findByJoinCodeIgnoreCase(String joinCode);
    boolean existsByJoinCodeIgnoreCase(String joinCode);
    List<ClassGroup> findByOwnerIdAndIsActiveTrueOrderByCreatedAtDesc(UUID ownerId);
    List<ClassGroup> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<ClassGroup> findByIsActiveFalseAndDeletedAtIsNull();
    Page<ClassGroup> findByOwnerId(UUID ownerId, Pageable pageable);
    long countByOwnerId(UUID ownerId);
    long countByOwnerIdAndIsActiveTrue(UUID ownerId);
    long countByOwnerIdAndIsActiveTrueAndArchivedTrue(UUID ownerId);
    long countByOwnerIdAndArchivedTrue(UUID ownerId);
    long countByIsActiveTrueAndArchivedFalse();
    long countByIsActiveTrueAndArchivedTrue();
    long countByCreatedAtBetweenAndOwnerIsActiveTrue(
            java.time.LocalDateTime from, java.time.LocalDateTime to);
}
