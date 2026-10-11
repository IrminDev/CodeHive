package com.github.codehive.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.ai.retry.TransientAiException;

import com.github.codehive.service.assistant.AssistantModelGateway;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.ai.model.chat=google-genai",
        "spring.ai.google.genai.api-key=test-key-not-used-for-network-calls",
        "spring.ai.retry.max-attempts=10"
})
class GeminiConfigurationIntegrationTest {
    @Autowired
    private ChatModel chatModel;

    @Autowired
    private AssistantModelGateway gateway;

    @Autowired
    private RetryTemplate retryTemplate;

    @Test
    void geminiModelIsAvailableThroughProviderNeutralGateway() {
        assertThat(chatModel.getClass().getName()).contains("GoogleGenAiChatModel");
        assertThat(gateway).isNotNull();
    }

    @Test
    void springRetryLayerDoesNotRepeatTransientProviderFailures() {
        AtomicInteger attempts = new AtomicInteger();
        assertThatThrownBy(() -> retryTemplate.execute(context -> {
            attempts.incrementAndGet();
            throw new TransientAiException("synthetic provider failure");
        })).isInstanceOf(TransientAiException.class);
        assertThat(attempts).hasValue(1);
    }
}
