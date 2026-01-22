package com.github.codehive.worker.util;

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

    public static String referenceSolutionSourceCode(Long assignmentId, Long referenceSolutionId, String fileExtension) {
        return String.format("reference-solutions/assignments/%d/reference-solution-%d/Main.%s", assignmentId, referenceSolutionId, fileExtension);
    }

    public static String executionTestCaseOutput(Long executionId, String fileExtension) {
        return String.format("test-execution/execution-%d/output.%s", executionId, fileExtension);
    }

    public static String executionTestSource(Long executionId, String fileExtension) {
        return String.format("test-execution/execution-%d/Main.%s", executionId, fileExtension);
    }
}
