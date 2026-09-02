package com.github.codehive.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.github.codehive.model.entity.ClassGroup;

public interface ClassGroupRepository extends JpaRepository<ClassGroup, UUID> {
    Optional<ClassGroup> findByJoinCodeIgnoreCase(String joinCode);
    boolean existsByJoinCodeIgnoreCase(String joinCode);
    List<ClassGroup> findByOwnerIdAndIsActiveTrueOrderByCreatedAtDesc(UUID ownerId);
    List<ClassGroup> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<ClassGroup> findByIsActiveFalseAndDeletedAtIsNull();
}
