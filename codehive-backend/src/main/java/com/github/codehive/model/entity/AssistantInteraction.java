package com.github.codehive.model.entity;

import java.time.Instant;
import java.util.UUID;

import com.github.codehive.model.enums.AssistantInteractionStatus;
import com.github.codehive.model.enums.Language;
import com.github.codehive.model.enums.AiAssistanceLevel;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "assistant_interactions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"conversation_id", "client_request_id"}),
        @UniqueConstraint(columnNames = {"conversation_id", "sequence_number"})
})
public class AssistantInteraction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private AssistantConversation conversation;

    @Column(name = "sequence_number", nullable = false)
    private long sequence;

    @Column(name = "client_request_id", nullable = false)
    private UUID clientRequestId;

    @Column(length = 64, nullable = false)
    private String requestFingerprint;

    @Column(columnDefinition = "TEXT")
    private String studentMessage;

    @Column(columnDefinition = "TEXT")
    private String assistantResponse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AssistantInteractionStatus status = AssistantInteractionStatus.PENDING;

    @Column(nullable = false)
    private boolean quotaCharged;

    @Column(nullable = false)
    private boolean contentErased;

    @Column(length = 60)
    private String failureCode;

    @Column(nullable = false)
    private long requestedPolicyVersion;

    private Long completedPolicyVersion;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private AiAssistanceLevel completedAssistanceLevel;

    @Column(nullable = false)
    private boolean editorContextIncluded;

    @Column(nullable = false)
    private boolean executionContextIncluded;

    private UUID executionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Language language;

    @Column(nullable = false)
    private int generationAttempts;

    @Column(length = 100)
    private String providerId;
    @Column(length = 150)
    private String modelId;
    private Integer inputTokens;
    private Integer outputTokens;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
    private Instant completedAt;
    private Instant leaseExpiresAt;

    public UUID getId() { return id; }
    public AssistantConversation getConversation() { return conversation; }
    public void setConversation(AssistantConversation conversation) { this.conversation = conversation; }
    public long getSequence() { return sequence; }
    public void setSequence(long sequence) { this.sequence = sequence; }
    public UUID getClientRequestId() { return clientRequestId; }
    public void setClientRequestId(UUID clientRequestId) { this.clientRequestId = clientRequestId; }
    public String getRequestFingerprint() { return requestFingerprint; }
    public void setRequestFingerprint(String requestFingerprint) { this.requestFingerprint = requestFingerprint; }
    public String getStudentMessage() { return studentMessage; }
    public void setStudentMessage(String studentMessage) { this.studentMessage = studentMessage; }
    public String getAssistantResponse() { return assistantResponse; }
    public void setAssistantResponse(String assistantResponse) { this.assistantResponse = assistantResponse; }
    public AssistantInteractionStatus getStatus() { return status; }
    public void setStatus(AssistantInteractionStatus status) { this.status = status; }
    public boolean isQuotaCharged() { return quotaCharged; }
    public void setQuotaCharged(boolean quotaCharged) { this.quotaCharged = quotaCharged; }
    public boolean isContentErased() { return contentErased; }
    public void setContentErased(boolean contentErased) { this.contentErased = contentErased; }
    public String getFailureCode() { return failureCode; }
    public void setFailureCode(String failureCode) { this.failureCode = failureCode; }
    public long getRequestedPolicyVersion() { return requestedPolicyVersion; }
    public void setRequestedPolicyVersion(long requestedPolicyVersion) { this.requestedPolicyVersion = requestedPolicyVersion; }
    public Long getCompletedPolicyVersion() { return completedPolicyVersion; }
    public void setCompletedPolicyVersion(Long completedPolicyVersion) { this.completedPolicyVersion = completedPolicyVersion; }
    public AiAssistanceLevel getCompletedAssistanceLevel() { return completedAssistanceLevel; }
    public void setCompletedAssistanceLevel(AiAssistanceLevel level) { this.completedAssistanceLevel = level; }
    public boolean isEditorContextIncluded() { return editorContextIncluded; }
    public void setEditorContextIncluded(boolean editorContextIncluded) { this.editorContextIncluded = editorContextIncluded; }
    public boolean isExecutionContextIncluded() { return executionContextIncluded; }
    public void setExecutionContextIncluded(boolean executionContextIncluded) { this.executionContextIncluded = executionContextIncluded; }
    public UUID getExecutionId() { return executionId; }
    public void setExecutionId(UUID executionId) { this.executionId = executionId; }
    public Language getLanguage() { return language; }
    public void setLanguage(Language language) { this.language = language; }
    public int getGenerationAttempts() { return generationAttempts; }
    public void setGenerationAttempts(int generationAttempts) { this.generationAttempts = generationAttempts; }
    public String getProviderId() { return providerId; }
    public void setProviderId(String providerId) { this.providerId = providerId; }
    public String getModelId() { return modelId; }
    public void setModelId(String modelId) { this.modelId = modelId; }
    public Integer getInputTokens() { return inputTokens; }
    public void setInputTokens(Integer inputTokens) { this.inputTokens = inputTokens; }
    public Integer getOutputTokens() { return outputTokens; }
    public void setOutputTokens(Integer outputTokens) { this.outputTokens = outputTokens; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    public Instant getLeaseExpiresAt() { return leaseExpiresAt; }
    public void setLeaseExpiresAt(Instant leaseExpiresAt) { this.leaseExpiresAt = leaseExpiresAt; }
}
