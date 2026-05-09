package com.github.codehive.utils;

import java.util.UUID;

public class ObjectKeyBuilder {
    public static String testCaseInput(UUID assignmentId, UUID testCaseId) {
        return String.format("test-suites/assignments/%s/tc-%s/tc%s.in", assignmentId, testCaseId, testCaseId);
    }

    public static String testCaseOutput(UUID assignmentId, UUID testCaseId) {
        return String.format("test-suites/assignments/%s/tc-%s/tc%s.out", assignmentId, testCaseId, testCaseId);
    }

    public static String testsPath(UUID assignmentId) {
        return String.format("test-suites/assignments/%s/", assignmentId);
    }

    public static String submissionSourceCode(UUID assignmentId, UUID submissionId, String fileExtension, UUID groupId) {
        return String.format("submissions/groups/%s/assignments/%s/submission-%s/Main.%s", groupId, assignmentId, submissionId, fileExtension);
    }

    public static String executionOutput(UUID submissionId, UUID executionId, UUID groupId, String fileExtension) {
        return String.format("executions/groups/%s/assignments/%s/execution-%s/output.%s", groupId, submissionId, executionId, fileExtension);
    }

    public static String referenceSolutionSourceCode(UUID assignmentId, String fileExtension) {
        return String.format("test-suites/assignments/%s/reference/Main.%s", assignmentId, fileExtension);
    }

    public static String executionTestCaseOutput(UUID executionId) {
        return String.format("test-execution/execution-%s/output/", executionId);
    }

    public static String executionSourceCode(UUID executionId, String fileExtension) {
        return String.format("test-execution/execution-%s/source.%s", executionId, fileExtension);
    }
}
