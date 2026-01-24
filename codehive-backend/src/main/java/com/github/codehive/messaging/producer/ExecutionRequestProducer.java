package com.github.codehive.messaging.producer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import com.github.codehive.config.RabbitConfig;
import com.github.codehive.model.dto.queue.ExecutionJob;

@Service
public class ExecutionRequestProducer {
    private static final Logger logger = LoggerFactory.getLogger(ExecutionRequestProducer.class);
    
    private final RabbitTemplate rabbitTemplate;

    public ExecutionRequestProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void sendExecutionRequest(ExecutionJob job) {
        logger.info("[WORKFLOW] RABBITMQ SEND: Preparing to send execution request - executionId={}, language={}, executionType={}", 
            job.getId(), job.getLanguage(), job.getExecutionType());
        logger.info("[WORKFLOW] RABBITMQ SEND: Job details - sourceKey={}, timeLimitMs={}, memoryLimitMb={}, numTests={}",
            job.getSource(), job.getTimeLimitMs(), job.getMemoryLimitMb(), job.getNumTests());
        
        try {
            rabbitTemplate.convertAndSend(RabbitConfig.QUEUE_NAME, job);
            logger.info("[WORKFLOW] RABBITMQ SEND: Successfully sent to queue '{}' - executionId={}", 
                RabbitConfig.QUEUE_NAME, job.getId());
        } catch (Exception e) {
            logger.error("[WORKFLOW] RABBITMQ SEND FAILED: Could not send to queue '{}' - executionId={}, error={}",
                RabbitConfig.QUEUE_NAME, job.getId(), e.getMessage(), e);
            throw e;
        }
    }
}
