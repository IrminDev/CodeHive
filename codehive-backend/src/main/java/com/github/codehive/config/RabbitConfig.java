package com.github.codehive.config;

import org.springframework.amqp.core.Queue;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {
    public static final String QUEUE_NAME = System.getProperty("rabbitmq.queue", "codehive_queue");

    @Bean
    Queue executionQueue(){
        return new Queue(QUEUE_NAME, true);
    }
}
