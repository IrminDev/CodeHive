package com.github.codehive.worker.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

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
        assertThat(result.getErrorMessage()).contains("output changed");
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
                .contains("status=" + ExecutionStatus.MLE)
                .contains("java.lang.OutOfMemoryError: Java heap space")
                .doesNotContain("\u001B", "\u0000");
    }

    private ByteArrayInputStream stream(String value) {
        return new ByteArrayInputStream(value.getBytes(StandardCharsets.UTF_8));
    }
}
