package com.github.codehive.repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
    
    List<Execution> findBySubmissionIsNull();
    
    long countByStatus(ExecutionStatus status);

    Optional<Execution> findTopBySubmissionIdOrderByCreatedAtDesc(UUID submissionId);

    boolean existsBySubmissionIdAndTestSuiteRevisionId(UUID submissionId, UUID testSuiteRevisionId);

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
