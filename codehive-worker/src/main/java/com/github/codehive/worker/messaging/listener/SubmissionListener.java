package com.github.codehive.worker.messaging.listener;

import com.github.codehive.worker.model.dto.ExecutionReport;
import com.github.codehive.worker.model.dto.queue.ExecutionJob;
import com.github.codehive.worker.service.TestExecutionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class SubmissionListener {
    private static final Logger logger = LoggerFactory.getLogger(SubmissionListener.class);
    
    private final TestExecutionService testExecutionService;

    public SubmissionListener(TestExecutionService testExecutionService) {
        this.testExecutionService = testExecutionService;
    }

    @RabbitListener(queues = "${rabbitmq.queue:codehive_queue}")
    public void handleExecutionJob(ExecutionJob job) {
        logger.info("Received execution job: id={}, language={}, type={}", 
            job.getId(), job.getLanguage(), job.getExecutionType());
        
        try {
            // Execute the job and get the report
            ExecutionReport report = testExecutionService.executeJob(job);
            
            logger.info("Execution completed: id={}, status={}, passed={}/{}", 
                job.getId(), report.getOverallStatus(), report.getPassedTests(), report.getTotalTests());
            
            // Log detailed results
            logExecutionReport(report);
            
            // TODO: Send result back to backend via RabbitMQ result queue
            // This will be implemented when we have a result queue configured
            
        } catch (Exception e) {
            logger.error("Failed to process execution job: id={}", job.getId(), e);
            // TODO: Send error result back to backend
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
        
        if (report.getMaxMemoryUsedKb() != null) {
            logger.info("Max Memory Used: {}KB", report.getMaxMemoryUsedKb());
        }
        
        logger.info("========================");
    }
}
