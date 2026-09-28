package com.github.codehive.worker.sandbox;

import static com.github.codehive.worker.sandbox.SandboxConstants.*;
import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for the resource-limit clamping used to bound job-supplied values.
 * No Docker required.
 */
@DisplayName("SandboxConstants limit clamping")
class SandboxConstantsTest {

    @Test
    @DisplayName("clamp keeps in-range values unchanged")
    void clampKeepsInRangeValues() {
        assertThat(clamp(5000L, MIN_TIME_LIMIT_MS, MAX_TIME_LIMIT_MS)).isEqualTo(5000L);
        assertThat(clamp(256L, MIN_MEMORY_LIMIT_MB, MAX_MEMORY_LIMIT_MB)).isEqualTo(256L);
    }

    @Test
    @DisplayName("clamp caps values above the maximum")
    void clampCapsHighValues() {
        assertThat(clamp(10_000_000L, MIN_TIME_LIMIT_MS, MAX_TIME_LIMIT_MS)).isEqualTo(MAX_TIME_LIMIT_MS);
        // e.g. the historical 262 GB request must be capped to the hard memory ceiling
        assertThat(clamp(262_000L, MIN_MEMORY_LIMIT_MB, MAX_MEMORY_LIMIT_MB)).isEqualTo(MAX_MEMORY_LIMIT_MB);
    }

    @Test
    @DisplayName("clamp raises values below the minimum")
    void clampRaisesLowValues() {
        assertThat(clamp(0L, MIN_TIME_LIMIT_MS, MAX_TIME_LIMIT_MS)).isEqualTo(MIN_TIME_LIMIT_MS);
        assertThat(clamp(-1L, MIN_MEMORY_LIMIT_MB, MAX_MEMORY_LIMIT_MB)).isEqualTo(MIN_MEMORY_LIMIT_MB);
    }

    @Test
    @DisplayName("bounds are internally consistent")
    void boundsAreConsistent() {
        assertThat(MIN_TIME_LIMIT_MS).isLessThan(MAX_TIME_LIMIT_MS);
        assertThat(MIN_MEMORY_LIMIT_MB).isLessThan(MAX_MEMORY_LIMIT_MB);
        assertThat(MAX_TIME_LIMIT_MS).isEqualTo(10_000L);
        assertThat(MAX_MEMORY_LIMIT_MB).isEqualTo(1_000L);
        assertThat(MAX_TEST_CASES).isEqualTo(50);
        assertThat(OUTPUT_LIMIT_BYTES).isEqualTo(8 * 1024 * 1024);
    }
}
