package com.github.codehive.service;

import com.github.codehive.model.dto.queue.ExecutionReport;
import com.github.codehive.model.entity.Execution;
import com.github.codehive.model.enums.ExecutionStatus;
import com.github.codehive.model.enums.ExecutionTrigger;
import com.github.codehive.model.enums.ReevaluationBatchStatus;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.notification.NotificationDomainEventPublisher;
import com.github.codehive.notification.event.NotificationDomainEvent;
import com.github.codehive.repository.ExecutionRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

@Service
public class ExecutionResultService {
    private static final Logger logger = LoggerFactory.getLogger(ExecutionResultService.class);

    private final ExecutionRepository executionRepository;
    private final NotificationDomainEventPublisher notificationPublisher;

    public ExecutionResultService(ExecutionRepository executionRepository,
                                  NotificationDomainEventPublisher notificationPublisher) {
        this.executionRepository = executionRepository;
        this.notificationPublisher = notificationPublisher;
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

        boolean firstFinalResult = execution.getStatus() == ExecutionStatus.PENDING;

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
        if (firstFinalResult && execution.getSubmission() != null) {
            boolean notifyStudent = true;
            if (execution.getTrigger() == ExecutionTrigger.ASSIGNMENT_UPDATE) {
                boolean stillCurrent = execution.getSubmission().getStudentWork() != null
                        && execution.getSubmission().getStudentWork().getCurrentSubmission() != null
                        && execution.getSubmission().getStudentWork().getCurrentSubmission().getId()
                            .equals(execution.getSubmission().getId());
                execution.setIsOutdated(!stillCurrent);
                updateBatch(execution);
                notifyStudent = stillCurrent;
            }
            if (notifyStudent) {
                notificationPublisher.publish(NotificationDomainEvent.of(
                        execution.getTrigger() == ExecutionTrigger.ASSIGNMENT_UPDATE
                                ? NotificationType.SUBMISSION_REEVALUATED
                                : NotificationType.SUBMISSION_EVALUATED,
                        null,
                        execution.getSubmission().getStudent().getId(),
                        execution.getSubmission().getAssignment().getGroup().getId(),
                        execution.getSubmission().getAssignment().getId(),
                        execution.getSubmission().getId()));
            }
        }

        logger.info("[WORKFLOW] DB UPDATE: Execution updated successfully - executionId={}, newStatus={}, timeMs={}, memoryMb={}, passed={}/{}", 
            execution.getId(), 
            execution.getStatus(),
            execution.getTimeMs(),
            execution.getMemoryMb(),
            report.getPassedTests(), 
            report.getTotalTests());
    }

    private void updateBatch(Execution execution) {
        if (execution.getReevaluationBatch() == null) return;
        com.github.codehive.model.entity.ReevaluationBatch batch = execution.getReevaluationBatch();
        batch.setCompleted(batch.getCompleted() + 1);
        if (execution.getStatus() != ExecutionStatus.AC) {
            batch.setFailed(batch.getFailed() + 1);
        }
        if (batch.getCompleted() >= batch.getTotal()) {
            batch.setStatus(batch.getFailed() > 0
                    ? ReevaluationBatchStatus.COMPLETED_WITH_FAILURES
                    : ReevaluationBatchStatus.COMPLETED);
            batch.setCompletedAt(Instant.now());
        }
    }
}
