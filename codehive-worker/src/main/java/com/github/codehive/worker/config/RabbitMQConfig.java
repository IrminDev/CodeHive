package com.github.codehive.worker.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${rabbitmq.queue:codehive_queue}")
    private String queueName;

    @Value("${rabbitmq.result.queue:codehive_result_queue}")
    private String resultQueueName;

    @Value("${rabbitmq.test-generation.queue:codehive_test_generation_queue}")
    private String testGenerationQueueName;

    @Value("${rabbitmq.test-generation.result.queue:codehive_test_generation_result_queue}")
    private String testGenerationResultQueueName;

    @Bean
    Queue executionQueue() {
        return new Queue(queueName, true);
    }

    @Bean
    Queue resultQueue() {
        return new Queue(resultQueueName, true);
    }

    @Bean
    Queue testGenerationQueue() {
        return new Queue(testGenerationQueueName, true);
    }

    @Bean
    Queue testGenerationResultQueue() {
        return new Queue(testGenerationResultQueueName, true);
    }

    @Bean
    @SuppressWarnings("removal")
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
