package com.github.codehive.service;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import com.github.codehive.config.RabbitConfig;
import com.github.codehive.model.dto.queue.ExecutionJob;

@Service
public class ExecutionProducer {
    private final RabbitTemplate rabbitTemplate;

    public ExecutionProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void sendExecutionRequest(ExecutionJob executionJob) {
        rabbitTemplate.convertAndSend(
            RabbitConfig.QUEUE_NAME,
            executionJob
        );
    }
}
