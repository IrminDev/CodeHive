package com.github.codehive.worker.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.github.codehive.worker.model.dto.ExecutionReport;
import com.github.codehive.worker.model.dto.ExecutionResult;
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
        when(executor.runTestCase(any(), any())).thenReturn(ExecutionResult.success("2\n", 10L, 20L));

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
        verify(storage).download("opaque/input");
        verify(storage).download("opaque/expected");
        verify(storage).upload("opaque/stdout", "2\n");
        verify(storage).upload(org.mockito.ArgumentMatchers.eq("opaque/report"), any(String.class));
    }

    private ByteArrayInputStream stream(String value) {
        return new ByteArrayInputStream(value.getBytes(StandardCharsets.UTF_8));
    }
}
