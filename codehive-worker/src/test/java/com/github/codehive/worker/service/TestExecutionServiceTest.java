package com.github.codehive.worker.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.IntStream;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import com.github.codehive.worker.model.dto.ExecutionReport;
import com.github.codehive.worker.model.dto.ExecutionResult;
import com.github.codehive.worker.model.dto.TestCaseResult;
import com.github.codehive.worker.model.dto.queue.ExecutionJob;
import com.github.codehive.worker.model.dto.queue.ExecutionTestCaseInfo;
import com.github.codehive.worker.model.enums.ComparatorType;
import com.github.codehive.worker.model.enums.ExecutionStatus;
import com.github.codehive.worker.model.enums.ExecutionType;
import com.github.codehive.worker.model.enums.Language;
import com.github.codehive.worker.sandbox.ContainerSession;
import com.github.codehive.worker.sandbox.LanguageExecutor;
import com.github.codehive.worker.sandbox.factory.LanguageExecutorFactory;

class TestExecutionServiceTest {
    private static final UUID EXECUTION_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID TEST_CASE_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000002");

    @Test
    void definitiveExecutionUsesOpaquePathsFromTheJob() throws Exception {
        LanguageExecutorFactory factory = mock(LanguageExecutorFactory.class);
        ObjectStorageService storage = mock(ObjectStorageService.class);
        OutputComparatorService comparator = new OutputComparatorService();
        LanguageExecutor executor = mock(LanguageExecutor.class);
        ContainerSession session = new ContainerSession("container", null, 1000, 128);
        when(factory.getExecutor(Language.JAVA)).thenReturn(executor);
        when(storage.download("submission-source")).thenReturn(stream("class Main {}"));
        when(storage.download("opaque/input")).thenReturn(stream("1\n"));
        when(storage.download("opaque/expected")).thenReturn(stream("2\n"));
        when(executor.prepare(any(), any(), any())).thenReturn(session);
        ExecutionResult executionResult = ExecutionResult.success("2\n", 10L, 20L);
        executionResult.setSessionPeakMemoryMb(36L);
        when(executor.runTestCase(any(), any())).thenReturn(executionResult);

        ExecutionTestCaseInfo testCase = new ExecutionTestCaseInfo();
        testCase.setTestCaseId(TEST_CASE_ID);
        testCase.setOrder(1);
        testCase.setInputPath("opaque/input");
        testCase.setExpectedOutputPath("opaque/expected");
        testCase.setStdoutPath("opaque/stdout");
        testCase.setStderrPath("opaque/stderr");
        ExecutionJob job = new ExecutionJob(
                EXECUTION_ID, "submission-source", null, Language.JAVA,
                ExecutionType.DEFINITIVE, List.of(testCase), 1000L, 128L,
                ComparatorType.EXACT_MATCH, "opaque/report", null, null,
                "INITIAL_SUBMISSION");

        ExecutionReport report = new TestExecutionService(factory, storage, comparator).executeJob(job);

        assertThat(report.getOverallStatus()).isEqualTo(ExecutionStatus.AC);
        assertThat(report.getTestCaseResults()).singleElement()
                .extracting(result -> result.getTestCaseId()).isEqualTo(TEST_CASE_ID);
        assertThat(report.getTestCaseResults()).singleElement().satisfies(result -> {
            assertThat(result.getExpectedOutput()).isNull();
            assertThat(result.getActualOutput()).isNull();
        });
        assertThat(report.getMaxMemoryUsedMb()).isEqualTo(36L);
        verify(storage).download("opaque/input");
        verify(storage).download("opaque/expected");
        verify(storage).upload("opaque/stdout", "2\n");
        verify(storage).upload(org.mockito.ArgumentMatchers.eq("opaque/report"), any(String.class));
    }

