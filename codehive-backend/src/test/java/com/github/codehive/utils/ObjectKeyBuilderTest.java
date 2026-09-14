package com.github.codehive.utils;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;

class ObjectKeyBuilderTest {
    private static final UUID ASSIGNMENT_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID REVISION_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000002");
    private static final UUID TEST_CASE_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000003");
    private static final UUID EXECUTION_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000004");

    @Test
    void buildsRevisionScopedTestCaseKeys() {
        assertThat(ObjectKeyBuilder.testCaseInput(ASSIGNMENT_ID, REVISION_ID, TEST_CASE_ID))
                .isEqualTo("assignments/" + ASSIGNMENT_ID + "/test-suite-revisions/"
                        + REVISION_ID + "/test-cases/" + TEST_CASE_ID + "/input.in");
        assertThat(ObjectKeyBuilder.testCaseExpectedOutput(ASSIGNMENT_ID, REVISION_ID, TEST_CASE_ID))
                .endsWith("/test-cases/" + TEST_CASE_ID + "/expected.out");
    }

    @Test
    void buildsCompleteExecutionKeysWithoutDoubleSeparators() {
        assertThat(ObjectKeyBuilder.executionTestCaseStdout(EXECUTION_ID, TEST_CASE_ID))
                .isEqualTo("executions/" + EXECUTION_ID + "/test-cases/"
                        + TEST_CASE_ID + "/stdout.txt")
                .doesNotContain("//");
        assertThat(ObjectKeyBuilder.executionReport(EXECUTION_ID))
                .isEqualTo("executions/" + EXECUTION_ID + "/report.json");
    }
}
