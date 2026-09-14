package com.github.codehive.worker.messaging.listener;

import com.github.codehive.worker.messaging.producer.ExecutionResultProducer;
import com.github.codehive.worker.model.dto.ExecutionReport;
import com.github.codehive.worker.model.dto.queue.ExecutionJob;
import com.github.codehive.worker.model.enums.ExecutionStatus;
import com.github.codehive.worker.service.TestExecutionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class ExecutionRequestListener {
    private static final Logger logger = LoggerFactory.getLogger(ExecutionRequestListener.class);
    
    private final TestExecutionService testExecutionService;
    private final ExecutionResultProducer executionResultProducer;

    public ExecutionRequestListener(TestExecutionService testExecutionService, 
                             ExecutionResultProducer executionResultProducer) {
        this.testExecutionService = testExecutionService;
        this.executionResultProducer = executionResultProducer;
    }

    @RabbitListener(queues = "${rabbitmq.queue:codehive_queue}")
    public void handleExecutionJob(ExecutionJob job) {
        logger.info("[WORKFLOW] RABBITMQ RECEIVE: Received execution job from backend");
        logger.info("[WORKFLOW] === Execution Job Details ===");
        logger.info("[WORKFLOW] ID: {}", job.getId());
        logger.info("[WORKFLOW] Language: {}", job.getLanguage());
        logger.info("[WORKFLOW] Reference Language: {}", job.getReferenceLanguage());
        logger.info("[WORKFLOW] Execution Type: {}", job.getExecutionType());
        logger.info("[WORKFLOW] Source Path: {}", job.getSource());
        logger.info("[WORKFLOW] Reference Path: {}", job.getReference());
        logger.info("[WORKFLOW] Report Path: {}", job.getReportPath());
        logger.info("[WORKFLOW] Test Suite Revision: {}", job.getTestSuiteRevisionId());
        logger.info("[WORKFLOW] Trigger: {}", job.getTrigger());
        logger.info("[WORKFLOW] Time Limit (ms): {}", job.getTimeLimitMs());
        logger.info("[WORKFLOW] Memory Limit (MB): {}", job.getMemoryLimitMb());
        logger.info("[WORKFLOW] Comparator Type: {}", job.getComparatorType());
        logger.info("[WORKFLOW] Test Cases: {}", job.getTestCases() != null ? job.getTestCases().size() : 0);
        logger.info("[WORKFLOW] =============================");
        
        try {
            // Execute the job and get the report
            ExecutionReport report = testExecutionService.executeJob(job);
            
            logger.info("Execution completed: id={}, status={}, passed={}/{}", 
                job.getId(), report.getOverallStatus(), report.getPassedTests(), report.getTotalTests());
            
            // Log detailed results
            logExecutionReport(report);
            
            // Send result back to backend via RabbitMQ result queue
            executionResultProducer.sendExecutionResult(report);
            
        } catch (Exception e) {
            logger.error("Failed to process execution job: id={}", job.getId(), e);
            
            // Send error result back to backend
            ExecutionReport errorReport = new ExecutionReport(job.getId());
            errorReport.setOverallStatus(ExecutionStatus.RTE);
            errorReport.setCompilationError("Internal error: " + e.getMessage());
            executionResultProducer.sendExecutionResult(errorReport);
        }
    }
    
    private void logExecutionReport(ExecutionReport report) {
        logger.info("=== Execution Report ===");
        logger.info("Execution ID: {}", report.getExecutionId());
        logger.info("Overall Status: {}", report.getOverallStatus());
        logger.info("Tests: {}/{} passed", report.getPassedTests(), report.getTotalTests());
        
        if (report.getCompilationError() != null) {
            logger.info("Compilation Error: {}", 
                report.getCompilationError().substring(0, Math.min(200, report.getCompilationError().length())));
        }
        
        if (report.getTotalExecutionTimeMs() != null) {
            logger.info("Total Execution Time: {}ms", report.getTotalExecutionTimeMs());
        }
        
        if (report.getMaxExecutionTimeMs() != null) {
            logger.info("Max Execution Time: {}ms", report.getMaxExecutionTimeMs());
        }
        
        if (report.getMaxMemoryUsedMb() != null) {
            logger.info("Max Memory Used: {}MB", report.getMaxMemoryUsedMb());
        }
        
        logger.info("========================");
    }
}
