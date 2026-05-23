package com.github.codehive.worker.sandbox;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("ContainerSession")
class ContainerSessionTest {

    @Test
    @DisplayName("normal session stores all fields")
    void normalSession() {
        Path dir = Path.of("/tmp/test-123");
        ContainerSession s = new ContainerSession("abc123", dir, 5000L, 256L);

        assertThat(s.getContainerId()).isEqualTo("abc123");
        assertThat(s.getTempDir()).isEqualTo(dir);
        assertThat(s.getTimeLimitMs()).isEqualTo(5000L);
        assertThat(s.getMemoryLimitMb()).isEqualTo(256L);
        assertThat(s.isCompilationFailed()).isFalse();
        assertThat(s.getCompilationError()).isNull();
    }

    @Test
    @DisplayName("compilationError() factory marks session as failed")
    void compilationError() {
        ContainerSession s = ContainerSession.compilationError("Main.java:1: error");

        assertThat(s.isCompilationFailed()).isTrue();
        assertThat(s.getCompilationError()).isEqualTo("Main.java:1: error");
        assertThat(s.getContainerId()).isNull();
        assertThat(s.getTempDir()).isNull();
    }

    @Test
    @DisplayName("compilationError() session has zero limits")
    void compilationErrorZeroLimits() {
        ContainerSession s = ContainerSession.compilationError("err");
        assertThat(s.getTimeLimitMs()).isZero();
        assertThat(s.getMemoryLimitMb()).isZero();
    }
}
