package com.github.codehive.worker.messaging.producer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.github.codehive.worker.model.dto.queue.TestGenerationResult;

@Service
public class TestGenerationResultProducer {
    private static final Logger logger = LoggerFactory.getLogger(TestGenerationResultProducer.class);

    @Value("${rabbitmq.test-generation.result.queue:codehive_test_generation_result_queue}")
    private String testGenerationResultQueueName;

    private final RabbitTemplate rabbitTemplate;

    public TestGenerationResultProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void sendTestGenerationResult(TestGenerationResult result) {
        logger.info("Sending test generation result - assignmentId={}, success={}, generated={}",
                result.getAssignmentId(), result.isSuccess(), result.getGeneratedCount());
        rabbitTemplate.convertAndSend(testGenerationResultQueueName, result);
    }
}
