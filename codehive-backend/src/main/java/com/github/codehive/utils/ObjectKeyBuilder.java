package com.github.codehive.utils;

public class ObjectKeyBuilder {
    public static String testCaseInput(Long assignmentId, Long testCaseId) {
        return String.format("test-suites/assignments/%d/tc-%d/tc%d.in", assignmentId, testCaseId, testCaseId);
    }

    public static String testCaseOutput(Long assignmentId, Long testCaseId) {
        return String.format("test-suites/assignments/%d/tc-%d/tc%d.out", assignmentId, testCaseId, testCaseId);
    }

    public static String testsPath(Long assignmentId) {
        return String.format("test-suites/assignments/%d/", assignmentId);

    }

    public static String submissionSourceCode(Long assignmentId, Long submissionId, String fileExtension, Long groupId) {
        return String.format("submissions/groups/%d/assignments/%d/submission-%d/Main.%s", groupId, assignmentId, submissionId, fileExtension);
    }

    public static String executionOutput(Long submissionId, Long executionId, Long groupId, String fileExtension) {
        return String.format("executions/groups/%d/assignments/%d/execution-%d/output.%s", groupId, submissionId, executionId, fileExtension);
    }

    public static String referenceSolutionSourceCode(Long assignmentId, String fileExtension) {
        return String.format("test-suites/assignments/%d/reference/Main.%s", assignmentId, fileExtension);
    }

    public static String executionTestCaseOutput(Long executionId) {
        return String.format("test-execution/execution-%d/output/", executionId);
    }

    public static String executionSourceCode(Long executionId, String fileExtension) {
        return String.format("test-execution/execution-%d/source.%s", executionId, fileExtension);
    }
}
