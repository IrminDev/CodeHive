package com.github.codehive.ratelimit;

public class RateLimitExceededException extends RuntimeException {
    private final String policy;
    private final int limit;
    private final long retryAfterSeconds;

    public RateLimitExceededException(String message, String policy, int limit, long retryAfterSeconds) {
        super(message);
        this.policy = policy;
        this.limit = limit;
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public String getPolicy() { return policy; }
    public int getLimit() { return limit; }
    public long getRetryAfterSeconds() { return retryAfterSeconds; }
}
