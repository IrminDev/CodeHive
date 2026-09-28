package com.github.codehive.config;

import java.util.Map;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {
    public static final String QUEUE_NAME = System.getProperty("rabbitmq.queue", "codehive_queue");
    public static final String RESULT_QUEUE_NAME = System.getProperty("rabbitmq.result.queue", "codehive_result_queue");
    public static final String TEST_GENERATION_QUEUE_NAME = System.getProperty("rabbitmq.test-generation.queue", "codehive_test_generation_queue");
    public static final String TEST_GENERATION_RESULT_QUEUE_NAME = System.getProperty("rabbitmq.test-generation.result.queue", "codehive_test_generation_result_queue");
    public static final String NOTIFICATION_EXCHANGE = "codehive.notification.exchange";
    public static final String NOTIFICATION_RETRY_EXCHANGE = "codehive.notification.retry.exchange";
    public static final String NOTIFICATION_EMAIL_QUEUE = "codehive_notification_email_queue";
    public static final String NOTIFICATION_EMAIL_RETRY_QUEUE = "codehive_notification_email_retry_queue";
    public static final String NOTIFICATION_EMAIL_DLQ = "codehive_notification_email_dlq";
    public static final String NOTIFICATION_EMAIL_ROUTING_KEY = "notification.email";
    public static final String NOTIFICATION_RETRY_ROUTING_KEY = "notification.email.retry";
    public static final String NOTIFICATION_FAILED_ROUTING_KEY = "notification.email.failed";

    @Bean
    Queue executionQueue() {
        return new Queue(QUEUE_NAME, true);
    }

    @Bean
    Queue resultQueue() {
        return new Queue(RESULT_QUEUE_NAME, true);
    }

    @Bean
    Queue testGenerationQueue() {
        return new Queue(TEST_GENERATION_QUEUE_NAME, true);
    }

    @Bean
    Queue testGenerationResultQueue() {
        return new Queue(TEST_GENERATION_RESULT_QUEUE_NAME, true);
    }

    @Bean
    DirectExchange notificationExchange() {
        return new DirectExchange(NOTIFICATION_EXCHANGE, true, false);
    }

    @Bean
    DirectExchange notificationRetryExchange() {
        return new DirectExchange(NOTIFICATION_RETRY_EXCHANGE, true, false);
    }

    @Bean
    Queue notificationEmailQueue() {
        return QueueBuilder.durable(NOTIFICATION_EMAIL_QUEUE).build();
    }

    @Bean
    Queue notificationEmailRetryQueue() {
        return QueueBuilder.durable(NOTIFICATION_EMAIL_RETRY_QUEUE)
                .withArguments(Map.of(
                        "x-message-ttl", 300_000,
                        "x-dead-letter-exchange", NOTIFICATION_EXCHANGE,
                        "x-dead-letter-routing-key", NOTIFICATION_EMAIL_ROUTING_KEY))
                .build();
    }

    @Bean
    Queue notificationEmailDeadLetterQueue() {
        return QueueBuilder.durable(NOTIFICATION_EMAIL_DLQ).build();
    }

    @Bean
    Binding notificationEmailBinding(Queue notificationEmailQueue, DirectExchange notificationExchange) {
        return BindingBuilder.bind(notificationEmailQueue)
                .to(notificationExchange)
                .with(NOTIFICATION_EMAIL_ROUTING_KEY);
    }

    @Bean
    Binding notificationRetryBinding(Queue notificationEmailRetryQueue,
                                     DirectExchange notificationRetryExchange) {
        return BindingBuilder.bind(notificationEmailRetryQueue)
                .to(notificationRetryExchange)
                .with(NOTIFICATION_RETRY_ROUTING_KEY);
    }

    @Bean
    Binding notificationDeadLetterBinding(Queue notificationEmailDeadLetterQueue,
                                          DirectExchange notificationExchange) {
        return BindingBuilder.bind(notificationEmailDeadLetterQueue)
                .to(notificationExchange)
                .with(NOTIFICATION_FAILED_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
