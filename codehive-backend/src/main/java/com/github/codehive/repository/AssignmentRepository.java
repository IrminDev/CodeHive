package com.github.codehive.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.github.codehive.model.entity.Assignment;
import com.github.codehive.model.enums.AssignmentValidationStatus;

public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {
    List<Assignment> findAllByOrderByCreatedAtDesc();

    Page<Assignment> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    List<Assignment> findByTitleContainingIgnoreCase(String title);
    
    List<Assignment> findByDueDateBefore(Instant date);
    
    List<Assignment> findByDueDateAfter(Instant date);
    
    Optional<Assignment> findByIdAndDueDateAfter(UUID id, Instant date);

    Page<Assignment> findByGroupIdAndIsActiveTrueOrderByCreatedAtDesc(UUID groupId, Pageable pageable);

    List<Assignment> findByGroupIdOrderByCreatedAtDesc(UUID groupId);

    @Query("""
            select a from Assignment a
            where a.group.id = :groupId and a.isActive = true and a.validationStatus = :status
              and (a.launchDate is null or a.launchDate <= :now)
            order by a.createdAt desc
            """)
    Page<Assignment> findStudentVisible(@Param("groupId") UUID groupId,
                                        @Param("status") AssignmentValidationStatus status,
                                        @Param("now") Instant now, Pageable pageable);
}
