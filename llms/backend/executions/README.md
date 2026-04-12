# Backend Execution Orchestration

## Scope
This document explains how the backend receives execution requests, persists execution state, stores source code, and coordinates with the worker.

Primary classes:
- controller/CheckExecutionController.java
- service/ExecutionRequestService.java
- service/ExecutionResultService.java
- messaging/producer/ExecutionRequestProducer.java
- messaging/listener/ExecutionResultListener.java

## Request-to-Queue Flow
1. Client sends ExecutionRequest to POST /api/execution/check.
2. Controller validates payload and delegates to ExecutionRequestService.
3. Service creates Execution entity with status PENDING.
4. Source code is uploaded to MinIO via ObjectStorageService.
5. Service builds ExecutionJob payload.
6. Producer sends ExecutionJob to RabbitMQ queue.
7. API returns 202 Accepted with ExecutionDTO (for polling).

## Result Processing Flow
1. Worker publishes ExecutionReport.
2. ExecutionResultListener consumes the report.
3. ExecutionResultService loads execution by id.
4. Status/time/memory are updated in the executions table.
5. Client retrieves updated status via GET /api/execution/check/{id}.

## Key Data Contracts
API request:
- model/request/execution/ExecutionRequest.java

Queue request:
- model/dto/queue/ExecutionJob.java

Queue result:
- model/dto/queue/ExecutionReport.java

API polling response:
- model/dto/ExecutionDTO.java

## Current Constraints and Defaults
- Time and memory limits are currently static defaults in ExecutionRequestService:
  - time: 1000 ms
  - memory: 256 MB
- Comparator type is currently fixed to EXACT_MATCH.
- Reference language is currently hard-coded in job building path.
- TODO comments indicate this is temporary and should become assignment-driven.

## Storage Keys and Artifacts
Object paths are generated through ObjectKeyBuilder:
- execution source keys
- execution output keys
- test suite and reference keys

File extension mapping is resolved by FileExtensionUtil based on Language enum.

## Persistence Model
Execution entity fields track:
- executionType
- status
- timeMs
- memoryMb
- createdAt
- isOutdated
- optional user
- optional submission

Repository:
- repository/ExecutionRepository.java

## Extension Guidance
- Move defaults to assignment configuration and database-backed policies.
- Version queue payloads when adding fields to avoid producer/consumer drift.
- Keep execution polling backward compatible for frontend stability.
