package com.github.codehive.worker.sandbox;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Frame;
import com.github.dockerjava.api.model.MemoryStatsConfig;
import com.github.dockerjava.api.model.Statistics;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Collects trusted container memory telemetry while one test case executes.
 *
 * Docker stats supplies live usage. Cgroup peak/events snapshots supply an exact
 * submission-session peak and OOM evidence on cgroup v2, where Docker omits
 * {@code max_usage} and {@code failcnt}.
 */
final class ContainerMemoryTracker implements AutoCloseable {
    private static final Logger logger = LoggerFactory.getLogger(ContainerMemoryTracker.class);
    private static final long BYTES_PER_MIB = 1024L * 1024L;
    private static final int SNAPSHOT_OUTPUT_LIMIT = 4096;
    private static final String CGROUP_SNAPSHOT_COMMAND = """
            if [ -r /sys/fs/cgroup/memory.current ]; then
              printf 'usage='; cat /sys/fs/cgroup/memory.current
              printf 'peak='; cat /sys/fs/cgroup/memory.peak
              awk '/^oom / {print "oom=" $2} /^oom_kill / {print "oom_kill=" $2}' /sys/fs/cgroup/memory.events
            elif [ -r /sys/fs/cgroup/memory/memory.usage_in_bytes ]; then
              printf 'usage='; cat /sys/fs/cgroup/memory/memory.usage_in_bytes
              printf 'peak='; cat /sys/fs/cgroup/memory/memory.max_usage_in_bytes
              printf 'fail='; cat /sys/fs/cgroup/memory/memory.failcnt
            fi
            """;

    private final DockerClient dockerClient;
    private final String containerId;
    private final CgroupSnapshot before;
    private final AtomicLong maxLiveUsageBytes = new AtomicLong(-1L);
    private final AtomicLong maxDockerPeakBytes = new AtomicLong(-1L);
    private final AtomicLong firstFailCount = new AtomicLong(-1L);
    private final AtomicLong latestFailCount = new AtomicLong(-1L);
    private final ResultCallback.Adapter<Statistics> statsCallback;
    private boolean stopped;

    private ContainerMemoryTracker(DockerClient dockerClient, String containerId) {
        this.dockerClient = dockerClient;
        this.containerId = containerId;
        this.before = readCgroupSnapshot();
        this.statsCallback = new ResultCallback.Adapter<>() {
            @Override
            public void onNext(Statistics statistics) {
                record(statistics);
            }

            @Override
            public void onError(Throwable throwable) {
                logger.debug("Docker memory stats stream failed for container {}", containerId, throwable);
            }
        };

        try {
            dockerClient.statsCmd(containerId)
                    .withNoStream(false)
                    .exec(statsCallback);
        } catch (Exception exception) {
            logger.debug("Could not start Docker memory stats for container {}", containerId, exception);
        }
    }

    static ContainerMemoryTracker start(DockerClient dockerClient, String containerId) {
        return new ContainerMemoryTracker(dockerClient, containerId);
    }

    synchronized MemoryMeasurement stop() {
        if (stopped) return MemoryMeasurement.empty();
        stopped = true;
        closeStatsCallback();

        CgroupSnapshot after = readCgroupSnapshot();
        long sessionPeakBytes = maxPositive(after.peakBytes(), maxDockerPeakBytes.get());
        long livePeakBytes = maxLiveUsageBytes.get();

        // If this test raised the cgroup's cumulative peak, that value is its
        // exact peak. Otherwise retain best live Docker observation.
        if (after.peakBytes() > before.peakBytes()) {
            livePeakBytes = Math.max(livePeakBytes, after.peakBytes());
        }

        boolean oomDetected = increased(after.oomCount(), before.oomCount())
                || increased(after.oomKillCount(), before.oomKillCount())
                || increased(after.failCount(), before.failCount())
                || increased(latestFailCount.get(), firstFailCount.get());

        return new MemoryMeasurement(
                bytesToMib(livePeakBytes),
                bytesToMib(sessionPeakBytes),
                oomDetected);
    }

