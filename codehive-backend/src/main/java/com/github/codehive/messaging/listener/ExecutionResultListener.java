package com.github.codehive.messaging.listener;

import com.github.codehive.model.dto.queue.ExecutionReport;
import com.github.codehive.service.ExecutionResultService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class ExecutionResultListener {
    private static final Logger logger = LoggerFactory.getLogger(ExecutionResultListener.class);

    private final ExecutionResultService executionResultService;

    public ExecutionResultListener(ExecutionResultService executionResultService) {
        this.executionResultService = executionResultService;
    }

    @RabbitListener(queues = "${rabbitmq.result.queue:codehive_result_queue}")
    public void handleExecutionResult(ExecutionReport report) {
        logger.info("[WORKFLOW] RABBITMQ RECEIVE: Received execution result from worker - executionId={}, overallStatus={}", 
            report.getExecutionId(), report.getOverallStatus());
        logger.info("[WORKFLOW] RABBITMQ RECEIVE: Result details - passed={}/{}, maxTimeMs={}, maxMemoryKb={}",
            report.getPassedTests(), report.getTotalTests(), 
            report.getMaxExecutionTimeMs(), report.getMaxMemoryUsedKb());

        try {
            executionResultService.processExecutionResult(report);
            logger.info("[WORKFLOW] RABBITMQ RECEIVE: Successfully processed result - executionId={}", 
                report.getExecutionId());
        } catch (Exception e) {
            logger.error("[WORKFLOW] RABBITMQ RECEIVE FAILED: Could not process result - executionId={}, error={}", 
                report.getExecutionId(), e.getMessage(), e);
        }
    }
}
