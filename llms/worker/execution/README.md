# Worker Execution Lifecycle

## Scope
This document describes how the worker executes incoming jobs, computes verdicts, and stores result artifacts.

Primary classes:
- codehive-worker/src/main/java/com/github/codehive/worker/messaging/listener/ExecutionRequestListener.java
- codehive-worker/src/main/java/com/github/codehive/worker/messaging/listener/TestGenerationRequestListener.java
- codehive-worker/src/main/java/com/github/codehive/worker/service/TestExecutionService.java
- codehive-worker/src/main/java/com/github/codehive/worker/service/TestGenerationService.java
- codehive-worker/src/main/java/com/github/codehive/worker/model/dto/ExecutionReport.java
- codehive-worker/src/main/java/com/github/codehive/worker/model/dto/TestCaseResult.java

## Student Execution Flow (TestExecutionService)
1. ExecutionRequestListener receives ExecutionJob from RabbitMQ.
2. Listener delegates to TestExecutionService.executeJob.
3. Service compile-checks the submission first; returns CE report immediately if it fails.
4. Per-test results are aggregated in ExecutionReport, including bounded stderr,
   exit code, execution time, and best-observed per-test memory.
5. Test artifacts (stdout.txt, stderr.txt) and report.json are uploaded to MinIO.
6. Listener publishes final ExecutionReport to result queue.

### Execution Modes

DEFINITIVE:
- Uses the ordered `testCases` entries from `ExecutionJob`.
- For each test case:
  - download the exact `inputPath`
  - download the exact `expectedOutputPath`
  - execute submission with input
  - compare outputs via OutputComparatorService
  - upload stdout/stderr to the exact paths supplied by the backend

The worker never reconstructs MinIO keys. Definitive results retain both the
stable test-case UUID and its display order.

PRACTICE:
- Uses inline `testCases` list from ExecutionJob.
- Runs reference solution on each input to produce expected output.
- Runs submission and compares.
- After reference execution succeeds, retains bounded expected output and captured
  student stdout for every case in `ExecutionReport`, including non-AC verdicts.
  These fields are never populated for DEFINITIVE results.

## Test Generation Flow (TestGenerationService)
Triggered by TestGenerationJob after a teacher creates an assignment.

1. Resolve the language executor for `referenceLanguage`.
2. Compile-check the reference solution (fast-fail before processing all test cases).
3. For each TestCaseInfo in the job:
   - Download reference solution from `referenceSolutionPath`.
   - Download test input from `inputPath`.
   - Execute reference solution with the input.
   - If result status is not AC, abort with failure result.
   - Upload actual output to `outputPath` (MinIO).
4. Return TestGenerationResult:
   - `success = true`, `generatedCount = N` if all outputs were produced.
   - `success = false` with error message and partial count on any failure.

Reference-only assignment changes use compatibility validation. The candidate
reference runs against every active input and its result is compared with the
active expected output. Any observable difference rejects the candidate.

## Compilation Gate
Both services perform a compile check before the main execution loop.
- If compile fails (CE status), per-test execution is skipped entirely.
- TestGenerationService additionally rejects if reference solution returns non-AC.
- Python uses a static `compile(...)` preflight in the runtime image. Syntax and
  indentation errors are therefore CE; exceptions raised while running valid code
  remain RTE.
- Assignment-validation failures identify the 1-based test position in queue order
  and total test count, explain the verdict in plain language, and include exit code,
  execution time, and observed memory when available. Time/memory failures report
  effective session limits; output failures report the sandbox output cap. Queue
  order follows the uploaded/proposed suite order, including preserved tests before
  appended tests. UUIDs stay in worker logs.
- Compiler/runtime diagnostics are stripped of terminal control characters and
  bounded to 8,192 characters, preserving multiline traces and source line numbers.
  Missing diagnostics are stated explicitly rather than inventing an exact cause.
  Compilation, preparation, and per-test processing errors also use bounded diagnostics.
  The existing errorMessage queue field carries these messages unchanged through
  backend persistence to the teacher status drawer and validation email; no queue
  schema changes are required. Existing failures retain their original saved message
  until validation runs again.

## Verdict Model
Per-test verdicts represented by ExecutionStatus:
- AC, WA, CE, RTE, TLE, MLE, OLE, PENDING

Overall verdict in ExecutionReport derived by priority:
1. CE if compilationError exists
2. AC if all tests pass
3. Otherwise: CE > TLE > MLE > OLE > RTE > WA

## Runtime Constraints
Each run uses limits from the job payload:
- timeLimitMs
- memoryLimitMb

Executors enforce limits via Docker container constraints and timeout guards.
Each submission container has one memory tracker for its full session. It records:
- `maxMemoryMb`: exact cgroup session peak, in MiB, for persisted execution metrics.
- per-test memory: best observed test usage from live Docker stats and cgroup peak
  changes. This is diagnostic and may be absent when no reliable sample exists.
- cgroup OOM evidence, combined with exit code and language-specific managed-runtime
  markers, for MLE classification.

## Test-case cap regression coverage

`TestExecutionServiceTest` verifies requested counts 49, 50, and 51 in each mode:

- `definitiveExecutionRunsAtMostFiftyTestCases`: report contains exactly the first
  `min(requested, 50)` case IDs, executor runs that many times, and case 51's input
  and expected output are never downloaded.
- `practiceExecutionCapsBothStudentAndReferenceAtFiftyTestCases`: report numbers and
  captured inputs preserve the first `min(requested, 50)` cases; both student and
  reference executors run that many times and sessions are cleaned up.

These are deterministic service unit tests with mocked storage/executors, not
Docker tests. The 50-case expectation is independent of the production constant,
so raising/removing the cap without updating requirements fails the tests.

```bash
cd codehive-worker
./gradlew test --tests '*TestExecutionServiceTest'
```

Validation: 9 executions passed (six new boundary cases and three existing cases).
Report: `codehive-worker/build/reports/tests/test/index.html`.

## Failure Handling
- Unhandled failures produce an error report/result that is still published to backend queue.
- Silent job loss is avoided by always sending a result, even on unexpected errors.

## Extension Guidance
- Keep ExecutionJob, ExecutionReport, TestGenerationJob, and TestGenerationResult contract-compatible with backend.
- If adding new ExecutionStatus values, update:
  - ExecutionStatus enum in both backend and worker
  - overall status calculation in ExecutionReport.determineOverallStatus
  - backend result processing logic in ExecutionResultService