    @Test
    void practiceExecutionRetainsExpectedAndCapturedOutputForEveryCase() throws Exception {
        LanguageExecutorFactory factory = mock(LanguageExecutorFactory.class);
        ObjectStorageService storage = mock(ObjectStorageService.class);
        OutputComparatorService comparator = new OutputComparatorService();
        LanguageExecutor studentExecutor = mock(LanguageExecutor.class);
        LanguageExecutor referenceExecutor = mock(LanguageExecutor.class);
        ContainerSession studentSession = new ContainerSession("student", null, 1000, 128);
        ContainerSession referenceSession = new ContainerSession("reference", null, 1000, 128);

        when(factory.getExecutor(Language.JAVA)).thenReturn(studentExecutor);
        when(factory.getExecutor(Language.PYTHON)).thenReturn(referenceExecutor);
        when(storage.download("student-source")).thenReturn(stream("class Main {}"));
        when(storage.download("reference-source")).thenReturn(stream("print('reference')"));
        when(studentExecutor.prepare(any(), any(), any())).thenReturn(studentSession);
        when(referenceExecutor.prepare(any(), any(), any())).thenReturn(referenceSession);
        when(referenceExecutor.runTestCase(any(), any()))
                .thenReturn(ExecutionResult.success("one\n", 10L, 20L))
                .thenReturn(ExecutionResult.success("two\n", 10L, 20L))
                .thenReturn(ExecutionResult.success("three\n", 10L, 20L));

        ExecutionResult runtimeError = ExecutionResult.runtimeError("boom", 1, 12L);
        runtimeError.setOutput("partial output\n");
        when(studentExecutor.runTestCase(any(), any()))
                .thenReturn(ExecutionResult.success("one\n", 11L, 21L))
                .thenReturn(runtimeError)
                .thenReturn(ExecutionResult.success("wrong\n", 13L, 22L));

        ExecutionTestCaseInfo first = new ExecutionTestCaseInfo();
        first.setOrder(1);
        first.setInlineInput("first\n");
        ExecutionTestCaseInfo second = new ExecutionTestCaseInfo();
        second.setOrder(2);
        second.setInlineInput("second\n");
        ExecutionTestCaseInfo third = new ExecutionTestCaseInfo();
        third.setOrder(3);
        third.setInlineInput("third\n");
        ExecutionJob job = new ExecutionJob(
                EXECUTION_ID, "student-source", "reference-source", Language.JAVA,
                ExecutionType.PRACTICE, List.of(first, second, third), 1000L, 128L,
                ComparatorType.EXACT_MATCH, "practice/report", Language.PYTHON, null,
                "PRACTICE");

        ExecutionReport report = new TestExecutionService(factory, storage, comparator).executeJob(job);

        assertThat(report.getTestCaseResults()).hasSize(3);
        assertThat(report.getTestCaseResults().get(0)).satisfies(result -> {
            assertThat(result.getStatus()).isEqualTo(ExecutionStatus.AC);
            assertThat(result.getExpectedOutput()).isEqualTo("one\n");
            assertThat(result.getActualOutput()).isEqualTo("one\n");
        });
        assertThat(report.getTestCaseResults().get(1)).satisfies(result -> {
            assertThat(result.getStatus()).isEqualTo(ExecutionStatus.RTE);
            assertThat(result.getExpectedOutput()).isEqualTo("two\n");
            assertThat(result.getActualOutput()).isEqualTo("partial output\n");
        });
        assertThat(report.getTestCaseResults().get(2)).satisfies(result -> {
            assertThat(result.getStatus()).isEqualTo(ExecutionStatus.WA);
            assertThat(result.getExpectedOutput()).isEqualTo("three\n");
            assertThat(result.getActualOutput()).isEqualTo("wrong\n");
        });
    }

    @Test
    void practiceDiagnosticOutputIsBoundedBeforeItReachesReportStorage() {
        TestCaseResult result = new TestCaseResult();
        String oversizedOutput = "x".repeat(10 * 1024);

        result.setExpectedOutput(oversizedOutput);
        result.setActualOutput(oversizedOutput);
        result.setStderr("\u001B[31m" + oversizedOutput + "\u0000");

        assertThat(result.getExpectedOutput()).hasSize(8 * 1024)
                .endsWith("[Output truncated for artifact retention]");
        assertThat(result.getActualOutput()).hasSize(8 * 1024)
                .endsWith("[Output truncated for artifact retention]");
        assertThat(result.getStderr()).hasSize(8 * 1024)
                .doesNotContain("\u001B", "\u0000")
                .endsWith("[Output truncated for artifact retention]");
    }

    @ParameterizedTest
    @ValueSource(ints = {49, 50, 51})
    void definitiveExecutionRunsAtMostFiftyTestCases(int requestedCases) throws Exception {
        LanguageExecutorFactory factory = mock(LanguageExecutorFactory.class);
        ObjectStorageService storage = mock(ObjectStorageService.class);
        LanguageExecutor executor = mock(LanguageExecutor.class);
        ContainerSession session = new ContainerSession("student", null, 1000, 128);
        when(factory.getExecutor(Language.JAVA)).thenReturn(executor);
        when(storage.download(anyString())).thenAnswer(invocation -> {
            String path = invocation.getArgument(0);
            if (path.equals("student-source")) return stream("class Main {}");
            if (path.startsWith("expected/")) return stream("ok\n");
            return stream(path);
        });
        when(executor.prepare(any(), any(), any())).thenReturn(session);
        when(executor.runTestCase(any(), any())).thenReturn(ExecutionResult.success("ok\n", 1L, 1L));
        List<ExecutionTestCaseInfo> cases = numberedCases(requestedCases);
        ExecutionJob job = new ExecutionJob(EXECUTION_ID, "student-source", null, Language.JAVA,
                ExecutionType.DEFINITIVE, cases, 1000L, 128L, ComparatorType.EXACT_MATCH,
                null, null, null, "INITIAL_SUBMISSION");

        ExecutionReport report = new TestExecutionService(factory, storage, new OutputComparatorService()).executeJob(job);

        int expectedExecuted = Math.min(requestedCases, 50);
        assertThat(report.getOverallStatus()).isEqualTo(ExecutionStatus.AC);
        assertThat(report.getTestCaseResults()).hasSize(expectedExecuted)
                .extracting(TestCaseResult::getTestCaseId)
                .containsExactlyElementsOf(cases.subList(0, expectedExecuted).stream()
                        .map(ExecutionTestCaseInfo::getTestCaseId).toList());
        verify(executor, times(expectedExecuted)).runTestCase(any(), any());
        verify(storage).download("input/" + expectedExecuted);
        verify(storage).download("expected/" + expectedExecuted);
        verify(storage, never()).download("input/51");
        verify(storage, never()).download("expected/51");
        verify(executor).cleanup(session);
    }

