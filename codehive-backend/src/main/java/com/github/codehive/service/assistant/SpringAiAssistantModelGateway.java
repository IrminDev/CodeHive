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
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.genai.errors.ApiException;
import io.github.bucket4j.Bucket;

import jakarta.annotation.PreDestroy;

@Component
public class SpringAiAssistantModelGateway implements AssistantModelGateway {
    private static final Logger logger = LoggerFactory.getLogger(SpringAiAssistantModelGateway.class);
    @Value("${spring.ai.google.genai.chat.options.model:unknown}")
    private String configuredModel;
    private final ObjectProvider<ChatModel> models;
    private final Duration timeout;
    private final Bucket providerBudget;
    private final ThreadPoolExecutor executor = new ThreadPoolExecutor(4, 4, 0, TimeUnit.MILLISECONDS,
            new ArrayBlockingQueue<>(8), new ThreadPoolExecutor.AbortPolicy());

    public SpringAiAssistantModelGateway(ObjectProvider<ChatModel> models,
            @Value("${assistant.model-timeout-seconds:50}") int timeoutSeconds,
            @Value("${assistant.provider-calls-per-minute:10}") int providerCallsPerMinute) {
        this.models = models;
        if (timeoutSeconds < 1 || timeoutSeconds > 120) {
            throw new IllegalArgumentException("assistant.model-timeout-seconds must be 1..120");
        }
        this.timeout = Duration.ofSeconds(timeoutSeconds);
        if (providerCallsPerMinute < 1 || providerCallsPerMinute > 1_000) {
            throw new IllegalArgumentException("assistant.provider-calls-per-minute must be 1..1000");
        }
        this.providerBudget = Bucket.builder().addLimit(limit -> limit.capacity(providerCallsPerMinute)
                .refillIntervally(providerCallsPerMinute, Duration.ofMinutes(1))).build();
    }

    @Override
    public String complete(String systemInstruction, String userPayload) {
        ChatModel model = models.getIfUnique();
        if (model == null) throw new AssistantStateException("MODEL_UNAVAILABLE");
        if (!providerBudget.tryConsume(1)) throw new AssistantStateException("MODEL_RATE_LIMITED");
        String modelId = configuredModel == null ? "unknown" : configuredModel;
        Future<String> future;
        try {
            future = executor.submit(() -> {
                long startedNanos = System.nanoTime();
                logger.info("assistant provider request started modelId={} timeoutMs={}",
                        modelId, timeout.toMillis());
                ChatResponse response = model.call(new Prompt(List.of(
                        new SystemMessage(systemInstruction), new UserMessage(userPayload))));
                if (response == null || response.getResult() == null
                        || response.getResult().getOutput() == null) {
                    throw new AssistantStateException("MODEL_EMPTY_RESPONSE");
                }
                Usage usage = response.getMetadata() == null ? null : response.getMetadata().getUsage();
                logger.info("assistant model call modelId={} inputTokens={} outputTokens={} durationMs={}",
                        response.getMetadata() == null ? "unknown" : response.getMetadata().getModel(),
                        usage == null ? null : usage.getPromptTokens(),
                        usage == null ? null : usage.getCompletionTokens(),
                        TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedNanos));
                return response.getResult().getOutput().getText();
            });
        } catch (java.util.concurrent.RejectedExecutionException exception) {
            throw new AssistantStateException("MODEL_BUSY");
        }
        try {
            return future.get(timeout.toMillis(), TimeUnit.MILLISECONDS);
        } catch (TimeoutException exception) {
            logger.warn("assistant provider request timed out modelId={} timeoutMs={}",
                    modelId, timeout.toMillis());
            future.cancel(true);
            throw new AssistantStateException("MODEL_TIMEOUT");
        } catch (InterruptedException exception) {
            logger.warn("assistant provider wait interrupted modelId={} timeoutMs={}",
                    modelId, timeout.toMillis());
            future.cancel(true);
            Thread.currentThread().interrupt();
            throw new AssistantStateException("MODEL_INTERRUPTED");
        } catch (java.util.concurrent.ExecutionException exception) {
            Throwable cause = exception.getCause();
            ApiException api = apiException(cause);
            // Never log provider messages, prompts, context, or response bodies.
            logger.warn("assistant provider request failed modelId={} causeTypes={} httpStatus={}",
                    modelId,
                    causeTypes(cause),
                    api == null ? "unknown" : api.code());
            if (api != null && api.code() == 429) throw new AssistantStateException("MODEL_RATE_LIMITED");
            throw new AssistantStateException("MODEL_FAILURE");
        }
    }

    private ApiException apiException(Throwable cause) {
        for (int depth = 0; cause != null && depth < 12; depth++, cause = cause.getCause()) {
            if (cause instanceof ApiException api) return api;
        }
        return null;
    }

    private String causeTypes(Throwable cause) {
        StringBuilder types = new StringBuilder();
        for (int depth = 0; cause != null && depth < 12; depth++, cause = cause.getCause()) {
            if (depth > 0) types.append("->");
            types.append(cause.getClass().getSimpleName());
        }
        return types.length() == 0 ? "unknown" : types.toString();
    }

    @PreDestroy
    public void shutdown() {
        executor.shutdownNow();
    }
}
