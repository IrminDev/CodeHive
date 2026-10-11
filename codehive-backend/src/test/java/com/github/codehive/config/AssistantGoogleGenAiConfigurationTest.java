package com.github.codehive.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import java.nio.file.Files;
import java.nio.file.Path;
import java.io.IOException;

import com.google.genai.Client;
import org.springframework.retry.support.RetryTemplate;

class AssistantGoogleGenAiConfigurationTest {
    @TempDir Path temporaryDirectory;
    @Test
    void bindsApiKeyAndCreatesOnlyOneClientWhenGoogleIsEnabled() {
        new ApplicationContextRunner().withUserConfiguration(AssistantGoogleGenAiConfiguration.class)
                .withPropertyValues("spring.ai.model.chat=google-genai", "spring.ai.google.genai.api-key=synthetic-key")
                .run(context -> {
                    assertThat(context).hasNotFailed().hasSingleBean(Client.class);
                    assertThat(context.getBean(Client.class).apiKey()).isEqualTo("synthetic-key");
                });
    }

    @Test
    void disabledProviderDoesNotCreateClientOrOverrideRetryConfiguration() {
        new ApplicationContextRunner().withUserConfiguration(AssistantGoogleGenAiConfiguration.class)
                .withPropertyValues("spring.ai.model.chat=none")
                .run(context -> assertThat(context).hasNotFailed()
                        .doesNotHaveBean(Client.class).doesNotHaveBean(RetryTemplate.class));
    }

    @Test
    void apiKeyTakesPrecedenceUnlessVertexIsExplicitlySelected() {
        new ApplicationContextRunner().withUserConfiguration(AssistantGoogleGenAiConfiguration.class)
                .withPropertyValues("spring.ai.model.chat=google-genai", "spring.ai.google.genai.api-key=synthetic-key",
                        "spring.ai.google.genai.project-id=synthetic-project", "spring.ai.google.genai.location=us-central1")
                .run(context -> {
                    assertThat(context).hasNotFailed().hasSingleBean(Client.class);
                    assertThat(context.getBean(Client.class).vertexAI()).isFalse();
                });
    }

    @Test
    void explicitVertexSelectionRequiresProjectAndLocation() {
        new ApplicationContextRunner().withUserConfiguration(AssistantGoogleGenAiConfiguration.class)
                .withPropertyValues("spring.ai.model.chat=google-genai", "spring.ai.google.genai.api-key=synthetic-key",
                        "spring.ai.google.genai.vertex-ai=true")
                .run(context -> assertThat(context).hasFailed());
    }

    @Test
    void vertexCredentialsResourceAndLocationArePreserved() throws IOException {
        Path credentials = temporaryDirectory.resolve("synthetic-google-credentials.json");
        Files.writeString(credentials, """
                {"type":"authorized_user","client_id":"synthetic-client",
                "client_secret":"synthetic-secret","refresh_token":"synthetic-refresh"}
                """);
        new ApplicationContextRunner().withUserConfiguration(AssistantGoogleGenAiConfiguration.class)
                .withPropertyValues("spring.ai.model.chat=google-genai", "spring.ai.google.genai.vertex-ai=true",
                        "spring.ai.google.genai.project-id=synthetic-project", "spring.ai.google.genai.location=us-central1",
                        "spring.ai.google.genai.credentials-uri=" + credentials.toUri())
                .run(context -> {
                    assertThat(context).hasNotFailed().hasSingleBean(Client.class);
                    Client client = context.getBean(Client.class);
                    assertThat(client.vertexAI()).isTrue();
                    assertThat(client.project()).isEqualTo("synthetic-project");
                    assertThat(client.location()).isEqualTo("us-central1");
                });
    }
}
