package com.github.codehive.worker.model;

import static org.assertj.core.api.Assertions.assertThat;

import com.github.codehive.worker.model.dto.ExecutionReport;
import com.github.codehive.worker.model.dto.TestCaseResult;
import com.github.codehive.worker.model.enums.ExecutionStatus;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("ExecutionReport")
class ExecutionReportTest {

    private static TestCaseResult tcr(ExecutionStatus status, Long timeMs, Long memMb) {
        TestCaseResult r = new TestCaseResult();
        r.setStatus(status);
        r.setExecutionTimeMs(timeMs);
        r.setMemoryUsedMb(memMb);
        return r;
    }

    // ── Constructor ───────────────────────────────────────────────────────

    @Test
    @DisplayName("no-arg constructor initialises empty list")
    void noArgConstructor() {
        ExecutionReport report = new ExecutionReport();
        assertThat(report.getTestCaseResults()).isEmpty();
        assertThat(report.getTotalTests()).isZero();
    }

    @Test
    @DisplayName("UUID constructor stores executionId")
    void uuidConstructor() {
        UUID id = UUID.randomUUID();
        ExecutionReport report = new ExecutionReport(id);
        assertThat(report.getExecutionId()).isEqualTo(id);
    }

    // ── addTestCaseResult() / statistics ─────────────────────────────────

    @Nested
    @DisplayName("addTestCaseResult()")
    class AddTestCase {

        @Test
        @DisplayName("AC increments passedTests")
        void acIncrementsPassedTests() {
            ExecutionReport report = new ExecutionReport();
            report.addTestCaseResult(tcr(ExecutionStatus.AC, 100L, 10L));
            assertThat(report.getPassedTests()).isEqualTo(1);
            assertThat(report.getFailedTests()).isZero();
            assertThat(report.getTotalTests()).isEqualTo(1);
        }

        @Test
        @DisplayName("non-AC increments failedTests")
        void nonAcIncrementsFailedTests() {
            ExecutionReport report = new ExecutionReport();
            report.addTestCaseResult(tcr(ExecutionStatus.WA, 200L, 10L));
            assertThat(report.getFailedTests()).isEqualTo(1);
            assertThat(report.getPassedTests()).isZero();
        }

        @Test
        @DisplayName("totalExecutionTimeMs sums across test cases")
        void totalTimeAccumulates() {
            ExecutionReport report = new ExecutionReport();
            report.addTestCaseResult(tcr(ExecutionStatus.AC, 100L, 10L));
            report.addTestCaseResult(tcr(ExecutionStatus.AC, 200L, 10L));
            assertThat(report.getTotalExecutionTimeMs()).isEqualTo(300L);
        }

        @Test
        @DisplayName("maxExecutionTimeMs tracks highest value")
        void maxTimeTracked() {
            ExecutionReport report = new ExecutionReport();
            report.addTestCaseResult(tcr(ExecutionStatus.AC, 50L, 10L));
            report.addTestCaseResult(tcr(ExecutionStatus.AC, 300L, 10L));
            report.addTestCaseResult(tcr(ExecutionStatus.AC, 100L, 10L));
            assertThat(report.getMaxExecutionTimeMs()).isEqualTo(300L);
        }

        @Test
        @DisplayName("maxMemoryUsedMb tracks highest value")
        void maxMemoryTracked() {
            ExecutionReport report = new ExecutionReport();
            report.addTestCaseResult(tcr(ExecutionStatus.AC, 100L, 64L));
            report.addTestCaseResult(tcr(ExecutionStatus.AC, 100L, 128L));
            report.addTestCaseResult(tcr(ExecutionStatus.AC, 100L, 32L));
            assertThat(report.getMaxMemoryUsedMb()).isEqualTo(128L);
        }

        @Test
        @DisplayName("null time and memory do not update stats")
        void nullTimeAndMemoryIgnored() {
            ExecutionReport report = new ExecutionReport();
            report.addTestCaseResult(tcr(ExecutionStatus.AC, null, null));
            assertThat(report.getTotalExecutionTimeMs()).isNull();
            assertThat(report.getMaxMemoryUsedMb()).isNull();
        }
    }

