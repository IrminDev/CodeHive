package com.github.codehive.worker.messaging.producer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import com.github.codehive.worker.config.RabbitMQConfig;
import com.github.codehive.worker.model.dto.queue.TestGenerationResult;

@Service
public class TestGenerationResultProducer {
    private static final Logger logger = LoggerFactory.getLogger(TestGenerationResultProducer.class);

    private final RabbitTemplate rabbitTemplate;

    public TestGenerationResultProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void sendTestGenerationResult(TestGenerationResult result) {
        logger.info("Sending test generation result - assignmentId={}, success={}, generated={}",
                result.getAssignmentId(), result.isSuccess(), result.getGeneratedCount());
        rabbitTemplate.convertAndSend(RabbitMQConfig.TEST_GENERATION_RESULT_QUEUE_NAME, result);
    }
}
