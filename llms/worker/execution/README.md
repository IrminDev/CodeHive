# Worker Execution Lifecycle

## Scope
This document describes how the worker executes incoming jobs, computes verdicts, and stores result artifacts.

Primary classes:
- codehive-worker/src/main/java/com/github/codehive/worker/messaging/listener/ExecutionRequestListener.java
- codehive-worker/src/main/java/com/github/codehive/worker/service/TestExecutionService.java
- codehive-worker/src/main/java/com/github/codehive/worker/model/dto/ExecutionReport.java
- codehive-worker/src/main/java/com/github/codehive/worker/model/dto/TestCaseResult.java

## High-Level Flow
1. ExecutionRequestListener receives ExecutionJob from RabbitMQ.
2. Listener delegates job to TestExecutionService.executeJob.
3. Service compiles/runs submission through the selected language executor.
4. Per-test results are aggregated in ExecutionReport.
5. Report JSON and test artifacts are uploaded to object storage.
6. Listener publishes final ExecutionReport to result queue.

## Execution Modes
DEFINITIVE:
- Uses testsPath and numTests from ExecutionJob.
- For each test case:
  - download input (.in)
  - download expected output (.out)
  - execute submission
  - compare outputs

PRACTICE:
- Uses inline testCases from ExecutionJob.
- Runs reference solution first to generate expected output.
- Runs submission and compares against reference output.

## Compilation Gate
- Service performs an initial compile/syntax validation pass before test loop.
- If compile fails:
  - report.compilationError is set
  - overall status becomes CE
  - per-test execution is skipped

## Test Artifact Output
For each test case, service uploads:
- stdout.txt
- stderr.txt (if non-empty)

Report upload:
- report.json generated from ExecutionReport and uploaded to outputPath.

## Verdict Model
Per-test verdicts are represented by ExecutionStatus values:
- AC, WA, CE, RTE, TLE, MLE, PENDING

Overall verdict in ExecutionReport is derived by priority:
1. CE if compilationError exists
2. AC if all tests pass
3. otherwise TLE > MLE > RTE > WA

## Runtime Constraints
Each run uses limits from ExecutionJob:
- timeLimitMs
- memoryLimitMb

Executors enforce limits in Docker using container constraints and timeout guards.

## Failure Handling
- Unhandled processing failures create an error report with RTE and compilationError summary.
- Listener still publishes error result to backend queue to avoid silent job loss.

## Extension Guidance
- Keep ExecutionJob and ExecutionReport contract-compatible with backend.
- If adding new statuses, update:
  - ExecutionStatus enum
  - overall status calculation
  - backend result processing logic
