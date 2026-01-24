package com.github.codehive.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {
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
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