    @Override
    public void close() {
        stop();
    }

    static Long bytesToMib(long bytes) {
        if (bytes <= 0) return null;
        return Math.max(1L, (bytes + BYTES_PER_MIB - 1L) / BYTES_PER_MIB);
    }

    static CgroupSnapshot parseSnapshot(String output) {
        Map<String, Long> values = new HashMap<>();
        if (output != null) {
            for (String line : output.split("\\R")) {
                int separator = line.indexOf('=');
                if (separator <= 0) continue;
                try {
                    values.put(line.substring(0, separator).trim(),
                            Long.parseLong(line.substring(separator + 1).trim()));
                } catch (NumberFormatException ignored) {
                    // Ignore malformed/missing kernel counters; telemetry is best effort.
                }
            }
        }
        return new CgroupSnapshot(
                values.getOrDefault("usage", -1L),
                values.getOrDefault("peak", -1L),
                values.getOrDefault("oom", -1L),
                values.getOrDefault("oom_kill", -1L),
                values.getOrDefault("fail", -1L));
    }

    private void record(Statistics statistics) {
        if (statistics == null) return;
        MemoryStatsConfig memory = statistics.getMemoryStats();
        if (memory == null) return;

        updateMax(maxLiveUsageBytes, memory.getUsage());
        updateMax(maxDockerPeakBytes, memory.getMaxUsage());
        Long failCount = memory.getFailcnt();
        if (failCount != null) {
            firstFailCount.compareAndSet(-1L, failCount);
            latestFailCount.set(failCount);
        }
    }

    private CgroupSnapshot readCgroupSnapshot() {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try {
            String execId = dockerClient.execCreateCmd(containerId)
                    .withAttachStdout(true)
                    .withAttachStderr(false)
                    .withWorkingDir("/workspace")
                    .withUser("nobody")
                    .withCmd("sh", "-c", CGROUP_SNAPSHOT_COMMAND)
                    .exec()
                    .getId();

            dockerClient.execStartCmd(execId)
                    .exec(new ResultCallback.Adapter<Frame>() {
                        @Override
                        public void onNext(Frame frame) {
                            byte[] payload = frame.getPayload();
                            if (payload == null || output.size() >= SNAPSHOT_OUTPUT_LIMIT) return;
                            int length = Math.min(payload.length, SNAPSHOT_OUTPUT_LIMIT - output.size());
                            output.write(payload, 0, length);
                        }
                    })
                    .awaitCompletion(2, TimeUnit.SECONDS);
        } catch (Exception exception) {
            logger.debug("Could not read cgroup memory snapshot for container {}", containerId, exception);
        }
        return parseSnapshot(output.toString(StandardCharsets.UTF_8));
    }

    private void closeStatsCallback() {
        try {
            statsCallback.close();
        } catch (IOException exception) {
            logger.debug("Could not close Docker memory stats for container {}", containerId, exception);
        }
    }

    private static void updateMax(AtomicLong target, Long candidate) {
        if (candidate != null && candidate > 0) {
            target.accumulateAndGet(candidate, Math::max);
        }
    }

    private static long maxPositive(long first, long second) {
        return Math.max(first, second);
    }

    private static boolean increased(long after, long before) {
        return after >= 0 && before >= 0 && after > before;
    }

    record MemoryMeasurement(Long testPeakMemoryMb, Long sessionPeakMemoryMb, boolean oomDetected) {
        static MemoryMeasurement empty() {
            return new MemoryMeasurement(null, null, false);
        }
    }

    record CgroupSnapshot(long usageBytes, long peakBytes, long oomCount,
                          long oomKillCount, long failCount) {
        static CgroupSnapshot empty() {
            return new CgroupSnapshot(-1L, -1L, -1L, -1L, -1L);
        }
    }
}
