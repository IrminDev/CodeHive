package com.github.codehive.service.assistant;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.Future;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PreDestroy;

@Component
public class SpringAiAssistantModelGateway implements AssistantModelGateway {
    private final ObjectProvider<ChatModel> models;
    private final Duration timeout;
    private final ThreadPoolExecutor executor = new ThreadPoolExecutor(4, 4, 0, TimeUnit.MILLISECONDS,
            new ArrayBlockingQueue<>(8), new ThreadPoolExecutor.AbortPolicy());

    public SpringAiAssistantModelGateway(ObjectProvider<ChatModel> models,
            @Value("${assistant.model-timeout-seconds:20}") int timeoutSeconds) {
        this.models = models;
        if (timeoutSeconds < 1 || timeoutSeconds > 120) {
            throw new IllegalArgumentException("assistant.model-timeout-seconds must be 1..120");
        }
        this.timeout = Duration.ofSeconds(timeoutSeconds);
    }

    @Override
    public String complete(String systemInstruction, String userPayload) {
        ChatModel model = models.getIfUnique();
        if (model == null) throw new AssistantStateException("MODEL_UNAVAILABLE");
        Future<String> future;
        try {
            future = executor.submit(() -> {
                ChatResponse response = model.call(new Prompt(List.of(
                        new SystemMessage(systemInstruction), new UserMessage(userPayload))));
                if (response == null || response.getResult() == null
                        || response.getResult().getOutput() == null) {
                    throw new AssistantStateException("MODEL_EMPTY_RESPONSE");
                }
                return response.getResult().getOutput().getText();
            });
        } catch (java.util.concurrent.RejectedExecutionException exception) {
            throw new AssistantStateException("MODEL_BUSY");
        }
        try {
            return future.get(timeout.toMillis(), TimeUnit.MILLISECONDS);
        } catch (TimeoutException exception) {
            future.cancel(true);
            throw new AssistantStateException("MODEL_TIMEOUT");
        } catch (InterruptedException exception) {
            future.cancel(true);
            Thread.currentThread().interrupt();
            throw new AssistantStateException("MODEL_INTERRUPTED");
        } catch (java.util.concurrent.ExecutionException exception) {
            throw new AssistantStateException("MODEL_FAILURE");
        }
    }

    @PreDestroy
    public void shutdown() {
        executor.shutdownNow();
    }
}
