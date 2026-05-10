# Backend Execution Orchestration

## Scope
This document explains assignment creation, execution requests, and execution result processing.

Primary classes:
- controller/AssignmentController.java
- controller/CheckExecutionController.java
- service/AssignmentService.java
- service/ExecutionRequestService.java
- service/ExecutionResultService.java
- messaging/producer/ExecutionRequestProducer.java
- messaging/producer/TestGenerationRequestProducer.java
- messaging/listener/ExecutionResultListener.java
- messaging/listener/TestGenerationResultListener.java

## Assignment Creation Flow (Teacher)
1. Teacher sends `POST /api/assignments` (multipart/form-data).
   - Part `metadata`: JSON matching CreateAssignmentRequest.
   - Part `referenceSolution`: source file.
   - Part `testCaseInputs`: list of test case input files.
2. AssignmentService:
   - Creates Assignment entity with `isActive = false`.
   - Creates ReferenceSolution entity.
   - Creates TestCase entities (order = upload position, isSample from sampleFlags).
   - Uploads reference solution to `test-suites/assignments/{id}/reference/Main.{ext}`.
   - Uploads each test case input to `test-suites/assignments/{id}/tc-{tcId}/tc{tcId}.in`.
   - Publishes TestGenerationJob to `codehive_test_generation_queue`.
3. Worker generates expected outputs and publishes TestGenerationResult.
4. TestGenerationResultListener sets `assignment.isActive = true` on success.

The API returns 202 Accepted immediately — output generation is asynchronous.

## Request-to-Queue Flow (Student Execution)
1. Client sends ExecutionRequest to `POST /api/execution/check`.
2. Controller validates and delegates to ExecutionRequestService.
3. Service loads Assignment to get real limits (timeLimitMs, memoryLimitMb, comparatorType).
4. Service creates Execution entity with status PENDING.
5. Source code is uploaded to MinIO via ObjectStorageService.
6. Service builds ExecutionJob with assignment-driven values.
7. Producer sends ExecutionJob to `codehive_queue`.
8. API returns 202 Accepted with ExecutionDTO (for polling).

## Result Processing Flow (Student Execution)
1. Worker publishes ExecutionReport.
2. ExecutionResultListener consumes the report.
3. ExecutionResultService loads execution by id.
4. Status, timeMs, and memoryMb are updated in the executions table.
5. Client retrieves updated status via `GET /api/execution/check/{id}`.
6. Client retrieves the full per-test-case report via `GET /api/execution/check/{id}/report`.
   - Fetches `report.json` from MinIO at `test-execution/execution-{id}/output/report.json`.
   - Returns 404 with a clear message when execution is still PENDING.
   - Deserializes into `ExecutionReport` using Jackson ObjectMapper.

## Key Data Contracts
Assignment creation request:
- model/request/assignment/CreateAssignmentRequest.java

Execution API request:
- model/request/execution/ExecutionRequest.java

Queue payloads:
- model/dto/queue/ExecutionJob.java
- model/dto/queue/ExecutionReport.java
- model/dto/queue/TestGenerationJob.java (contains list of TestCaseInfo)
- model/dto/queue/TestGenerationResult.java

API polling response:
- model/dto/ExecutionDTO.java

Full report response (from MinIO):
- model/dto/queue/ExecutionReport.java (deserialized from JSON stored by worker)

## Execution Job Construction
PRACTICE mode:
- Loads first ReferenceSolution for the assignment to get language and reference path.
- Uses inline testCases from the request.
- timeLimitMs, memoryLimitMb, comparatorType come from Assignment entity.

DEFINITIVE mode:
- No reference solution path needed (outputs already in MinIO).
- numTests counted from TestCaseRepository.
- testsPath from ObjectKeyBuilder.testsPath(assignmentId).

## Storage Keys and Artifacts
Object paths are generated through ObjectKeyBuilder (utils/ObjectKeyBuilder.java).
File extension mapping resolved by FileExtensionUtil based on Language enum.

## Persistence Model
Assignment entity fields:
- title, description, constraints, hints, tags
- allowedLanguages (element collection)
- timeLimitMs, memoryLimitMb, comparatorType
- dueDate, createdAt, updatedAt
- isActive (false while generation in progress, true when ready)

Execution entity fields:
- executionType, status (PENDING → final)
- timeMs, memoryMb (set from worker result)
- isOutdated, createdAt
- optional user, optional submission

Repositories:
- repository/AssignmentRepository.java
- repository/ExecutionRepository.java
- repository/TestCaseRepository.java
- repository/ReferenceSolutionRepository.java