    // ── determineOverallStatus() ──────────────────────────────────────────

    @Nested
    @DisplayName("determineOverallStatus()")
    class DetermineOverallStatus {

        @Test
        @DisplayName("compilationError set → CE regardless of test results")
        void compilationError() {
            ExecutionReport report = new ExecutionReport();
            report.setCompilationError("Main.java:3: error");
            report.determineOverallStatus();
            assertThat(report.getOverallStatus()).isEqualTo(ExecutionStatus.CE);
        }

        @Test
        @DisplayName("empty test list → AC")
        void emptyListIsAC() {
            ExecutionReport report = new ExecutionReport();
            report.determineOverallStatus();
            assertThat(report.getOverallStatus()).isEqualTo(ExecutionStatus.AC);
        }

        @Test
        @DisplayName("all AC → AC")
        void allAC() {
            ExecutionReport report = new ExecutionReport();
            report.addTestCaseResult(tcr(ExecutionStatus.AC, 100L, 10L));
            report.addTestCaseResult(tcr(ExecutionStatus.AC, 200L, 10L));
            report.determineOverallStatus();
            assertThat(report.getOverallStatus()).isEqualTo(ExecutionStatus.AC);
        }

        @Test
        @DisplayName("only WA → WA")
        void onlyWA() {
            ExecutionReport report = new ExecutionReport();
            report.addTestCaseResult(tcr(ExecutionStatus.WA, 100L, 10L));
            report.determineOverallStatus();
            assertThat(report.getOverallStatus()).isEqualTo(ExecutionStatus.WA);
        }

        @Test
        @DisplayName("TLE present → TLE (highest priority)")
        void tleHighestPriority() {
            ExecutionReport report = new ExecutionReport();
            report.addTestCaseResult(tcr(ExecutionStatus.WA, 100L, 10L));
            report.addTestCaseResult(tcr(ExecutionStatus.MLE, 100L, 300L));
            report.addTestCaseResult(tcr(ExecutionStatus.TLE, 5000L, 10L));
            report.determineOverallStatus();
            assertThat(report.getOverallStatus()).isEqualTo(ExecutionStatus.TLE);
        }

        @Test
        @DisplayName("MLE without TLE → MLE")
        void mleBeforeOleAndRte() {
            ExecutionReport report = new ExecutionReport();
            report.addTestCaseResult(tcr(ExecutionStatus.OLE, 100L, 10L));
            report.addTestCaseResult(tcr(ExecutionStatus.MLE, 100L, 300L));
            report.addTestCaseResult(tcr(ExecutionStatus.RTE, 50L, 10L));
            report.determineOverallStatus();
            assertThat(report.getOverallStatus()).isEqualTo(ExecutionStatus.MLE);
        }

        @Test
        @DisplayName("OLE without TLE/MLE → OLE")
        void oleBeforeRte() {
            ExecutionReport report = new ExecutionReport();
            report.addTestCaseResult(tcr(ExecutionStatus.RTE, 50L, 10L));
            report.addTestCaseResult(tcr(ExecutionStatus.OLE, 100L, 10L));
            report.determineOverallStatus();
            assertThat(report.getOverallStatus()).isEqualTo(ExecutionStatus.OLE);
        }

        @Test
        @DisplayName("RTE without TLE/MLE/OLE → RTE")
        void rteBeforeWa() {
            ExecutionReport report = new ExecutionReport();
            report.addTestCaseResult(tcr(ExecutionStatus.WA, 100L, 10L));
            report.addTestCaseResult(tcr(ExecutionStatus.RTE, 50L, 10L));
            report.determineOverallStatus();
            assertThat(report.getOverallStatus()).isEqualTo(ExecutionStatus.RTE);
        }

        @Test
        @DisplayName("mixed AC and WA → WA")
        void mixedAcAndWa() {
            ExecutionReport report = new ExecutionReport();
            report.addTestCaseResult(tcr(ExecutionStatus.AC, 100L, 10L));
            report.addTestCaseResult(tcr(ExecutionStatus.WA, 100L, 10L));
            report.determineOverallStatus();
            assertThat(report.getOverallStatus()).isEqualTo(ExecutionStatus.WA);
        }
    }
}
