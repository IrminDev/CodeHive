package com.github.codehive.worker.sandbox;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ContainerMemoryTrackerTest {

    @Test
    void roundsPositiveBytesUpToMebibytes() {
        assertThat(ContainerMemoryTracker.bytesToMib(1L)).isEqualTo(1L);
        assertThat(ContainerMemoryTracker.bytesToMib(1024L * 1024L)).isEqualTo(1L);
        assertThat(ContainerMemoryTracker.bytesToMib(1024L * 1024L + 1L)).isEqualTo(2L);
        assertThat(ContainerMemoryTracker.bytesToMib(0L)).isNull();
    }

    @Test
    void parsesCgroupV2PeakAndOomCounters() {
        ContainerMemoryTracker.CgroupSnapshot snapshot = ContainerMemoryTracker.parseSnapshot("""
                usage=12582912
                peak=67108864
                oom=2
                oom_kill=1
                """);

        assertThat(snapshot.usageBytes()).isEqualTo(12L * 1024L * 1024L);
        assertThat(snapshot.peakBytes()).isEqualTo(64L * 1024L * 1024L);
        assertThat(snapshot.oomCount()).isEqualTo(2L);
        assertThat(snapshot.oomKillCount()).isEqualTo(1L);
    }

    @Test
    void missingKernelFieldsRemainUnavailable() {
        ContainerMemoryTracker.CgroupSnapshot snapshot =
                ContainerMemoryTracker.parseSnapshot("usage=invalid\n");

        assertThat(snapshot.usageBytes()).isEqualTo(-1L);
        assertThat(snapshot.peakBytes()).isEqualTo(-1L);
        assertThat(snapshot.failCount()).isEqualTo(-1L);
    }
}
