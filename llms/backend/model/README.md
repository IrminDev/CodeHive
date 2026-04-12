# Backend Model Implementation

## Scope
This document describes backend data modeling: entities, DTOs, mappers, request/response contracts, enums, and exception structure.

Package root:
- codehive-backend/src/main/java/com/github/codehive/model

## Entity Model
Entities are plain JPA classes with explicit constraints via @Column and relationship annotations.

### User
File: model/entity/User.java

Important constraints:
- name: nullable=false, length=50
- lastName: nullable=false, length=80
- enrollmentNumber: nullable=false, unique=true, length=50
- email: nullable=false, unique=true, length=100
- password: nullable=false, length=255
- role: enum stored as string, length=15

Behavior notes:
- Implements UserDetails for Spring Security integration.
- createdAt defaults to LocalDateTime.now().
- isActive defaults to true.
- temporaryPassword defaults to false.
- scopes stored as element collection in user_scopes table.

### PasswordResetToken
File: model/entity/PasswordResetToken.java

Important constraints:
- token unique and non-null.
- expiryDate non-null.
- used non-null default false.
- ManyToOne relation to User (nullable=false).

### Assignment
File: model/entity/Assignment.java

Important constraints:
- title length 200, non-null.
- description TEXT, non-null.
- timeLimitMs and memoryLimitMb non-null.
- comparatorType enum string, non-null.
- createdAt and updatedAt non-null.

Collection-backed tables:
- assignment_constraints
- assignment_hints
- assignment_tags
- assignment_allowed_languages

### Submission
File: model/entity/Submission.java
- ManyToOne assignment relation (non-null).
- language enum string (non-null).
- createdAt initialized in constructor.

### Execution
File: model/entity/Execution.java

Important constraints and semantics:
- executionType and status are required enums.
- status defaults to PENDING.
- isOutdated defaults to false.
- submission is nullable (practice executions may have no submission).
- user relation is nullable (depends on requester context).

### TestCase
File: model/entity/TestCase.java
- assignment relation required.
- order stored as order_index, non-null.
- isSample default false.

### ReferenceSolution
File: model/entity/ReferenceSolution.java
- assignment relation required.
- language enum required.

## Request Contract Structure
Request classes live under model/request grouped by domain:
- auth/LoginRequest
- auth/SignUpRequest
- recovery/ForgotPasswordRequest
- recovery/RecoveryPasswordRequest
- execution/ExecutionRequest

Validation patterns:
- @NotBlank for required strings.
- @NotNull for required enum fields.
- @Size for password and text boundaries.
- @Email for email format in signup.

Examples of enforced constraints:
- login password min length 6.
- signup name 2..50.
- signup father/mother last name 2..40.
- recovery new password min length 6.

## Response Contract Structure
Base response pattern:
- ApiResponse(success, message)

Concrete wrappers:
- SuccessResponse<T> for successful payload responses.
- ErrorResponse for timestamped API failures.
- MessageResponse for simple text payloads.

Auth-specific responses:
- auth/AuthResponse (token + UserDTO)
- auth/CsvBulkRegisterResponse
- auth/CsvProgressMessage

## DTO and Mapper Layer
DTOs mirror API-safe views and queue contracts.

Application DTO examples:
- UserDTO
- ExecutionDTO
- AssignmentDTO
- SubmissionDTO

Queue DTO examples:
- queue/ExecutionJob
- queue/ExecutionReport

Mappers convert entity <-> DTO, for example:
- ExecutionMapper
- UserMapper
- AssignmentMapper

## Enum Strategy
Enums are persisted and transferred as string values:
- Role, Scope
- Language
- ExecutionType
- ExecutionStatus
- ComparatorType

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
- Queue DTO evolution must be coordinated across services.
