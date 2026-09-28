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
   - Validation rejects more than 50 test inputs, a time limit outside 100–10,000 ms,
     or a memory limit outside 16–1,000 MB.
2. AssignmentService:
   - Creates a logically active Assignment with validationStatus PROCESSING.
   - Creates a PROCESSING ReferenceSolutionRevision and TestSuiteRevision.
   - Creates TestCase entities bound to that test-suite revision (order = upload position, isSample from sampleFlags).
   - Uploads reference solution to `assignments/{assignmentId}/test-suite-revisions/{revisionId}/reference/Main.{ext}`.
   - Uploads each test case input under its test-suite revision path.
   - Publishes TestGenerationJob to `codehive_test_generation_queue`.
3. Worker generates expected outputs and publishes TestGenerationResult.
4. TestGenerationResultListener sets validationStatus READY on success or FAILED on failure.

The API returns 202 Accepted immediately — output generation is asynchronous.

## Assignment Update Flow

- Metadata-only changes apply immediately and notify active students when the
  assignment was already published.
- Reference-only changes are staged and run against the active tests. They are
  activated only when every output remains comparator-equivalent; they do not
  re-evaluate submissions or notify students.
- Test changes create an inactive complete test-suite revision. The proposed
  reference solution generates all expected outputs. Failure rejects the whole
  update; success atomically promotes metadata/reference/tests, clears grades,
  and re-evaluates each current non-withdrawn submission.
- Worker results carry update and revision IDs. Stale or mismatched results
  cannot activate a revision.

### Status model during an update

- `Assignment.validationStatus` (PROCESSING / READY / FAILED) describes the **active** revision and
  governs student visibility. A published assignment stays READY while a new revision is validated,
  so students keep using the live version and the assignment is never hidden mid-update.
- The in-flight staged change is a separate `AssignmentUpdate` (VALIDATING → APPLIED / REJECTED). It is
  surfaced to the owner as `AssignmentDTO.pendingUpdate` (true while an update is VALIDATING), which the
  teacher UI renders as an intermediate "Updating" indicator without touching `validationStatus`.
- Promotion always reaches a terminal `AssignmentUpdate` state: `reject(...)` covers stale results,
  worker failures and date validation, and the happy path sets APPLIED. Applying an update replaces the
  assignment's public examples **in place** (see `Assignment.setExamples`): existing rows are updated by
  position and only the surplus tail is removed, so Hibernate never inserts a duplicate
  `(assignment_id, order_index)` before deleting the old row — the former cause of the
  `uk_assignment_example_order` violation and its infinite listener requeue.
- `codehive_test_generation_result_queue` (and the other backend listeners) use bounded retries with
  `default-requeue-rejected=false`, so a genuinely failing message is retried a few times and then
  dropped instead of requeued forever.

## Request-to-Queue Flow (Student Execution)
1. Client sends ExecutionRequest to `POST /api/execution/check`.
2. Controller validates and delegates to ExecutionRequestService.
3. Service derives the user from the authenticated principal and validates group enrollment, lifecycle, dates, language, and worker readiness.
4. DEFINITIVE requests create an immutable Submission with a durable late flag.
5. Service creates Execution entity with status PENDING.
6. Source code is uploaded to MinIO via ObjectStorageService.
7. Service builds ExecutionJob with assignment-driven values.
8. Producer sends ExecutionJob to `codehive_queue`.
9. API returns 202 Accepted with ExecutionDTO (for polling).

## Result Processing Flow (Student Execution)
1. Worker publishes ExecutionReport.
2. ExecutionResultListener consumes the report.
3. ExecutionResultService loads execution by id.
4. Status, timeMs, and memoryMb are updated in the executions table. Worker memory
   values are MiB; missing telemetry remains null instead of becoming zero.
5. Client retrieves updated status via `GET /api/execution/check/{id}`.
6. Client retrieves the full per-test-case report via `GET /api/execution/check/{id}/report`.
   - Fetches `report.json` from MinIO at `executions/{id}/report.json` or the
     corresponding practice-execution path.
   - Returns 404 with a clear message when execution is still PENDING.
   - Deserializes into `ExecutionReport` using Jackson ObjectMapper.
   - Per-test results may include bounded `stderr` and `exitCode` diagnostics for
     CE, RTE, and MLE. PRACTICE results also include bounded expected output and
     captured stdout after successful reference execution; DEFINITIVE results keep
     private expected output and hidden input rules unchanged.

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
- Loads Assignment.activeReferenceSolutionRevision for language and reference path.
- Uses inline testCases from the request.
- timeLimitMs, memoryLimitMb, comparatorType come from Assignment entity.

DEFINITIVE mode:
- No reference solution path needed (outputs already in MinIO).
- Carries ordered test-case UUIDs and complete input/expected-output/artifact
  keys. The worker treats these paths as opaque.

## Storage Keys and Artifacts
Object paths are generated through ObjectKeyBuilder (utils/ObjectKeyBuilder.java).
File extension mapping resolved by FileExtensionUtil based on Language enum.

## Persistence Model
Assignment entity fields:
- group, author, ordered examples
- title, description, constraints, hints, tags
- allowedLanguages (element collection)
- timeLimitMs, memoryLimitMb, comparatorType
- launchDate, dueDate, closeDate, createdAt, updatedAt
- isActive (logical deletion) and validationStatus (PROCESSING, READY, FAILED)

Execution entity fields:
- executionType, status (PENDING → final)
- timeMs, memoryMb (set from worker result)
- isOutdated, createdAt
- optional user, optional submission

Repositories:
- repository/AssignmentRepository.java
- repository/ExecutionRepository.java
- repository/TestCaseRepository.java
- repository/ReferenceSolutionRevisionRepository.java
