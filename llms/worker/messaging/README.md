# Worker Messaging Implementation

## Scope
This document describes how the worker consumes execution jobs and publishes execution results through RabbitMQ.

Key classes:
- codehive-worker/src/main/java/com/github/codehive/worker/config/RabbitMQConfig.java
- codehive-worker/src/main/java/com/github/codehive/worker/messaging/listener/ExecutionRequestListener.java
- codehive-worker/src/main/java/com/github/codehive/worker/messaging/producer/ExecutionResultProducer.java

## Queue Topology
Configured queue names:
- request queue: codehive_queue (default)
- result queue: codehive_result_queue (default)

Both queues are durable and use Jackson JSON message conversion.

## Incoming Message Contract
Listener consumes:
- model/dto/queue/ExecutionJob

Important fields in ExecutionJob:
- id
- source
- reference
- language
- referenceLanguage
- executionType
- comparatorType
- timeLimitMs
- memoryLimitMb
- outputPath
- testsPath, numTests, testCases

## Consumption Flow
1. @RabbitListener receives ExecutionJob.
2. Listener logs full job context.
3. Listener invokes TestExecutionService.executeJob.
4. Successful run produces ExecutionReport.
5. Listener sends report through ExecutionResultProducer.

Error path:
- If execution fails unexpectedly, listener builds fallback report:
  - overallStatus = RTE
  - compilationError = internal error message
- Fallback report is still published to backend.

## Outgoing Message Contract
Producer publishes:
- model/dto/ExecutionReport

Report includes:
- executionId
- overallStatus
- per-test results
- timing and memory summaries
- compilationError when present

## Operational Notes
- Backend and worker must share queue names and compatible DTO schemas.
- Messaging logs are the first place to debug job handoff issues.
- Keep payload evolution coordinated across both services.
