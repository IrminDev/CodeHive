package com.github.codehive.messaging.producer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import com.github.codehive.config.RabbitConfig;
import com.github.codehive.model.dto.queue.TestGenerationJob;

@Service
public class TestGenerationRequestProducer {
    private static final Logger logger = LoggerFactory.getLogger(TestGenerationRequestProducer.class);

    private final RabbitTemplate rabbitTemplate;

    public TestGenerationRequestProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void sendTestGenerationRequest(TestGenerationJob job) {
        logger.info("[WORKFLOW] RABBITMQ SEND: Sending test generation job - assignmentId={}, testCases={}, language={}",
                job.getAssignmentId(), job.getTestCases().size(), job.getReferenceLanguage());
        try {
            rabbitTemplate.convertAndSend(RabbitConfig.TEST_GENERATION_QUEUE_NAME, job);
            logger.info("[WORKFLOW] RABBITMQ SEND: Test generation job queued successfully - assignmentId={}",
                    job.getAssignmentId());
        } catch (Exception e) {
            logger.error("[WORKFLOW] RABBITMQ SEND FAILED: Could not queue test generation job - assignmentId={}, error={}",
                    job.getAssignmentId(), e.getMessage(), e);
            throw e;
        }
    }
}
