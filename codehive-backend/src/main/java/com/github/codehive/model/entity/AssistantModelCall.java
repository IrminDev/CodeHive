package com.github.codehive.model.entity;
import java.time.Instant;
import java.util.UUID;
import jakarta.persistence.*;
import com.github.codehive.model.enums.*;
/** Technical ledger only: never stores provider input or generated text. */
@Entity
@org.hibernate.annotations.Check(constraints = "call_ordinal > 0 and (generation_attempt is null or generation_attempt between 1 and 2) and (input_tokens is null or input_tokens >= 0) and (output_tokens is null or output_tokens >= 0) and (total_tokens is null or total_tokens >= 0) and (duration_ms is null or duration_ms >= 0)")
@Table(name = "assistant_model_calls", uniqueConstraints = @UniqueConstraint(columnNames = {"interaction_id", "call_ordinal"}), indexes = {@Index(name="idx_assistant_call_started", columnList="started_at"), @Index(name="idx_assistant_call_interaction_started", columnList="interaction_id,started_at")})
public class AssistantModelCall {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "interaction_id", nullable = false)
    private AssistantInteraction interaction;
    @Column(nullable = false)
    private int callOrdinal;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30)
    private AssistantModelCallStage stage;
    
    private Integer generationAttempt;
    @Column(length = 100)
    private String providerId;
    @Column(length = 150)
    private String configuredModelId;
    @Column(length = 150)
    private String reportedModelId;
    @Column(length = 100)
    private String promptVersion;
    @Column(nullable = false)
    private Instant startedAt;
    
    private Instant finishedAt;
    
    private Long durationMs;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private AssistantModelCallStatus status;
    @Column(length = 60)
    private String failureCode;
    
    private Instant callerTimedOutAt;
    
    private Long inputTokens;
    
    private Long outputTokens;
    
    private Long totalTokens;
    @Column(length = 30)
    private String usageSource;
    public UUID getId() { return id; }
    public void setId(UUID value) { id = value; }
    public AssistantInteraction getInteraction() { return interaction; }
    public void setInteraction(AssistantInteraction value) { interaction = value; }
    public int getCallOrdinal() { return callOrdinal; }
    public void setCallOrdinal(int value) { callOrdinal = value; }
    public AssistantModelCallStage getStage() { return stage; }
    public void setStage(AssistantModelCallStage value) { stage = value; }
    public Integer getGenerationAttempt() { return generationAttempt; }
    public void setGenerationAttempt(Integer value) { generationAttempt = value; }
    public String getProviderId() { return providerId; }
    public void setProviderId(String value) { providerId = value; }
    public String getConfiguredModelId() { return configuredModelId; }
    public void setConfiguredModelId(String value) { configuredModelId = value; }
    public String getReportedModelId() { return reportedModelId; }
    public void setReportedModelId(String value) { reportedModelId = value; }
    public String getPromptVersion() { return promptVersion; }
    public void setPromptVersion(String value) { promptVersion = value; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant value) { startedAt = value; }
    public Instant getFinishedAt() { return finishedAt; }
    public void setFinishedAt(Instant value) { finishedAt = value; }
    public Long getDurationMs() { return durationMs; }
    public void setDurationMs(Long value) { durationMs = value; }
    public AssistantModelCallStatus getStatus() { return status; }
    public void setStatus(AssistantModelCallStatus value) { status = value; }
    public String getFailureCode() { return failureCode; }
    public void setFailureCode(String value) { failureCode = value; }
    public Instant getCallerTimedOutAt() { return callerTimedOutAt; }
    public void setCallerTimedOutAt(Instant value) { callerTimedOutAt = value; }
    public Long getInputTokens() { return inputTokens; }
    public void setInputTokens(Long value) { inputTokens = value; }
    public Long getOutputTokens() { return outputTokens; }
    public void setOutputTokens(Long value) { outputTokens = value; }
    public Long getTotalTokens() { return totalTokens; }
    public void setTotalTokens(Long value) { totalTokens = value; }
    public String getUsageSource() { return usageSource; }
    public void setUsageSource(String value) { usageSource = value; }
}
