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

    @Test
    void recordingFailurePreventsProviderTransmission() {
        @SuppressWarnings("unchecked") ObjectProvider<ChatModel> provider = mock(ObjectProvider.class);
        ChatModel model = mock(ChatModel.class);
        when(provider.getIfUnique()).thenReturn(model);
        var recorder = mock(AssistantModelCallRecorder.class);
        when(recorder.start(any(), any(), any())).thenThrow(new IllegalStateException("database detail"));
        var gateway = new SpringAiAssistantModelGateway(provider, 2, 10);
        gateway.setRecorder(recorder);
        org.springframework.test.util.ReflectionTestUtils.setField(gateway,"providerId","test");
        org.springframework.test.util.ReflectionTestUtils.setField(gateway,"configuredModel","test-model");
        try {
            var context = new AssistantModelCallContext(java.util.UUID.fromString("00000000-0000-0000-0000-000000000001"),
                com.github.codehive.model.enums.AssistantModelCallStage.INPUT_REVIEW,null,"v1");
            assertThatThrownBy(() -> gateway.complete(context,"system","payload")).hasMessage("MODEL_RECORDING_FAILED");
            org.mockito.Mockito.verifyNoInteractions(model);
        } finally { gateway.shutdown(); }
    }

    @Test
    void lateProviderResultFinishesLedgerWithoutReturningLateText() throws Exception {
        @SuppressWarnings("unchecked") ObjectProvider<ChatModel> provider = mock(ObjectProvider.class);
        ChatModel model = mock(ChatModel.class);
        when(provider.getIfUnique()).thenReturn(model);
        var recorder = mock(AssistantModelCallRecorder.class);
        var id = java.util.UUID.fromString("00000000-0000-0000-0000-000000000001");
        when(recorder.start(any(), any(), any())).thenReturn(id);
        var entered = new java.util.concurrent.CountDownLatch(1);
        var release = new java.util.concurrent.CountDownLatch(1);
        var finished = new java.util.concurrent.CountDownLatch(1);
        when(model.call(any(Prompt.class))).thenAnswer(invocation -> {
            entered.countDown();
            boolean waiting = true;
            while (waiting) {
                try { waiting = !release.await(5, java.util.concurrent.TimeUnit.SECONDS); }
                catch (InterruptedException ignored) { /* Provider may ignore cancellation. */ }
            }
            return new ChatResponse(java.util.List.of(new Generation(new AssistantMessage("late untrusted text"))));
        });
        org.mockito.Mockito.doAnswer(invocation -> { finished.countDown(); return null; })
            .when(recorder).finish(org.mockito.ArgumentMatchers.eq(id), any(), org.mockito.ArgumentMatchers.isNull(), org.mockito.ArgumentMatchers.anyLong());
        var gateway = new SpringAiAssistantModelGateway(provider, 1, 10);
        gateway.setRecorder(recorder);
        org.springframework.test.util.ReflectionTestUtils.setField(gateway,"providerId","test");
        org.springframework.test.util.ReflectionTestUtils.setField(gateway,"configuredModel","test-model");
        try {
            var context = new AssistantModelCallContext(id,com.github.codehive.model.enums.AssistantModelCallStage.INPUT_REVIEW,null,"v1");
            assertThatThrownBy(() -> gateway.complete(context,"system","payload")).hasMessage("MODEL_TIMEOUT");
            assertThat(entered.getCount()).isZero();
            org.mockito.Mockito.verify(recorder,org.mockito.Mockito.atLeastOnce()).callerTimedOut(id);
            release.countDown();
            assertThat(finished.await(5,java.util.concurrent.TimeUnit.SECONDS)).isTrue();
        } finally { release.countDown(); gateway.shutdown(); }
    }

    @Test
    void emptyResponseStillRecordsReportedUsageBeforeEducationalFailure() {
        @SuppressWarnings("unchecked") ObjectProvider<ChatModel> provider = mock(ObjectProvider.class);
        ChatModel model = mock(ChatModel.class);
        when(provider.getIfUnique()).thenReturn(model);
        var usage = mock(org.springframework.ai.chat.metadata.Usage.class);
        when(usage.getPromptTokens()).thenReturn(5);
        when(usage.getCompletionTokens()).thenReturn(0);
        when(usage.getTotalTokens()).thenReturn(7);
        var metadata = org.springframework.ai.chat.metadata.ChatResponseMetadata.builder().model("reported").usage(usage).build();
        when(model.call(any(Prompt.class))).thenReturn(new ChatResponse(java.util.List.of(),metadata));
        var recorder = mock(AssistantModelCallRecorder.class);
        var id = java.util.UUID.fromString("00000000-0000-0000-0000-000000000001");
        when(recorder.start(any(),any(),any())).thenReturn(id);
        var gateway = new SpringAiAssistantModelGateway(provider, 2, 10);
        gateway.setRecorder(recorder);
        org.springframework.test.util.ReflectionTestUtils.setField(gateway,"providerId","test");
        org.springframework.test.util.ReflectionTestUtils.setField(gateway,"configuredModel","test-model");
        try {
            var context = new AssistantModelCallContext(id,com.github.codehive.model.enums.AssistantModelCallStage.ANSWER_GENERATION,1,"v1");
            assertThatThrownBy(() -> gateway.complete(context,"system","payload")).hasMessage("MODEL_EMPTY_RESPONSE");
            var captured = ArgumentCaptor.forClass(AssistantModelResult.class);
            org.mockito.Mockito.verify(recorder).finish(org.mockito.ArgumentMatchers.eq(id),captured.capture(),
                org.mockito.ArgumentMatchers.eq("MODEL_EMPTY_RESPONSE"),org.mockito.ArgumentMatchers.anyLong());
            assertThat(captured.getValue().inputTokens()).isEqualTo(5L);
            assertThat(captured.getValue().outputTokens()).isZero();
            assertThat(captured.getValue().totalTokens()).isEqualTo(7L);
        } finally { gateway.shutdown(); }
    }
}
