package com.github.codehive.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

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
}
