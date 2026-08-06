package com.github.codehive.worker.sandbox;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Centralised constants for the sandbox execution environment.
 * Every executor references these values instead of declaring local copies.
 */
public final class SandboxConstants {

    private SandboxConstants() {}

    // --- Default limits (used when the job does not specify values) ---
    public static final long DEFAULT_TIME_LIMIT_MS = 5000L;
    public static final long DEFAULT_MEMORY_LIMIT_MB = 256L;

    // --- Hard bounds on job-supplied limits (defence in depth) ---
    // Even though jobs arrive from the trusted backend, clamp untrusted-shaped
    // values so a malformed or malicious job cannot exhaust the host.
    public static final long MIN_TIME_LIMIT_MS = 100L;
    public static final long MAX_TIME_LIMIT_MS = 30_000L;          // 30 s
    public static final long MIN_MEMORY_LIMIT_MB = 16L;
    public static final long MAX_MEMORY_LIMIT_MB = 512L;           // 512 MB
    public static final int MAX_TEST_CASES = 200;                  // per job

    // --- Runtime limits ---
    public static final int OUTPUT_LIMIT_BYTES = 4 * 1024 * 1024;       // 4 MB
    public static final int SOURCE_SIZE_LIMIT_BYTES = 512 * 1024;        // 512 KB
    public static final int INPUT_SIZE_LIMIT_BYTES = 5 * 1024 * 1024;    // 5 MB

    // --- Compile container limits ---
    public static final int COMPILE_STDERR_LIMIT_BYTES = 256 * 1024;     // 256 KB
    public static final long COMPILE_MEMORY_BYTES = 512 * 1024 * 1024L;  // 512 MB

    // --- Run container resource caps ---
    public static final long CPU_QUOTA = 100000L;                        // 1 CPU core

    // --- TmpFs mount options (used as Map values for withTmpFs) ---
    public static final String RUN_TMPFS_TMP = "size=33554432,noexec,nosuid,mode=1777";   // 32 MB
    public static final String RUN_TMPFS_RUN = "size=8388608,noexec,nosuid,mode=755";     // 8 MB
    public static final String COMPILE_TMPFS_TMP = "size=67108864,noexec,nosuid,mode=1777"; // 64 MB
    public static final String COMPILE_TMPFS_RUN = "size=8388608,noexec,nosuid,mode=755";   // 8 MB

    // --- Ulimit values ---
    public static final long RUN_ULIMIT_FSIZE = 33554432L;              // 32 MB
    public static final long COMPILE_ULIMIT_FSIZE = 67108864L;          // 64 MB
    public static final long RUN_ULIMIT_NOFILE = 256L;                 // open fds (run)
    public static final long COMPILE_ULIMIT_NOFILE = 1024L;            // open fds (compile)

    /** Clamp a value into [min, max]. */
    public static long clamp(long value, long min, long max) {
        return Math.max(min, Math.min(max, value));
    }

    // --- Seccomp profile (loaded once, shared by all executors) ---
    public static final String SECCOMP_PROFILE;

    static {
        // Fail closed: the sandbox must never start with a weaker profile than
        // intended. A missing/unreadable profile is a fatal misconfiguration.
        try (InputStream is = SandboxConstants.class.getResourceAsStream("/seccomp/sandbox-profile.json")) {
            if (is == null) {
                throw new IllegalStateException("Seccomp profile /seccomp/sandbox-profile.json not found on classpath");
            }
            String profile = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            if (profile.isBlank()) {
                throw new IllegalStateException("Seccomp profile is empty");
            }
            SECCOMP_PROFILE = profile;
        } catch (Exception e) {
            throw new ExceptionInInitializerError(e);
        }
    }
}