    @ParameterizedTest
    @ValueSource(ints = {49, 50, 51})
    void practiceExecutionCapsBothStudentAndReferenceAtFiftyTestCases(int requestedCases) throws Exception {
        LanguageExecutorFactory factory = mock(LanguageExecutorFactory.class);
        ObjectStorageService storage = mock(ObjectStorageService.class);
        LanguageExecutor studentExecutor = mock(LanguageExecutor.class);
        LanguageExecutor referenceExecutor = mock(LanguageExecutor.class);
        ContainerSession studentSession = new ContainerSession("student", null, 1000, 128);
        ContainerSession referenceSession = new ContainerSession("reference", null, 1000, 128);
        when(factory.getExecutor(Language.JAVA)).thenReturn(studentExecutor);
        when(factory.getExecutor(Language.PYTHON)).thenReturn(referenceExecutor);
        when(storage.download("student-source")).thenReturn(stream("class Main {}"));
        when(storage.download("reference-source")).thenReturn(stream("print('ok')"));
        when(studentExecutor.prepare(any(), any(), any())).thenReturn(studentSession);
        when(referenceExecutor.prepare(any(), any(), any())).thenReturn(referenceSession);
        List<String> studentInputs = new ArrayList<>();
        List<String> referenceInputs = new ArrayList<>();
        when(studentExecutor.runTestCase(any(), any())).thenAnswer(invocation -> {
            studentInputs.add(new String(((java.io.InputStream) invocation.getArgument(1)).readAllBytes(),
                    StandardCharsets.UTF_8));
            return ExecutionResult.success("ok\n", 1L, 1L);
        });
        when(referenceExecutor.runTestCase(any(), any())).thenAnswer(invocation -> {
            referenceInputs.add(new String(((java.io.InputStream) invocation.getArgument(1)).readAllBytes(),
                    StandardCharsets.UTF_8));
            return ExecutionResult.success("ok\n", 1L, 1L);
        });
        List<ExecutionTestCaseInfo> cases = numberedCases(requestedCases);
        ExecutionJob job = new ExecutionJob(EXECUTION_ID, "student-source", "reference-source", Language.JAVA,
                ExecutionType.PRACTICE, cases, 1000L, 128L, ComparatorType.EXACT_MATCH,
                null, Language.PYTHON, null, "PRACTICE");

        ExecutionReport report = new TestExecutionService(factory, storage, new OutputComparatorService()).executeJob(job);

        int expectedExecuted = Math.min(requestedCases, 50);
        List<String> expectedInputs = cases.subList(0, expectedExecuted).stream()
                .map(ExecutionTestCaseInfo::getInlineInput).toList();
        assertThat(report.getOverallStatus()).isEqualTo(ExecutionStatus.AC);
        assertThat(report.getTestCaseResults()).hasSize(expectedExecuted)
                .extracting(TestCaseResult::getTestCaseNumber)
                .containsExactlyElementsOf(IntStream.rangeClosed(1, expectedExecuted).boxed().toList());
        assertThat(studentInputs).containsExactlyElementsOf(expectedInputs);
        assertThat(referenceInputs).containsExactlyElementsOf(expectedInputs);
        verify(studentExecutor, times(expectedExecuted)).runTestCase(any(), any());
        verify(referenceExecutor, times(expectedExecuted)).runTestCase(any(), any());
        verify(studentExecutor).cleanup(studentSession);
        verify(referenceExecutor).cleanup(referenceSession);
    }

    private List<ExecutionTestCaseInfo> numberedCases(int count) {
        return IntStream.rangeClosed(1, count).mapToObj(number -> {
            ExecutionTestCaseInfo testCase = new ExecutionTestCaseInfo();
            testCase.setTestCaseId(UUID.fromString(String.format("00000000-0000-0000-0000-%012d", number + 100)));
            testCase.setOrder(number);
            testCase.setInputPath("input/" + number);
            testCase.setExpectedOutputPath("expected/" + number);
            testCase.setInlineInput("case " + number);
            return testCase;
        }).toList();
    }

    private ByteArrayInputStream stream(String value) {
        return new ByteArrayInputStream(value.getBytes(StandardCharsets.UTF_8));
    }
}
