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
    private AssistantModelCallRecorder recorder;
    @Value("${assistant.provider:google-genai}")
    private String providerId;
    @org.springframework.beans.factory.annotation.Autowired
    public void setRecorder(AssistantModelCallRecorder recorder) { this.recorder = recorder; }
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
        return complete(null, systemInstruction, userPayload).text();
    }

    @Override
    public AssistantModelResult complete(AssistantModelCallContext context, String systemInstruction, String userPayload) {
        ChatModel model = models.getIfUnique();
        if (model == null) throw new AssistantStateException("MODEL_UNAVAILABLE");
        String modelId = configuredModel == null ? "unknown" : configuredModel;
        var callId = new java.util.concurrent.atomic.AtomicReference<java.util.UUID>();
        var timedOut = new java.util.concurrent.atomic.AtomicBoolean();
        Future<AssistantModelResult> future;
        try {
            future = executor.submit(() -> {
                if (Thread.currentThread().isInterrupted() || timedOut.get()) throw new AssistantStateException("MODEL_INTERRUPTED");
                if (!providerBudget.tryConsume(1)) throw new AssistantStateException("MODEL_RATE_LIMITED");
                if (context != null) {
                    try { callId.set(recorder.start(context, providerId, modelId)); }
                    catch (AssistantStateException exception) { throw exception; }
                    catch (RuntimeException exception) { throw new AssistantStateException("MODEL_RECORDING_FAILED"); }
                }
                if (timedOut.get() && callId.get() != null) markTimeout(callId.get());
                long startedNanos = System.nanoTime();
                AssistantModelResult result = null;
                String failure = null;
                try {
                    ChatResponse response = model.call(new Prompt(List.of(
                            new SystemMessage(systemInstruction), new UserMessage(userPayload))));
                    Usage usage = response == null || response.getMetadata() == null ? null : response.getMetadata().getUsage();
                    String text = response == null || response.getResult() == null || response.getResult().getOutput() == null
                            ? null : response.getResult().getOutput().getText();
                    result = new AssistantModelResult(text,
                            response == null || response.getMetadata() == null ? null : response.getMetadata().getModel(),
                            usage == null ? null : token(usage.getPromptTokens()),
                            usage == null ? null : token(usage.getCompletionTokens()),
                            usage == null ? null : token(usage.getTotalTokens()));
                    if (text == null || text.isBlank()) { failure = "MODEL_EMPTY_RESPONSE"; throw new AssistantStateException(failure); }
                    return result;
                } catch (RuntimeException exception) {
                    if (failure == null) {
                        ApiException api = apiException(exception);
                        failure = api != null && api.code() == 429 ? "MODEL_RATE_LIMITED" : "MODEL_FAILURE";
                    }
                    throw new AssistantStateException(failure);
                } finally {
                    if (callId.get() != null) {
                        try { recorder.finish(callId.get(), result, failure,
                                TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedNanos)); }
                        catch (RuntimeException exception) { logger.error("assistant call recording incomplete callId={}", callId.get()); }
                    }
                }
            });
        } catch (java.util.concurrent.RejectedExecutionException exception) {
            throw new AssistantStateException("MODEL_BUSY");
        }
        try {
            return future.get(timeout.toMillis(), TimeUnit.MILLISECONDS);
        } catch (TimeoutException exception) {
            timedOut.set(true);
            if (callId.get() != null) markTimeout(callId.get());
            future.cancel(true);
            throw new AssistantStateException("MODEL_TIMEOUT");
        } catch (InterruptedException exception) {
            timedOut.set(true);
            if (callId.get() != null) markTimeout(callId.get());
            future.cancel(true);
            Thread.currentThread().interrupt();
            throw new AssistantStateException("MODEL_INTERRUPTED");
        } catch (java.util.concurrent.ExecutionException exception) {
            if (exception.getCause() instanceof AssistantStateException state) throw state;
            throw new AssistantStateException("MODEL_FAILURE");
        }
    }

    private Long token(Number value) { return value == null || value.longValue() < 0 ? null : value.longValue(); }
    private void markTimeout(java.util.UUID id) {
        try { recorder.callerTimedOut(id); }
        catch (RuntimeException exception) { logger.error("assistant timeout recording incomplete callId={}", id); }
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
