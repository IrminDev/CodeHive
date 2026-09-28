package com.github.codehive.service.assistant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.MessageType;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.ObjectProvider;
import com.google.genai.errors.ApiException;

class SpringAiAssistantModelGatewayTest {
    @Test
    void passesSeparateSystemAndUserMessagesToFakeChatModel() {
        @SuppressWarnings("unchecked")
        ObjectProvider<ChatModel> provider = mock(ObjectProvider.class);
        ChatModel model = mock(ChatModel.class);
        ChatResponse response = mock(ChatResponse.class);
        Generation generation = mock(Generation.class);
        when(provider.getIfUnique()).thenReturn(model);
        when(model.call(any(Prompt.class))).thenReturn(response);
        when(response.getResult()).thenReturn(generation);
        when(generation.getOutput()).thenReturn(new AssistantMessage("safe candidate"));
        SpringAiAssistantModelGateway gateway = new SpringAiAssistantModelGateway(provider, 2, 10);
        try {
            assertThat(gateway.complete("system policy", "student context")).isEqualTo("safe candidate");
            ArgumentCaptor<Prompt> prompt = ArgumentCaptor.forClass(Prompt.class);
            org.mockito.Mockito.verify(model).call(prompt.capture());
            assertThat(prompt.getValue().getInstructions()).hasSize(2);
            assertThat(prompt.getValue().getInstructions().get(0).getMessageType())
                    .isEqualTo(MessageType.SYSTEM);
            assertThat(prompt.getValue().getInstructions().get(1).getMessageType())
                    .isEqualTo(MessageType.USER);
        } finally {
            gateway.shutdown();
        }
    }

    @Test
    void startsWithoutProviderButFailsClosedWhenCalled() {
        @SuppressWarnings("unchecked")
        ObjectProvider<ChatModel> provider = mock(ObjectProvider.class);
        SpringAiAssistantModelGateway gateway = new SpringAiAssistantModelGateway(provider, 2, 10);
        try {
            assertThatThrownBy(() -> gateway.complete("system", "user"))
                    .isInstanceOf(AssistantStateException.class).hasMessage("MODEL_UNAVAILABLE");
        } finally {
            gateway.shutdown();
        }
    }

    @Test
    void providerRateLimitReturnsSafeCodeWithoutProviderMessage() {
        @SuppressWarnings("unchecked")
        ObjectProvider<ChatModel> provider = mock(ObjectProvider.class);
        ChatModel model = mock(ChatModel.class);
        when(provider.getIfUnique()).thenReturn(model);
        when(model.call(any(Prompt.class))).thenThrow(new ApiException(429, "RESOURCE_EXHAUSTED", "sensitive provider detail"));
        SpringAiAssistantModelGateway gateway = new SpringAiAssistantModelGateway(provider, 2, 10);
        try {
            assertThatThrownBy(() -> gateway.complete("system", "student text"))
                    .isInstanceOf(AssistantStateException.class).hasMessage("MODEL_RATE_LIMITED");
        } finally {
            gateway.shutdown();
        }
    }

    @Test
    void configuredProviderCallBudgetFailsClosedBeforeAnotherTransmission() {
        @SuppressWarnings("unchecked")
        ObjectProvider<ChatModel> provider = mock(ObjectProvider.class);
        ChatModel model = mock(ChatModel.class);
        ChatResponse response = mock(ChatResponse.class);
        Generation generation = mock(Generation.class);
        when(provider.getIfUnique()).thenReturn(model);
        when(model.call(any(Prompt.class))).thenReturn(response);
        when(response.getResult()).thenReturn(generation);
        when(generation.getOutput()).thenReturn(new AssistantMessage("safe"));
        SpringAiAssistantModelGateway gateway = new SpringAiAssistantModelGateway(provider, 2, 1);
        try {
            assertThat(gateway.complete("system", "first")).isEqualTo("safe");
            assertThatThrownBy(() -> gateway.complete("system", "second"))
                    .isInstanceOf(AssistantStateException.class).hasMessage("MODEL_RATE_LIMITED");
            org.mockito.Mockito.verify(model, org.mockito.Mockito.times(1)).call(any(Prompt.class));
        } finally {
            gateway.shutdown();
        }
    }
}
