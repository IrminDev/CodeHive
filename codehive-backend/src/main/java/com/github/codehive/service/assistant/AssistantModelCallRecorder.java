package com.github.codehive.service.assistant;
import java.time.Instant;
import java.time.Duration;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import org.springframework.scheduling.annotation.Scheduled;
import com.github.codehive.model.entity.AssistantModelCall;
import com.github.codehive.model.enums.*;
import com.github.codehive.repository.*;
@Service
public class AssistantModelCallRecorder {
    private final AssistantModelCallRepository calls;
    private final AssistantInteractionRepository interactions;
    public AssistantModelCallRecorder(AssistantModelCallRepository calls, AssistantInteractionRepository interactions) {
        this.calls = calls; this.interactions = interactions;
    }
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public UUID start(AssistantModelCallContext context, String provider, String model) {
        var interaction = interactions.lockForModelCall(context.interactionId()).orElseThrow();
        if (interaction.getStatus() != AssistantInteractionStatus.PENDING) throw new AssistantStateException("REQUEST_CANCELLED");
        var call = new AssistantModelCall();
        call.setInteraction(interaction); call.setCallOrdinal(calls.lastOrdinal(interaction.getId()) + 1);
        call.setStage(context.stage()); call.setGenerationAttempt(context.generationAttempt());
        call.setPromptVersion(context.promptVersion()); call.setProviderId(provider); call.setConfiguredModelId(model);
        call.setStartedAt(Instant.now()); call.setStatus(AssistantModelCallStatus.STARTED);
        return calls.saveAndFlush(call).getId();
    }
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void finish(UUID id, AssistantModelResult result, String failure, long durationMs) {
        var call = calls.lock(id).orElseThrow();
        if (call.getStatus() == AssistantModelCallStatus.SUCCEEDED || call.getStatus() == AssistantModelCallStatus.FAILED) return;
        call.setFinishedAt(Instant.now()); call.setDurationMs(Math.max(0, durationMs));
        call.setStatus(failure == null ? AssistantModelCallStatus.SUCCEEDED : AssistantModelCallStatus.FAILED);
        call.setFailureCode(failure);
        if (result != null) {
            call.setReportedModelId(result.reportedModelId());
            call.setInputTokens(valid(result.inputTokens())); call.setOutputTokens(valid(result.outputTokens()));
            call.setTotalTokens(valid(result.totalTokens())); call.setUsageSource("SPRING_AI");
        }
    }
    private Long valid(Long value) { return value == null || value < 0 ? null : value; }
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void callerTimedOut(UUID id) {
        calls.lock(id).ifPresent(call -> { if (call.getCallerTimedOutAt() == null) call.setCallerTimedOutAt(Instant.now()); });
    }
    @Scheduled(fixedDelayString = "${assistant.model-call-recovery-ms:60000}")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recoverUncertain() { calls.markUncertain(Instant.now().minus(Duration.ofMinutes(10))); }
}
