package com.github.codehive.worker.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import com.github.codehive.worker.model.dto.ExecutionResult;
import com.github.codehive.worker.model.dto.queue.TestCaseInfo;
import com.github.codehive.worker.model.dto.queue.TestGenerationJob;
import com.github.codehive.worker.model.dto.queue.TestGenerationResult;
import com.github.codehive.worker.model.enums.ComparatorType;
import com.github.codehive.worker.model.enums.ExecutionStatus;
import com.github.codehive.worker.model.enums.Language;
import com.github.codehive.worker.sandbox.ContainerSession;
import com.github.codehive.worker.sandbox.LanguageExecutor;
import com.github.codehive.worker.sandbox.factory.LanguageExecutorFactory;

class TestGenerationServiceTest {
    private static final UUID ASSIGNMENT_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID UPDATE_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID REFERENCE_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final UUID TEST_CASE_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000004");

    @Test
    void rejectsReferenceOnlyUpdateWhenObservableOutputChanges() throws Exception {
        LanguageExecutorFactory factory = mock(LanguageExecutorFactory.class);
        ObjectStorageService storage = mock(ObjectStorageService.class);
        LanguageExecutor executor = mock(LanguageExecutor.class);
        when(factory.getExecutor(Language.JAVA)).thenReturn(executor);
        when(storage.download("candidate-reference")).thenReturn(stream("source"));
        when(storage.download("active-input")).thenReturn(stream("input"));
        when(storage.download("active-expected")).thenReturn(stream("expected\n"));
        when(executor.prepare(any(), any(), any()))
                .thenReturn(new ContainerSession("container", null, 1000, 128));
        when(executor.runTestCase(any(), any()))
                .thenReturn(ExecutionResult.success("different\n", 1L, 1L));

        TestCaseInfo testCase = new TestCaseInfo(
                TEST_CASE_ID, "active-input", "candidate-output");
        testCase.setBaselineOutputPath("active-expected");
        TestGenerationJob job = new TestGenerationJob();
        job.setAssignmentId(ASSIGNMENT_ID);
        job.setAssignmentUpdateId(UPDATE_ID);
        job.setReferenceSolutionRevisionId(REFERENCE_ID);
        job.setReferenceSolutionPath("candidate-reference");
        job.setReferenceLanguage(Language.JAVA);
        job.setTestCases(List.of(testCase));
        job.setTimeLimitMs(1000L);
        job.setMemoryLimitMb(128L);
        job.setComparatorType(ComparatorType.EXACT_MATCH);

        TestGenerationResult result = new TestGenerationService(
                factory, storage, new OutputComparatorService()).generateOutputs(job);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorMessage()).contains("output changed on test case 1 of 1",
                "does not match the existing expected output", "assignment comparator");
        assertThat(result.getAssignmentUpdateId()).isEqualTo(UPDATE_ID);
        assertThat(result.getReferenceSolutionRevisionId()).isEqualTo(REFERENCE_ID);
        verify(storage, never()).upload("candidate-output", "different\n");
    }

    @Test
    void includesSafeRuntimeDiagnosticWhenReferenceFails() throws Exception {
        LanguageExecutorFactory factory = mock(LanguageExecutorFactory.class);
        ObjectStorageService storage = mock(ObjectStorageService.class);
        LanguageExecutor executor = mock(LanguageExecutor.class);
        when(factory.getExecutor(Language.JAVA)).thenReturn(executor);
        when(storage.download("reference")).thenReturn(stream("source"));
        when(storage.download("input")).thenReturn(stream("input"));
        when(executor.prepare(any(), any(), any()))
                .thenReturn(new ContainerSession("container", null, 1000, 64));
        ExecutionResult memoryError = ExecutionResult.memoryLimitExceeded(64L);
        memoryError.setErrorOutput("\u001B[31mjava.lang.OutOfMemoryError: Java heap space\u0000");
        memoryError.setExitCode(1);
        when(executor.runTestCase(any(), any())).thenReturn(memoryError);

        TestCaseInfo testCase = new TestCaseInfo(TEST_CASE_ID, "input", "output");
        TestGenerationJob job = new TestGenerationJob();
        job.setAssignmentId(ASSIGNMENT_ID);
        job.setReferenceSolutionPath("reference");
        job.setReferenceLanguage(Language.JAVA);
        job.setTestCases(List.of(testCase));
        job.setTimeLimitMs(1000L);
        job.setMemoryLimitMb(64L);
        job.setComparatorType(ComparatorType.EXACT_MATCH);

        TestGenerationResult result = new TestGenerationService(
                factory, storage, new OutputComparatorService()).generateOutputs(job);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorMessage())
                .contains("test case 1 of 1", "Memory limit exceeded (MLE)", "sandbox limit is 64 MiB", "Process exit code: 1")
                .contains("java.lang.OutOfMemoryError: Java heap space")
                .doesNotContain("\u001B", "\u0000");
    }

    @ParameterizedTest
    @EnumSource(value = ExecutionStatus.class, names = {"RTE", "TLE", "MLE", "OLE"})
    void explainsVerdictEvenWhenRuntimeProducesNoDiagnostic(ExecutionStatus status) throws Exception {
        var fixture = fixture();
        ExecutionResult failure = new ExecutionResult();
        failure.setStatus(status);
        when(fixture.executor().runTestCase(any(), any())).thenReturn(failure);

        var result = fixture.service().generateOutputs(fixture.job());

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorMessage()).contains("test case 1 of 1", "No compiler or runtime diagnostic output")
                .doesNotContain("Process exit code:", "Observed memory:", "Execution time:", "null");
        switch (status) {
            case RTE -> assertThat(result.getErrorMessage()).contains("Runtime error (RTE)", "input parsing");
            case TLE -> assertThat(result.getErrorMessage()).contains("Time limit exceeded (TLE)", "1000 ms");
            case MLE -> assertThat(result.getErrorMessage()).contains("Memory limit exceeded (MLE)", "64 MiB");
            case OLE -> assertThat(result.getErrorMessage()).contains("Output limit exceeded (OLE)", "8 MiB");
            default -> throw new AssertionError("Unexpected test status");
        }
        verify(fixture.storage(), never()).upload(any(), any(String.class));
        verify(fixture.executor()).cleanup(fixture.session());
    }

    @Test
    void identifiesSecondFailingTestAndPreservesRuntimeTraceWithoutPublishingItsOutput() throws Exception {
        var fixture = fixture();
        UUID secondId = UUID.fromString("00000000-0000-0000-0000-000000000005");
        fixture.job().setTestCases(List.of(fixture.job().getTestCases().getFirst(),
                new TestCaseInfo(secondId, "second-input", "second-output")));
        when(fixture.storage().download("second-input")).thenReturn(stream("bad input"));
        ExecutionResult failure = ExecutionResult.runtimeError(
                "Traceback (most recent call last):\n  File Main.py, line 7\nValueError: invalid literal", 1, 12L);
        failure.setMemoryUsedMb(20L);
        failure.setOutput("partial output should not be published");
        when(fixture.executor().runTestCase(any(), any())).thenReturn(
                ExecutionResult.success("first output", 1L, 2L), failure);

        var result = fixture.service().generateOutputs(fixture.job());

        assertThat(result.getGeneratedCount()).isEqualTo(1);
        assertThat(result.getErrorMessage()).contains("test case 2 of 2", "Runtime error (RTE)",
                "Process exit code: 1", "Execution time: 12 ms", "Observed memory: 20 MiB",
                "Diagnostics:\nTraceback", "line 7\nValueError: invalid literal")
                .doesNotContain("partial output", "bad input");
        verify(fixture.storage()).upload("output", "first output");
        verify(fixture.storage(), never()).upload(eq("second-output"), any(String.class));
        verify(fixture.executor()).cleanup(fixture.session());
    }

    @Test
    void boundsAndSanitizesCompilerDiagnosticBeforeReturningFailure() throws Exception {
        var fixture = fixture();
        when(fixture.executor().prepare(any(), any(), any())).thenReturn(ContainerSession.compilationError(
                "\u001B[31mMain.java:3: error: cannot find symbol\u0000\n" + "x".repeat(9000)));

        var result = fixture.service().generateOutputs(fixture.job());

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getGeneratedCount()).isZero();
        assertThat(result.getErrorMessage()).contains("could not compile (CE)", "Main.java:3: error",
                "[Diagnostic truncated]").doesNotContain("\u001B", "\u0000");
        String diagnostic = result.getErrorMessage().split("Diagnostics:\n", 2)[1];
        assertThat(diagnostic).hasSize(8192);
        verify(fixture.executor(), never()).runTestCase(any(), any());
        verify(fixture.storage(), never()).upload(any(), any(String.class));
    }

    @Test
    void blankCompilerErrorDoesNotMaskRuntimeDiagnostic() throws Exception {
        var fixture = fixture();
        ExecutionResult failure = ExecutionResult.runtimeError("IndexError: list index out of range", 1, 4L);
        failure.setCompilationError("");
        when(fixture.executor().runTestCase(any(), any())).thenReturn(failure);

        var result = fixture.service().generateOutputs(fixture.job());

        assertThat(result.getErrorMessage()).contains("IndexError: list index out of range");
    }

    @Test
    void diagnosticContainingOnlyTerminalControlsUsesExplicitFallback() throws Exception {
        var fixture = fixture();
        when(fixture.executor().runTestCase(any(), any())).thenReturn(
                ExecutionResult.runtimeError("\u001B[31m\u0000\u001B[0m", 1, 4L));

        var result = fixture.service().generateOutputs(fixture.job());

        assertThat(result.getErrorMessage()).contains("No compiler or runtime diagnostic output was captured")
                .doesNotContain("\u001B", "\u0000");
    }

    private record Fixture(TestGenerationService service, LanguageExecutor executor,
                           ObjectStorageService storage, ContainerSession session, TestGenerationJob job) {}

    private Fixture fixture() throws Exception {
        LanguageExecutorFactory factory = mock(LanguageExecutorFactory.class);
        LanguageExecutor executor = mock(LanguageExecutor.class);
        ObjectStorageService storage = mock(ObjectStorageService.class);
        ContainerSession session = new ContainerSession("container", null, 1000, 64);
        when(factory.getExecutor(Language.JAVA)).thenReturn(executor);
        when(storage.download("reference")).thenReturn(stream("source"));
        when(storage.download("input")).thenReturn(stream("input"));
        when(executor.prepare(any(), any(), any())).thenReturn(session);
        TestGenerationJob job = new TestGenerationJob();
        job.setAssignmentId(ASSIGNMENT_ID);
        job.setReferenceLanguage(Language.JAVA);
        job.setReferenceSolutionPath("reference");
        job.setTimeLimitMs(1000L);
        job.setMemoryLimitMb(64L);
        job.setTestCases(List.of(new TestCaseInfo(TEST_CASE_ID, "input", "output")));
        return new Fixture(new TestGenerationService(factory, storage, new OutputComparatorService()),
                executor, storage, session, job);
    }

    private ByteArrayInputStream stream(String value) {
        return new ByteArrayInputStream(value.getBytes(StandardCharsets.UTF_8));
    }
}
