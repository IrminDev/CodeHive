# Backend Messaging Implementation

## Scope
This document covers backend message production/consumption for code execution, assignment creation, and email notification workflows.

Key classes:
- config/RabbitConfig.java
- messaging/producer/ExecutionRequestProducer.java
- messaging/producer/TestGenerationRequestProducer.java
- messaging/listener/ExecutionResultListener.java
- messaging/listener/TestGenerationResultListener.java
- messaging/producer/NotificationProducer.java
- messaging/listener/NotificationEmailListener.java

## Queue Topology
All queues are declared durable with Jackson JSON message conversion.

Configured in RabbitConfig via system properties (defaults shown):

| Constant | Default name | Direction |
|---|---|---|
| `QUEUE_NAME` | `codehive_queue` | backend → worker |
| `RESULT_QUEUE_NAME` | `codehive_result_queue` | worker → backend |
| `TEST_GENERATION_QUEUE_NAME` | `codehive_test_generation_queue` | backend → worker |
| `TEST_GENERATION_RESULT_QUEUE_NAME` | `codehive_test_generation_result_queue` | worker → backend |
| `NOTIFICATION_EMAIL_QUEUE` | `codehive_notification_email_queue` | backend → backend SMTP consumer |
| `NOTIFICATION_EMAIL_RETRY_QUEUE` | `codehive_notification_email_retry_queue` | delayed retry |
| `NOTIFICATION_EMAIL_DLQ` | `codehive_notification_email_dlq` | exhausted or incompatible messages |

Notification queues use durable direct exchanges and are described in `llms/backend/notifications/README.md`.

## Execution Flow (student submissions)

### Producer
ExecutionRequestProducer:
1. Receives ExecutionJob from ExecutionRequestService.
2. Publishes to `codehive_queue` via RabbitTemplate.convertAndSend.
3. Rethrows on publish failure.

Payload: `model/dto/queue/ExecutionJob`

### Consumer
ExecutionResultListener:
1. Listens on `codehive_result_queue`.
2. Receives ExecutionReport from worker.
3. Delegates to ExecutionResultService for execution entity update.

Payload: `model/dto/queue/ExecutionReport`

## Test Generation Flow (assignment creation)

### Producer
TestGenerationRequestProducer:
1. Receives TestGenerationJob from AssignmentService after files are uploaded to MinIO.
2. Publishes to `codehive_test_generation_queue`.

Payload: `model/dto/queue/TestGenerationJob`

### Consumer
TestGenerationResultListener:
1. Listens on `codehive_test_generation_result_queue`.
2. On success: sets `assignment.isActive = true` in the database.
3. On failure: logs error — assignment stays inactive.

Payload: `model/dto/queue/TestGenerationResult`

## Reliability Notes
- All queues are declared durable — messages survive broker restarts.
- Listeners catch and log processing errors to prevent silent failures.
- Producers rethrow publish exceptions so the caller can handle them.

## Compatibility Rules
- Treat queue DTO changes as contract changes.
- If fields are added, coordinate worker and backend deployment.
- Keep default queue names stable unless infrastructure update is coordinated.
- Both sides (backend and worker) declare the same queues — no exchange routing is used.

## Operational Tips
- Verify backend and worker use matching queue names.
- Keep RabbitMQ running before starting either service.
- Use `[WORKFLOW]`-prefixed log lines to trace message flow end to end.
