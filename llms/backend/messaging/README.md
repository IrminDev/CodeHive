# Backend Messaging Implementation

## Scope
This document covers backend message production/consumption for code execution workflows.

Key classes:
- config/RabbitConfig.java
- messaging/producer/ExecutionRequestProducer.java
- messaging/listener/ExecutionResultListener.java

## Queue Topology
Configured in RabbitConfig:
- Request queue: codehive_queue (default, configurable by system property)
- Result queue: codehive_result_queue (default, configurable by system property)

Message converter:
- Jackson2JsonMessageConverter for JSON serialization/deserialization.

## Producer Flow
ExecutionRequestProducer:
1. Receives ExecutionJob from service layer.
2. Logs execution context and limits.
3. Publishes to request queue using RabbitTemplate.convertAndSend.

Produced payload model:
- model/dto/queue/ExecutionJob.java

## Consumer Flow
ExecutionResultListener:
1. Listens on configured result queue.
2. Receives ExecutionReport payload.
3. Delegates to ExecutionResultService for database update.
4. Logs processing success/failures.

Consumed payload model:
- model/dto/queue/ExecutionReport.java

## Reliability Notes
- Queues are declared durable in RabbitConfig.
- Listener catches processing errors and logs them to prevent silent failures.
- Producer rethrows publish exceptions.

## Compatibility Rules
- Treat queue DTO changes as contract changes.
- If fields are added, coordinate worker and backend deployment.
- Keep default queue names stable unless infrastructure update is coordinated.

## Operational Tips
- Verify backend and worker use matching queue names.
- Keep RabbitMQ running before submitting execution requests.
- Use execution logs to trace request id and status transitions.
