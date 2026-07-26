# Worker Messaging Implementation

## Scope
This document describes how the worker consumes jobs and publishes results through RabbitMQ.

Key classes:
- codehive-worker/src/main/java/com/github/codehive/worker/config/RabbitMQConfig.java
- codehive-worker/src/main/java/com/github/codehive/worker/messaging/listener/ExecutionRequestListener.java
- codehive-worker/src/main/java/com/github/codehive/worker/messaging/listener/TestGenerationRequestListener.java
- codehive-worker/src/main/java/com/github/codehive/worker/messaging/producer/ExecutionResultProducer.java
- codehive-worker/src/main/java/com/github/codehive/worker/messaging/producer/TestGenerationResultProducer.java

## Queue Topology
All queues are durable. Jackson JSON message conversion is applied globally.

| Constant | Default name | Worker role |
|---|---|---|
| `QUEUE_NAME` | `codehive_queue` | consumer |
| `RESULT_QUEUE_NAME` | `codehive_result_queue` | producer |
| `TEST_GENERATION_QUEUE_NAME` | `codehive_test_generation_queue` | consumer |
| `TEST_GENERATION_RESULT_QUEUE_NAME` | `codehive_test_generation_result_queue` | producer |

## Student Execution Flow

### Consumer — ExecutionRequestListener
1. @RabbitListener receives ExecutionJob from `codehive_queue`.
2. Listener logs full job context (id, language, type, paths, limits).
3. Delegates to TestExecutionService.executeJob.
4. Publishes result through ExecutionResultProducer.

Error path: if execution throws unexpectedly, listener builds a fallback ExecutionReport with `overallStatus = RTE` and still publishes it.

Incoming payload: `model/dto/queue/ExecutionJob`
- Contains an ordered list of opaque-path `ExecutionTestCaseInfo` entries.
- Contains `reportPath`, optional `testSuiteRevisionId`, and execution trigger.
- Does not contain a test-suite prefix or require worker-side path construction.

### Producer — ExecutionResultProducer
Publishes ExecutionReport to `codehive_result_queue`.

Outgoing payload: `model/dto/ExecutionReport`

## Test Generation Flow

### Consumer — TestGenerationRequestListener
1. @RabbitListener receives TestGenerationJob from `codehive_test_generation_queue`.
2. Delegates to TestGenerationService.generateOutputs.
3. Publishes TestGenerationResult through TestGenerationResultProducer.

Error path: uncaught exceptions produce a failed TestGenerationResult (success=false) which is still published.

Incoming payload: `model/dto/queue/TestGenerationJob`
- Contains `referenceSolutionPath`, `referenceLanguage`, `timeLimitMs`, `memoryLimitMb`
- Contains `List<TestCaseInfo>` — each with `testCaseId`, `inputPath`, `outputPath`
- Carries assignment-update, test-suite-revision, and reference-revision correlation IDs.
- Reference compatibility jobs additionally carry `baselineOutputPath`.

### Producer — TestGenerationResultProducer
Publishes TestGenerationResult to `codehive_test_generation_result_queue`.

Outgoing payload: `model/dto/queue/TestGenerationResult`
- `assignmentId`, `success`, `generatedCount`, `errorMessage`
- Echoes all revision/update correlation IDs so the backend can reject stale results.

## Operational Notes
- Backend and worker must share queue names and compatible DTO schemas — both projects maintain mirrored copies of queue DTOs.
- `[WORKFLOW]`-prefixed log lines trace message flow end to end.
- Use messaging logs as the first stop when debugging job handoff issues.
- Keep payload evolution coordinated across both services.
