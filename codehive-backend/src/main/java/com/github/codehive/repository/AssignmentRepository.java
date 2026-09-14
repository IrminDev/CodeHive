package com.github.codehive.repository;

import java.time.Instant;
import java.util.List;
import java.util.Collection;
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

    @Query("""
            select a from Assignment a
            where a.group.id = :groupId
              and (:deletedOnly = false or a.isActive = false)
              and (:includeDeleted = true or a.isActive = true)
              and lower(a.title) like lower(concat('%', :query, '%'))
              and (:validationStatus is null or a.validationStatus = :validationStatus)
            order by a.createdAt desc
            """)
    Page<Assignment> findTeacherManaged(
            @Param("groupId") UUID groupId,
            @Param("includeDeleted") boolean includeDeleted,
            @Param("deletedOnly") boolean deletedOnly,
            @Param("query") String query,
            @Param("validationStatus") AssignmentValidationStatus validationStatus,
            Pageable pageable);

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

    @Query("""
            select a from Assignment a
            where a.group.id in :groupIds
              and a.group.isActive = true
              and a.isActive = true
              and a.validationStatus = :status
              and (a.launchDate is null or a.launchDate <= :now)
            order by a.createdAt desc
            """)
    List<Assignment> findStudentVisibleForGroups(
            @Param("groupIds") Collection<UUID> groupIds,
            @Param("status") AssignmentValidationStatus status,
            @Param("now") Instant now);

    @Query("""
            select a from Assignment a
            where a.isActive = true and a.validationStatus = :status
              and a.group.isActive = true and a.group.archived = false
            """)
    List<Assignment> findReadyActiveForNotifications(@Param("status") AssignmentValidationStatus status);

    @Query("""
            select a from Assignment a
            where a.isActive = true and a.validationStatus = :status
              and a.group.isActive = true and a.group.archived = false
              and ((a.dueDate is not null and a.dueDate > :now and a.dueDate <= :maximum)
                or (a.closeDate is not null and a.closeDate > :now and a.closeDate <= :maximum))
            """)
    List<Assignment> findReminderCandidates(@Param("status") AssignmentValidationStatus status,
                                            @Param("now") Instant now,
                                            @Param("maximum") Instant maximum);

    List<Assignment> findByGroupIdAndIsActiveTrueOrderByCreatedAtDesc(UUID groupId);

    List<Assignment> findByIsActiveFalseAndDeletedAtIsNull();
    Page<Assignment> findByAuthorId(UUID authorId, Pageable pageable);
    long countByAuthorId(UUID authorId);
    long countByAuthorIdAndIsActiveTrue(UUID authorId);
    long countByAuthorIdAndValidationStatus(UUID authorId, AssignmentValidationStatus status);
    long countByIsActiveTrueAndAuthorIsActiveTrue();
    long countByIsActiveTrueAndValidationStatusAndAuthorIsActiveTrue(AssignmentValidationStatus status);
    long countByCreatedAtBetweenAndAuthorIsActiveTrue(
            java.time.LocalDateTime from, java.time.LocalDateTime to);

    @Query("""
            select count(a) from Assignment a
            where a.isActive = true and a.author.isActive = true and a.author.blocked = false
              and a.group.isActive = true and a.group.archived = false
            """)
    long countOperationallyActive();

    @Query("""
            select count(a) from Assignment a
            where a.isActive = true and a.validationStatus = :status
              and a.author.isActive = true and a.author.blocked = false
            """)
    long countVisibleByValidationStatus(@Param("status") AssignmentValidationStatus status);
}
