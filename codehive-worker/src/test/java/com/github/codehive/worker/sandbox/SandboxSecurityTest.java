package com.github.codehive.worker.sandbox;

import static org.assertj.core.api.Assertions.assertThat;

import com.github.codehive.worker.model.dto.ExecutionResult;
import com.github.codehive.worker.model.enums.ExecutionStatus;
import com.github.codehive.worker.sandbox.python.PythonExecutor;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import com.github.dockerjava.transport.DockerHttpClient;
import org.junit.jupiter.api.*;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Integration tests that run actual malicious programs inside the sandbox
 * and assert each security boundary holds. Requires Docker on the host.
 *
 * Run selectively: ./gradlew test -Dtags="security"
 */
@Tag("security")
@DisplayName("Sandbox security boundaries")
@TestMethodOrder(MethodOrderer.DisplayName.class)
class SandboxSecurityTest {

    private static DockerClient dockerClient;
    private static PythonExecutor executor;

    @BeforeAll
    static void setUp() {
        com.github.dockerjava.core.DockerClientConfig config =
                DefaultDockerClientConfig.createDefaultConfigBuilder()
                        .withDockerHost("unix:///var/run/docker.sock")
                        .build();

        DockerHttpClient httpClient = new ApacheDockerHttpClient.Builder()
                .dockerHost(config.getDockerHost())
                .maxConnections(10)
                .connectionTimeout(Duration.ofSeconds(30))
                .responseTimeout(Duration.ofSeconds(45))
                .build();

        dockerClient = DockerClientImpl.getInstance(config, httpClient);
        executor = new PythonExecutor(dockerClient);
    }

