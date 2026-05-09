package com.github.codehive.worker.messaging.producer;

import com.github.codehive.worker.model.dto.ExecutionReport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ExecutionResultProducer {
    private static final Logger logger = LoggerFactory.getLogger(ExecutionResultProducer.class);

    @Value("${rabbitmq.result.queue:codehive_result_queue}")
    private String resultQueueName;

    private final RabbitTemplate rabbitTemplate;

    public ExecutionResultProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void sendExecutionResult(ExecutionReport report) {
        logger.info("Sending execution result to queue: executionId={}, status={}",
            report.getExecutionId(), report.getOverallStatus());

        rabbitTemplate.convertAndSend(resultQueueName, report);
        
        logger.debug("Execution result sent successfully: executionId={}", report.getExecutionId());
    }
}
