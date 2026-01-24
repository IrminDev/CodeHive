package com.github.codehive.worker.messaging.producer;

import com.github.codehive.worker.config.RabbitMQConfig;
import com.github.codehive.worker.model.dto.ExecutionReport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class ExecutionResultProducer {
    private static final Logger logger = LoggerFactory.getLogger(ExecutionResultProducer.class);
    
    private final RabbitTemplate rabbitTemplate;

    public ExecutionResultProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void sendExecutionResult(ExecutionReport report) {
        logger.info("Sending execution result to queue: executionId={}, status={}", 
            report.getExecutionId(), report.getOverallStatus());
        
        rabbitTemplate.convertAndSend(RabbitMQConfig.RESULT_QUEUE_NAME, report);
        
        logger.debug("Execution result sent successfully: executionId={}", report.getExecutionId());
    }
}
