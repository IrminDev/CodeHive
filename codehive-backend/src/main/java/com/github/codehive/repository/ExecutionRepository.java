package com.github.codehive.repository;

import java.time.LocalDateTime;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.github.codehive.model.dto.metrics.SubmissionResultRow;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.ExecutionType;

public interface ExecutionRepository extends JpaRepository<Execution, UUID> {
    List<Execution> findByExecutionType(ExecutionType executionType);
    
    List<Execution> findByStatus(ExecutionStatus status);
    
    List<Execution> findByExecutionTypeAndStatus(ExecutionType executionType, ExecutionStatus status);
    
    List<Execution> findByIsOutdated(Boolean isOutdated);
    
    List<Execution> findByCreatedAtBefore(LocalDateTime date);
    
    List<Execution> findByCreatedAtAfter(LocalDateTime date);

    List<Execution> findByArtifactsExpireAtLessThanEqualAndArtifactsPurgedAtIsNull(Instant date);

    List<Execution> findByStatusAndCreatedAtBefore(ExecutionStatus status, LocalDateTime date);

    @Query("""
            select execution from Execution execution
            where execution.artifactsPurgedAt is null
              and execution.assignment is not null
              and execution.status <> com.github.codehive.model.enums.ExecutionStatus.PENDING
              and ((execution.assignment.isActive = false
                    and execution.assignment.deletedAt is not null
                    and execution.assignment.deletedAt <= :cutoff)
                or (execution.assignment.group.isActive = false
                    and execution.assignment.group.deletedAt is not null
                    and execution.assignment.group.deletedAt <= :cutoff))
            """)
    List<Execution> findSoftDeletedArtifactCleanupCandidates(@Param("cutoff") Instant cutoff);
    
    List<Execution> findBySubmissionIsNull();
    
    long countByStatus(ExecutionStatus status);
    Page<Execution> findByUserId(UUID userId, Pageable pageable);
    long countByUserId(UUID userId);
    long countByUserIdAndExecutionType(UUID userId, ExecutionType executionType);
    long countByUserIdAndStatus(UUID userId, ExecutionStatus status);
    long countByCreatedAtBetweenAndUserIsActiveTrue(LocalDateTime from, LocalDateTime to);

    @Query("""
            select count(e) from Execution e
            where e.createdAt >= :from and e.createdAt < :to
              and e.user.isActive = true and e.user.blocked = false
            """)
    long countVisibleInPeriod(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
            select count(e) from Execution e
            where e.status = :status and e.user.isActive = true
            """)
    long countVisibleByStatus(@Param("status") ExecutionStatus status);

    Optional<Execution> findTopBySubmissionIdOrderByCreatedAtDesc(UUID submissionId);

    Optional<Execution> findTopBySubmissionIdAndCreatedAtBeforeOrderByCreatedAtDesc(
            UUID submissionId, LocalDateTime createdAt);

    @Query("""
            select execution from Execution execution
            where execution.submission.id in :submissionIds and execution.isOutdated = false
            order by execution.createdAt desc
            """)
    List<Execution> findLatestCandidatesBySubmissionIds(
            @Param("submissionIds") Collection<UUID> submissionIds);

    boolean existsBySubmissionIdAndTestSuiteRevisionId(UUID submissionId, UUID testSuiteRevisionId);

    boolean existsByTestSuiteRevisionIdAndStatus(UUID testSuiteRevisionId, ExecutionStatus status);

    boolean existsByTestSuiteRevisionReferenceSolutionRevisionIdAndStatus(
            UUID referenceSolutionRevisionId, ExecutionStatus status);

    /**
     * Non-outdated executions of the given submissions, newest first per creation
     * time. The caller keeps the first row per submission as the representative
     * result. Callers must not pass an empty collection.
     */
    @Query("""
            select new com.github.codehive.model.dto.metrics.SubmissionResultRow(
                execution.submission.id, execution.status,
                execution.timeMs, execution.memoryMb, execution.createdAt)
            from Execution execution
            where execution.submission.id in :submissionIds and execution.isOutdated = false
            order by execution.createdAt desc
            """)
    List<SubmissionResultRow> findResultRowsBySubmissionIds(
            @Param("submissionIds") Collection<UUID> submissionIds);
}
