package com.github.codehive.service;

import com.github.codehive.model.dto.queue.ExecutionReport;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.repository.ExecutionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExecutionResultService {
    private static final Logger logger = LoggerFactory.getLogger(ExecutionResultService.class);

    private final ExecutionRepository executionRepository;

    public ExecutionResultService(ExecutionRepository executionRepository) {
        this.executionRepository = executionRepository;
    }

    @Transactional
    public void processExecutionResult(ExecutionReport report) {
        logger.info("[WORKFLOW] DB UPDATE: Processing execution result - executionId={}, status={}", 
            report.getExecutionId(), report.getOverallStatus());

        Execution execution = executionRepository.findById(report.getExecutionId())
            .orElse(null);

        if (execution == null) {
            logger.warn("[WORKFLOW] DB UPDATE SKIPPED: Execution not found in database - executionId={}", 
                report.getExecutionId());
            return;
        }
        
        logger.info("[WORKFLOW] DB UPDATE: Found execution in database - executionId={}, currentStatus={}",
            execution.getId(), execution.getStatus());

        // Update execution status
        execution.setStatus(report.getOverallStatus());
        
        // Update timing (use max execution time as representative)
        if (report.getMaxExecutionTimeMs() != null) {
            execution.setTimeMs(report.getMaxExecutionTimeMs());
        }
        
        // Update memory (convert KB to MB, use max memory)
        if (report.getMaxMemoryUsedMb() != null) {
            execution.setMemoryMb(report.getMaxMemoryUsedMb());
        }

        executionRepository.save(execution);

        logger.info("[WORKFLOW] DB UPDATE: Execution updated successfully - executionId={}, newStatus={}, timeMs={}, memoryMb={}, passed={}/{}", 
            execution.getId(), 
            execution.getStatus(),
            execution.getTimeMs(),
            execution.getMemoryMb(),
            report.getPassedTests(), 
            report.getTotalTests());
    }
}
