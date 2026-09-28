package com.github.codehive.model.request.assignment;

public final class AssignmentLimits {
    public static final long MIN_TIME_LIMIT_MS = 100L;
    public static final long MAX_TIME_LIMIT_MS = 10_000L;
    public static final long MIN_MEMORY_LIMIT_MB = 16L;
    public static final long MAX_MEMORY_LIMIT_MB = 1_000L;
    public static final int MAX_TEST_CASES = 50;

    private AssignmentLimits() {
    }
}
