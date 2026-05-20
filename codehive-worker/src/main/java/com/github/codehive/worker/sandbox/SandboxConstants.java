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

    // --- Runtime limits ---
    public static final int OUTPUT_LIMIT_BYTES = 4 * 1024 * 1024;       // 4 MB
    public static final int SOURCE_SIZE_LIMIT_BYTES = 512 * 1024;        // 512 KB
    public static final int INPUT_SIZE_LIMIT_BYTES = 5 * 1024 * 1024;    // 5 MB

    // --- Compile container limits ---
    public static final int COMPILE_STDERR_LIMIT_BYTES = 256 * 1024;     // 256 KB
    public static final long COMPILE_MEMORY_BYTES = 512 * 1024 * 1024L;  // 512 MB
    public static final long COMPILE_TMPFS_BYTES = 64L * 1024 * 1024;    // 64 MB
    public static final long COMPILE_ULIMIT_FSIZE = 67108864L;           // 64 MB

    // --- Run container resource caps ---
    public static final long CPU_QUOTA = 100000L;                        // 1 CPU core
    public static final long RUN_TMPFS_BYTES = 32L * 1024 * 1024;       // 32 MB
    public static final long RUN_TMPFS_RUN_BYTES = 8L * 1024 * 1024;    // 8 MB
    public static final long RUN_ULIMIT_FSIZE = 33554432L;              // 32 MB

    // --- Seccomp profile (loaded once, shared by all executors) ---
    public static final String SECCOMP_PROFILE;

    static {
        String profile = null;
        try (InputStream is = SandboxConstants.class.getResourceAsStream("/seccomp/sandbox-profile.json")) {
            if (is != null) {
                profile = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            // Runs without seccomp if profile fails to load
        }
        SECCOMP_PROFILE = profile;
    }
}
