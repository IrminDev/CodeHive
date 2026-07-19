# Backend Model Implementation

## Scope
This document describes backend data modeling: entities, DTOs, mappers, request/response contracts, enums, and exception structure.

Package root:
- codehive-backend/src/main/java/com/github/codehive/model

## Entity Model
Entities are plain JPA classes with explicit constraints via @Column and relationship annotations.
All primary keys use `java.util.UUID` with `@GeneratedValue(strategy = GenerationType.UUID)`.

### User
File: model/entity/User.java
- name: nullable=false, length=50
- lastName: nullable=false, length=80
- enrollmentNumber: nullable=false, unique=true, length=50
- email: nullable=false, unique=true, length=100
- password: nullable=false, length=255
- role: enum stored as string, length=15
- Implements UserDetails for Spring Security integration.
- createdAt defaults to LocalDateTime.now(); isActive defaults to true; temporaryPassword defaults to false.
- scopes stored as element collection in user_scopes table.

### PasswordResetToken
File: model/entity/PasswordResetToken.java
- token: unique, non-null
- expiryDate: non-null; tokens expire after 15 minutes
- used: non-null, default false
- ManyToOne relation to User (nullable=false)

### Assignment
File: model/entity/Assignment.java
- Belongs to one `ClassGroup` and records the teacher author.
- title: length 200, non-null
- description: TEXT, non-null
- timeLimitMs, memoryLimitMb: non-null
- comparatorType: enum string, non-null
- isActive: logical deletion flag; independent from worker validation and launch visibility
- allowedLanguages, constraints, hints, tags: element collections in dedicated tables
- launchDate, dueDate, closeDate use absolute timestamps and satisfy launch <= due <= close when present
- validationStatus: PROCESSING, READY, or FAILED
- examples: ordered `AssignmentExample` entities with TEXT input, output, and explanation

### ClassGroup and GroupEnrollment
- `ClassGroup` has exactly one teacher owner, a unique case-insensitive join code, `archived`, and `isActive` flags.
- Archived groups are read-only. `isActive=false` is logical deletion and preserves assignments for cloning.
- `GroupEnrollment` is a history-preserving join entity with ACTIVE, LEFT, and REMOVED states.
- The `(group_id, student_id)` pair is unique; rejoining reactivates the historical record.

### Submission
File: model/entity/Submission.java
- ManyToOne assignment (non-null)
- ManyToOne student (non-null)
- deliveredLate is fixed when a definitive delivery is created
- language: enum string (non-null)
- createdAt initialized in constructor

### Execution
File: model/entity/Execution.java
- executionType and status: required enums (status defaults to PENDING)
- isOutdated defaults to false
- submission nullable (practice executions have no submission)
- user nullable
- timeMs, memoryMb: set from worker result

### TestCase
File: model/entity/TestCase.java
- assignment relation required
- order stored as order_index, non-null; represents 1-based upload position
- isSample defaults to false

### ReferenceSolution
File: model/entity/ReferenceSolution.java
- assignment relation required
- language: enum required
- one ReferenceSolution per assignment per language; stored in MinIO at ObjectKeyBuilder.referenceSolutionSourceCode

## Request Contract Structure
Request classes live under model/request grouped by domain:
- auth/LoginRequest
- auth/SignUpRequest
- recovery/ForgotPasswordRequest
- recovery/RecoveryPasswordRequest
- execution/ExecutionRequest
- assignment/CreateAssignmentRequest

### CreateAssignmentRequest fields
- groupId, launchDate, dueDate, closeDate, examples
- title, description, constraints, hints, tags
- timeLimitMs (@Min 100), memoryLimitMb (@Min 16)
- comparatorType, allowedLanguages, referenceLanguage
- dueDate (nullable)
- sampleFlags: parallel list to uploaded files; true = sample test case

Validation patterns:
- @NotBlank for required strings
- @NotNull for required enum fields
- @NotEmpty for required collections
- @Min for numeric limits

## Response Contract Structure
Base response pattern:
- ApiResponse(success, message)

Concrete wrappers:
- SuccessResponse<T> for successful payload responses
- ErrorResponse for timestamped API failures
- MessageResponse for simple text payloads

Auth-specific responses:
- auth/AuthResponse (token + UserDTO)
- auth/CsvBulkRegisterResponse
- auth/CsvProgressMessage

## DTO and Mapper Layer
Application DTOs:
- UserDTO, ExecutionDTO, AssignmentDTO, SubmissionDTO, TestCaseDTO, ReferenceSolutionDTO

Queue DTOs (model/dto/queue):
- ExecutionJob — student execution job sent to worker
- ExecutionReport — student execution result from worker
- TestGenerationJob — assignment output generation job sent to worker; contains List<TestCaseInfo>
- TestCaseInfo — per-test-case input/output MinIO paths
- TestGenerationResult — outcome of output generation; drives assignment activation

Mappers convert entity <-> DTO:
- ExecutionMapper, UserMapper, AssignmentMapper, SubmissionMapper, TestCaseMapper, ReferenceSolutionMapper

## Enum Strategy
Enums are persisted and transferred as string values:
- Role, Scope
- Language (JAVA, PYTHON, C, CPP)
- ExecutionType (PRACTICE, DEFINITIVE)
- ExecutionStatus (AC, WA, CE, RTE, TLE, MLE, OLE, PENDING) — OLE = Output Limit Exceeded (> 4 MB combined stdout+stderr)
- ComparatorType (EXACT_MATCH, FLOATING_POINT)

## Exception Model
Exception packages are domain-grouped:
- exception/auth
- exception/recovery
- exception/handler

GlobalExceptionHandler maps exceptions to stable HTTP responses and ErrorResponse payloads.

## Practical Modeling Rules
- Keep entity constraints aligned with request validation, not looser.
- Prefer DTO exposure over returning entities directly.
- If adding enum values, validate impact on frontend and worker contracts.
- Queue DTO evolution must be coordinated across backend and worker — both projects declare mirrored copies.
- All IDs are UUID, never Long.
