package com.github.codehive.utils;

public class ObjectKeyBuilder {
    public static String testCaseInput(Long assignmentId, Long testCaseId) {
        return String.format("test-suites/assignments/%d/tc-%d/tc%d.in", assignmentId, testCaseId, testCaseId);
    }

    public static String testCaseOutput(Long assignmentId, Long testCaseId) {
        return String.format("test-suites/assignments/%d/tc-%d/tc%d.out", assignmentId, testCaseId, testCaseId);
    }

    public static String submissionSourceCode(Long assignmentId, Long submissionId, String fileExtension, Long groupId) {
        return String.format("submissions/groups/%d/assignments/%d/submission-%d/Main.%s", groupId, assignmentId, submissionId, fileExtension);
    }

    public static String executionOutput(Long submissionId, Long executionId, Long groupId, String fileExtension) {
        return String.format("executions/groups/%d/assignments/%d/execution-%d/output.%s", groupId, submissionId, executionId, fileExtension);
    }
}
