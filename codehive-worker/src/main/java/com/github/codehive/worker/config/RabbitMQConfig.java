package com.github.codehive.worker.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    public static final String QUEUE_NAME = System.getProperty("rabbitmq.queue", "codehive_queue");
    public static final String RESULT_QUEUE_NAME = System.getProperty("rabbitmq.result.queue", "codehive_result_queue");

    @Bean
    Queue executionQueue() {
        return new Queue(QUEUE_NAME, true);
    }

    @Bean
    Queue resultQueue() {
        return new Queue(RESULT_QUEUE_NAME, true);
    }

    @Bean
    @SuppressWarnings("removal")
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
