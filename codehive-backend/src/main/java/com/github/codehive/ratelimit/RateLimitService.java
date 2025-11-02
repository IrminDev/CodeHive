package com.github.codehive.ratelimit;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import io.github.bucket4j.Bucket;

@Service
public class RateLimitService {
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    /**
     * Resolve a bucket for the given key (typically IP address or user ID)
     * 
     * @param key The unique identifier (IP or user)
     * @param limit Maximum number of requests
     * @param duration Time window in seconds
     * @return Bucket for rate limiting
     */
    public Bucket resolveBucket(String key, int limit, long duration) {
        return cache.computeIfAbsent(key, _ -> createNewBucket(limit, duration));
    }

    /**
     * Check if a request is allowed for the given key
     * 
     * @param key The unique identifier
     * @param limit Maximum number of requests
     * @param duration Time window in seconds
     * @return true if request is allowed, false if rate limit exceeded
     */
    public boolean tryConsume(String key, int limit, long duration) {
        Bucket bucket = resolveBucket(key, limit, duration);
        return bucket.tryConsume(1);
    }

    /**
     * Get the number of available tokens for a key
     * 
     * @param key The unique identifier
     * @param limit Maximum number of requests
     * @param duration Time window in seconds
     * @return Number of available tokens
     */
    public long getAvailableTokens(String key, int limit, long duration) {
        Bucket bucket = resolveBucket(key, limit, duration);
        return bucket.getAvailableTokens();
    }

    private Bucket createNewBucket(int limit, long duration) {
        return Bucket.builder()
                .addLimit(lim -> lim.capacity(1L*limit).refillIntervally(1L*limit, Duration.ofSeconds(duration)))
                .build();
    }
}
