package com.github.codehive.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.repository.query.Param;

import com.github.codehive.model.entity.User;
import com.github.codehive.model.enums.Role;

public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
    @EntityGraph(attributePaths = "scopes")
    Optional<User> findByEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = "scopes")
    @Query("select user from User user where user.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = "scopes")
    @Query("select user from User user where user.email = :email")
    Optional<User> findByEmailForUpdate(@Param("email") String email);
    
    Optional<User> findByEnrollmentNumber(String enrollmentNumber);
    
    List<User> findAllByIsActive(Boolean isActive);
    List<User> findAllByRole(Role role);
    long countByRoleAndIsActiveTrueAndScopesContaining(Role role, com.github.codehive.model.enums.Scope scope);
    long countByRoleAndIsActiveTrueAndBlockedFalseAndScopesContaining(
            Role role, com.github.codehive.model.enums.Scope scope);
    long countByIsActiveTrue();
    long countByIsActiveTrueAndBlockedTrue();
    long countByIsActiveTrueAndBlockedFalse();
    long countByRoleAndIsActiveTrue(Role role);
    long countByRoleAndIsActiveTrueAndBlockedFalse(Role role);
    long countByCreatedAtBetweenAndIsActiveTrue(java.time.LocalDateTime from, java.time.LocalDateTime to);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update User user
            set user.rateLimitViolationCount = coalesce(user.rateLimitViolationCount, 0) + 1,
                user.lastRateLimitViolationAt = :occurredAt
            where user.id = :userId and user.isActive = true
            """)
    int incrementRateLimitViolation(@Param("userId") UUID userId,
                                    @Param("occurredAt") java.time.Instant occurredAt);
}
