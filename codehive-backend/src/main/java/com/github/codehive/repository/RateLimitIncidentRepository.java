package com.github.codehive.repository;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.github.codehive.model.entity.RateLimitIncident;

public interface RateLimitIncidentRepository extends JpaRepository<RateLimitIncident, UUID>,
        JpaSpecificationExecutor<RateLimitIncident> {
    long deleteByOccurredAtBefore(Instant cutoff);
    long countByOccurredAtBetweenAndUserIsActiveTrue(Instant from, Instant to);
    Page<RateLimitIncident> findByUserIdAndUserIsActiveTrue(UUID userId, Pageable pageable);
}
