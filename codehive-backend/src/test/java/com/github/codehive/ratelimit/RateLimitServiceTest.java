package com.github.codehive.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class RateLimitServiceTest {
    @Test
    void policiesAndSubjectsUseIndependentBuckets() {
        RateLimitService service = new RateLimitService();

        assertThat(service.consume("user:1", "login", 1, 60).allowed()).isTrue();
        assertThat(service.consume("user:1", "login", 1, 60).allowed()).isFalse();
        assertThat(service.consume("user:1", "report", 1, 60).allowed()).isTrue();
        assertThat(service.consume("user:2", "login", 1, 60).allowed()).isTrue();
    }

    @Test
    void rejectionReturnsPositiveRetryAfter() {
        RateLimitService service = new RateLimitService();
        service.consume("user:1", "execution", 1, 60);

        RateLimitService.Decision rejected = service.consume("user:1", "execution", 1, 60);

        assertThat(rejected.allowed()).isFalse();
        assertThat(rejected.retryAfterSeconds()).isPositive();
    }
}
