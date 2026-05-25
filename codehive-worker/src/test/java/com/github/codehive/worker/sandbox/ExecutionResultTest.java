package com.github.codehive.worker.sandbox;

import static org.assertj.core.api.Assertions.assertThat;

import com.github.codehive.worker.model.dto.ExecutionResult;
import com.github.codehive.worker.model.enums.ExecutionStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("ExecutionResult factory methods")
class ExecutionResultTest {

    @Nested
    @DisplayName("success()")
    class Success {
        @Test
        void setsStatusAC() {
            ExecutionResult r = ExecutionResult.success("8\n", 123L, 10L);
            assertThat(r.getStatus()).isEqualTo(ExecutionStatus.AC);
        }

        @Test
        void storesOutputAndTimingAndMemory() {
            ExecutionResult r = ExecutionResult.success("hello", 200L, 50L);
            assertThat(r.getOutput()).isEqualTo("hello");
            assertThat(r.getExecutionTimeMs()).isEqualTo(200L);
            assertThat(r.getMemoryUsedMb()).isEqualTo(50L);
            assertThat(r.getExitCode()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("timeLimitExceeded()")
    class TLE {
        @Test
        void setsStatusTLE() {
            ExecutionResult r = ExecutionResult.timeLimitExceeded(5000L);
            assertThat(r.getStatus()).isEqualTo(ExecutionStatus.TLE);
            assertThat(r.getExecutionTimeMs()).isEqualTo(5000L);
        }
    }

    @Nested
    @DisplayName("memoryLimitExceeded()")
    class MLE {
        @Test
        void setsStatusMLE() {
            ExecutionResult r = ExecutionResult.memoryLimitExceeded(256L);
            assertThat(r.getStatus()).isEqualTo(ExecutionStatus.MLE);
        }

        @Test
        void reportsMemoryInMbNotKb() {
            // Regression: previously multiplied by 1024, reporting 262144 instead of 256
            ExecutionResult r = ExecutionResult.memoryLimitExceeded(256L);
            assertThat(r.getMemoryUsedMb())
                    .as("memoryUsedMb must be in MB — not KB or bytes")
                    .isEqualTo(256L);
        }
    }

    @Nested
    @DisplayName("runtimeError()")
    class RTE {
        @Test
        void setsStatusRTE() {
            ExecutionResult r = ExecutionResult.runtimeError("SIGSEGV", 139, 312L);
            assertThat(r.getStatus()).isEqualTo(ExecutionStatus.RTE);
            assertThat(r.getErrorOutput()).isEqualTo("SIGSEGV");
            assertThat(r.getExitCode()).isEqualTo(139);
            assertThat(r.getExecutionTimeMs()).isEqualTo(312L);
        }
    }

    @Nested
    @DisplayName("compilationError()")
    class CE {
        @Test
        void setsStatusCE() {
            ExecutionResult r = ExecutionResult.compilationError("Main.java:3: error: ';' expected");
            assertThat(r.getStatus()).isEqualTo(ExecutionStatus.CE);
            assertThat(r.getCompilationError()).contains("';' expected");
        }
    }

    @Nested
    @DisplayName("outputLimitExceeded()")
    class OLE {
        @Test
        void setsStatusOLE() {
            ExecutionResult r = ExecutionResult.outputLimitExceeded("truncated...", 1500L);
            assertThat(r.getStatus()).isEqualTo(ExecutionStatus.OLE);
            assertThat(r.getOutput()).isEqualTo("truncated...");
            assertThat(r.getExecutionTimeMs()).isEqualTo(1500L);
        }
    }
}
