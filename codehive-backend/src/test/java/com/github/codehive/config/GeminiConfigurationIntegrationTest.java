package com.github.codehive.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import com.github.codehive.service.assistant.AssistantModelGateway;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.ai.model.chat=google-genai",
        "spring.ai.google.genai.api-key=test-key-not-used-for-network-calls"
})
class GeminiConfigurationIntegrationTest {
    @Autowired
    private ChatModel chatModel;

    @Autowired
    private AssistantModelGateway gateway;

    @Test
    void geminiModelIsAvailableThroughProviderNeutralGateway() {
        assertThat(chatModel.getClass().getName()).contains("GoogleGenAiChatModel");
        assertThat(gateway).isNotNull();
    }
}
