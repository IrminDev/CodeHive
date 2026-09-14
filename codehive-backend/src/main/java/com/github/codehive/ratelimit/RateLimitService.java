package com.github.codehive.ratelimit;

import java.time.Duration;
import java.util.Comparator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;

@Service
public class RateLimitService {
    private static final int MAX_BUCKETS = 100_000;
    private final Map<String, BucketEntry> cache = new ConcurrentHashMap<>();

    public Decision consume(String subject, String policy, int limit, long durationSeconds) {
        if (limit < 1 || durationSeconds < 1) throw new IllegalArgumentException("Rate-limit values must be positive");
        String key = policy + '|' + subject + '|' + limit + '|' + durationSeconds;
        BucketEntry entry = cache.computeIfAbsent(key, ignored -> {
            ensureCapacity();
            return new BucketEntry(createBucket(limit, durationSeconds), durationSeconds);
        });
        entry.lastAccessMillis = System.currentTimeMillis();
        ConsumptionProbe probe = entry.bucket.tryConsumeAndReturnRemaining(1);
        long retryAfter = probe.isConsumed() ? 0
                : Math.max(1, (probe.getNanosToWaitForRefill() + 999_999_999L) / 1_000_000_000L);
        return new Decision(probe.isConsumed(), probe.getRemainingTokens(), retryAfter);
    }

    public boolean tryConsume(String key, int limit, long duration) {
        return consume(key, "legacy", limit, duration).allowed();
    }

    public long getAvailableTokens(String key, int limit, long duration) {
        String cacheKey = "legacy|" + key + '|' + limit + '|' + duration;
        BucketEntry entry = cache.computeIfAbsent(cacheKey,
                ignored -> new BucketEntry(createBucket(limit, duration), duration));
        entry.lastAccessMillis = System.currentTimeMillis();
        return entry.bucket.getAvailableTokens();
    }

    @Scheduled(fixedDelayString = "${rate-limit.bucket-cleanup-ms:3600000}")
    public void cleanup() {
        long now = System.currentTimeMillis();
        cache.entrySet().removeIf(entry -> now - entry.getValue().lastAccessMillis
                > Math.max(3_600_000L, entry.getValue().durationSeconds * 2_000L));
    }

    int bucketCount() {
        return cache.size();
    }

    private void ensureCapacity() {
        if (cache.size() < MAX_BUCKETS) return;
        cache.entrySet().stream().min(Comparator.comparingLong(entry -> entry.getValue().lastAccessMillis))
                .map(Map.Entry::getKey).ifPresent(cache::remove);
    }

    private Bucket createBucket(int limit, long duration) {
        return Bucket.builder()
                .addLimit(value -> value.capacity(limit)
                        .refillIntervally(limit, Duration.ofSeconds(duration)))
                .build();
    }

    public record Decision(boolean allowed, long remaining, long retryAfterSeconds) {}

    private static final class BucketEntry {
        private final Bucket bucket;
        private final long durationSeconds;
        private volatile long lastAccessMillis = System.currentTimeMillis();

        private BucketEntry(Bucket bucket, long durationSeconds) {
            this.bucket = bucket;
            this.durationSeconds = durationSeconds;
        }
    }
}
