package com.github.codehive.utils;

import java.util.UUID;

public class ObjectKeyBuilder {
    private ObjectKeyBuilder() {
    }

    public static String testSuitePath(UUID assignmentId, UUID revisionId) {
        return String.format("assignments/%s/test-suite-revisions/%s/", assignmentId, revisionId);
    }

    public static String testCaseInput(UUID assignmentId, UUID revisionId, UUID testCaseId) {
        return testSuitePath(assignmentId, revisionId)
                + String.format("test-cases/%s/input.in", testCaseId);
    }

    public static String testCaseExpectedOutput(UUID assignmentId, UUID revisionId, UUID testCaseId) {
        return testSuitePath(assignmentId, revisionId)
                + String.format("test-cases/%s/expected.out", testCaseId);
    }

    public static String submissionSourceCode(UUID assignmentId, UUID submissionId, String fileExtension) {
        return String.format("assignments/%s/submissions/%s/source/Main.%s",
                assignmentId, submissionId, fileExtension);
    }

    public static String referenceSolutionSourceCode(UUID assignmentId, UUID revisionId, String fileExtension) {
        return testSuitePath(assignmentId, revisionId)
                + String.format("reference/Main.%s", fileExtension);
    }

    public static String referenceValidationOutput(UUID assignmentId, UUID updateId, UUID testCaseId) {
        return String.format("assignment-update-validations/%s/%s/test-cases/%s/candidate.out",
                assignmentId, updateId, testCaseId);
    }

    public static String executionReport(UUID executionId) {
        return String.format("executions/%s/report.json", executionId);
    }

    public static String executionTestCaseStdout(UUID executionId, UUID testCaseId) {
        return String.format("executions/%s/test-cases/%s/stdout.txt", executionId, testCaseId);
    }

    public static String executionTestCaseStderr(UUID executionId, UUID testCaseId) {
        return String.format("executions/%s/test-cases/%s/stderr.txt", executionId, testCaseId);
    }

    public static String practiceExecutionSourceCode(UUID executionId, String fileExtension) {
        return String.format("practice-executions/%s/source/Main.%s", executionId, fileExtension);
    }

    public static String practiceExecutionReport(UUID executionId) {
        return String.format("practice-executions/%s/report.json", executionId);
    }

    public static String practiceExecutionTestCaseStdout(UUID executionId, int testCaseNumber) {
        return String.format("practice-executions/%s/test-cases/%d/stdout.txt",
                executionId, testCaseNumber);
    }

    public static String practiceExecutionTestCaseStderr(UUID executionId, int testCaseNumber) {
        return String.format("practice-executions/%s/test-cases/%d/stderr.txt",
                executionId, testCaseNumber);
    }
}
