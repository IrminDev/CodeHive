package com.github.codehive.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class AssistantProviderDisabledIntegrationTest {
    @Autowired
    private ObjectProvider<ChatModel> models;

    @Test
    void defaultConfigurationStartsWithoutGeminiCredentialsOrModel() {
        assertThat(models.getIfAvailable()).isNull();
    }
}
