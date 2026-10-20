package com.github.codehive.model.dto.assistant.usage;
import java.time.Instant;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
public final class AssistantUsageDTO {
    private AssistantUsageDTO() {}
    public record Filters(Instant from, Instant to, UUID userId, UUID groupId, UUID assignmentId, String provider, String model) {}
    public record Educational(long requests, long responses, long completed, long redirected, long blocked,
            long failed, long cancelled, long pending, long activeUsers, long respondingUsers,
            long historicalUninstrumented, long regenerations, long editorOptIns, long executionOptIns,
            BigDecimal averageLatencyMs, long latencySamples, Map<String, Long> requestedLevels, Map<String, Long> deliveredLevels,
            Instant lastActivity) {}
    public record Technical(long calls, long succeeded, long failed, long uncertain, long callerTimeouts,
            Long knownInputTokens, Long knownOutputTokens, Long knownTotalTokens, long measuredCalls,
            long unknownCalls, BigDecimal coveragePercent, BigDecimal averageLatencyMs, long latencySamples) {}
    public record Daily(LocalDate day, long requests, long responses, long calls, Long knownTotalTokens) {}
    public record Policy(boolean enabled, int maximumCurrent, String level, long version) {}
    public record Summary(Instant generatedAt, Filters filters, Instant instrumentationStartedAt,
            Educational educational, Technical technical, List<Daily> trend, Policy currentPolicy, String label) {}
    public record Quota(long usedLifetime, int maximumCurrent, long pendingReservations, long remainingNow,
            boolean limitReduced, boolean enabled) {}
    public record Row(UUID id, String label, String enrollmentNumber, boolean currentParticipant,
            long requests, long responses, long unanswered, long regenerations, Instant lastActivity,
            long calls, Long knownTotalTokens, Quota quota, Policy currentPolicy) {}
    public record Breakdown(Instant generatedAt, Filters filters, Instant instrumentationStartedAt,
            com.github.codehive.model.response.PageResponse<Row> rows) {}
    public record Models(Instant generatedAt, Filters filters, Instant instrumentationStartedAt, List<ModelRow> rows) {}
    public record GroupOption(UUID id, String label, String lifecycle) {}
    public record ModelRow(String provider, String configuredModel, String reportedModel, String stage,
            Technical technical) {}
}