    @AfterAll
    static void tearDown() throws Exception {
        dockerClient.close();
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private ExecutionResult run(String code, long timeLimitMs, long memoryMb) throws Exception {
        ContainerSession session = executor.prepare(
                new ByteArrayInputStream(code.getBytes(StandardCharsets.UTF_8)),
                timeLimitMs, memoryMb);
        if (session.isCompilationFailed()) {
            throw new IllegalStateException("Unexpected syntax error: " + session.getCompilationError());
        }
        try {
            return executor.runTestCase(session, null);
        } finally {
            executor.cleanup(session);
        }
    }

    private ExecutionResult run(String code) throws Exception {
        return run(code, 5000L, 128L);
    }

    // ── Tests ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("CPU bomb: infinite loop → TLE")
    void infiniteLoopCausesTimeLimitExceeded() throws Exception {
        ExecutionResult result = run("while True: pass", 1000L, 128L);

        assertThat(result.getStatus()).isEqualTo(ExecutionStatus.TLE);
    }

    @Test
    @DisplayName("Memory bomb: unbounded allocation → MLE")
    void memoryBombCausesMemoryLimitExceeded() throws Exception {
        String code = """
                chunks = []
                while True:
                    chunks.append(b'\\x00' * (1024 * 1024))
                """;

        ExecutionResult result = run(code, 15000L, 64L);

        assertThat(result.getStatus()).isEqualTo(ExecutionStatus.MLE);
    }

    @Test
    @DisplayName("Fork bomb: os.fork() loop → RTE (PID limit)")
    void forkBombIsContainedByPidLimit() throws Exception {
        String code = """
                import os
                while True:
                    os.fork()
                """;

        ExecutionResult result = run(code, 5000L, 128L);

        // PID limit exhaustion causes BlockingIOError → RTE, or TLE if timeout wins first
        assertThat(result.getStatus()).isIn(ExecutionStatus.RTE, ExecutionStatus.TLE);
        // Either way, the host is unaffected — must not be AC
        assertThat(result.getStatus()).isNotEqualTo(ExecutionStatus.AC);
    }

    @Test
    @DisplayName("Network access: TCP connect → RTE (networkMode=none)")
    void networkAccessIsBlocked() throws Exception {
        String code = """
                import socket
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(3)
                s.connect(('8.8.8.8', 53))
                print('connected')
                """;

        ExecutionResult result = run(code);

        assertThat(result.getStatus()).isEqualTo(ExecutionStatus.RTE);
        assertThat(result.getOutput()).isNullOrEmpty();
    }

    @Test
    @DisplayName("Network access: UDP socket → RTE (networkMode=none)")
    void udpNetworkAccessIsBlocked() throws Exception {
        String code = """
                import socket
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.settimeout(3)
                s.sendto(b'ping', ('8.8.8.8', 53))
                print('sent')
                """;

        ExecutionResult result = run(code);

        assertThat(result.getStatus()).isEqualTo(ExecutionStatus.RTE);
        assertThat(result.getOutput()).isNullOrEmpty();
    }

    @Test
    @DisplayName("Filesystem: write to /etc → RTE (read-only rootfs)")
    void writeToRootFilesystemIsBlocked() throws Exception {
        String code = """
                with open('/etc/pwned', 'w') as f:
                    f.write('hacked')
                print('wrote')
                """;

        ExecutionResult result = run(code);

        assertThat(result.getStatus()).isEqualTo(ExecutionStatus.RTE);
        assertThat(result.getOutput()).isNullOrEmpty();
    }

    @Test
    @DisplayName("Filesystem: write via subprocess → blocked by read-only rootfs")
    void subprocessWriteIsBlocked() throws Exception {
        String code = """
                import subprocess
                r = subprocess.run(
                    ['sh', '-c', 'echo hacked > /etc/pwned'],
                    capture_output=True
                )
                print('rc:', r.returncode)
                """;

        ExecutionResult result = run(code);

        // Subprocess may fail (seccomp) or sh runs but write fails (read-only rootfs).
        // Either way, exit code of sh must be non-zero.
        if (result.getStatus() == ExecutionStatus.AC) {
            assertThat(result.getOutput())
                    .as("subprocess write to /etc must fail")
                    .doesNotContain("rc: 0");
        } else {
            assertThat(result.getStatus()).isEqualTo(ExecutionStatus.RTE);
        }
    }

    @Test
    @DisplayName("Privilege: read /etc/shadow → RTE (running as nobody)")
    void shadowFileIsUnreadable() throws Exception {
        String code = "print(open('/etc/shadow').read())";

        ExecutionResult result = run(code);

        assertThat(result.getStatus()).isEqualTo(ExecutionStatus.RTE);
        assertThat(result.getOutput()).isNullOrEmpty();
    }

    @Test
    @DisplayName("Output flood: unbounded stdout → OLE")
    void outputFloodCausesOutputLimitExceeded() throws Exception {
        String code = """
                import sys
                line = 'A' * 1000 + '\\n'
                while True:
                    sys.stdout.write(line)
                    sys.stdout.flush()
                """;

        ExecutionResult result = run(code, 60000L, 128L);

        assertThat(result.getStatus()).isEqualTo(ExecutionStatus.OLE);
    }

    @Test
    @DisplayName("memfd exec: fexecve an in-memory file → blocked (seccomp)")
    void memfdExecIsBlocked() throws Exception {
        // memfd_create + execveat is the classic bypass of `noexec` tmpfs:
        // the payload never touches the filesystem. Seccomp must block memfd_create.
        String code = """
                import ctypes, os
                libc = ctypes.CDLL(None, use_errno=True)
                fd = libc.memfd_create(b'x', 0)
                if fd < 0:
                    print('memfd_blocked')
                else:
                    os.write(fd, open('/bin/sh', 'rb').read())
                    try:
                        os.execv('/proc/self/fd/%d' % fd, ['sh', '-c', 'echo pwned'])
                    except OSError:
                        print('exec_blocked')
                """;

        ExecutionResult result = run(code);

        if (result.getStatus() == ExecutionStatus.AC) {
            assertThat(result.getOutput())
                    .as("memfd_create must be blocked so no in-memory exec is possible")
                    .doesNotContain("pwned")
                    .containsAnyOf("memfd_blocked", "exec_blocked");
        } else {
            assertThat(result.getStatus()).isEqualTo(ExecutionStatus.RTE);
        }
    }

    @Test
    @DisplayName("Limit clamp: absurd memory request is capped, not honoured")
    void oversizedMemoryLimitIsClamped() throws Exception {
        // Request 1 TB. If clamping failed, Docker would reject/OOM the host.
        // With clamping the container is created at the ceiling and runs normally.
        ExecutionResult result = run("print('ok')", 1000L, 1_000_000L);

        assertThat(result.getStatus()).isEqualTo(ExecutionStatus.AC);
        assertThat(result.getOutput()).contains("ok");
    }

    @Test
    @DisplayName("noexec /tmp: write ELF to /tmp and exec → blocked")
    void executableInTmpIsBlocked() throws Exception {
        // Copies /bin/sh into /tmp then tries to run it directly via execv.
        // noexec on tmpfs prevents the exec syscall.
        String code = """
                import shutil, os, stat
                shutil.copy('/bin/sh', '/tmp/sh_copy')
                os.chmod('/tmp/sh_copy', stat.S_IRWXU)
                try:
                    os.execv('/tmp/sh_copy', ['/tmp/sh_copy', '-c', 'echo pwned'])
                except PermissionError:
                    print('exec_blocked')
                """;

        ExecutionResult result = run(code);

        // noexec blocks execv → PermissionError is caught and "exec_blocked" is printed
        // OR the image lacks /bin/sh → RTE — both are acceptable
        if (result.getStatus() == ExecutionStatus.AC) {
            assertThat(result.getOutput())
                    .as("exec from /tmp must be blocked by noexec")
                    .contains("exec_blocked")
                    .doesNotContain("pwned");
        } else {
            assertThat(result.getStatus()).isEqualTo(ExecutionStatus.RTE);
        }
    }
}
