# Backend Service Layer Implementation

## Scope
This document explains service-layer responsibilities and coordination patterns in codehive-backend.

Service classes:
- AuthService
- RecoveryPasswordService
- CsvRegistrationService
- AssignmentService
- ExecutionRequestService
- ExecutionResultService
- ObjectStorageService
- MailSenderService

## Service Layer Role
- Own business logic and workflows.
- Orchestrate repositories, messaging, storage, and integrations.
- Keep controllers thin and persistence details encapsulated.
- Enforce transactional boundaries where needed.

## AuthService
Responsibilities:
- Login using email or enrollment number identifier.
- Admin-driven user registration.
- CSV batch registration support.
- JWT issuance and user retrieval by token or email.
- Password updates (verify current, encode new, clear temporaryPassword flag).

Key methods:
- `getUserByEmail(email)` — load UserDTO from email; used by controllers that receive `Authentication`
- `updatePassword(userId, request)` — verifies current password and persists the new one

Key dependencies:
- UserRepository, PasswordEncoder, JwtUtil, MailSenderService

## RecoveryPasswordService
Responsibilities:
- Handle forgot-password with neutral response messaging.
- Invalidate previous unused reset tokens.
- Generate and persist a new token with 15-minute expiry.
- Validate token (exists, not expired, not used) and update password.

Key dependencies:
- PasswordResetTokenRepository, UserRepository, PasswordEncoder, MailSenderService

## CsvRegistrationService
Responsibilities:
- Async parsing and processing of CSV rows.
- Row-by-row validation and persistence.
- Progress and completion events through WebSocket handler.

Execution model:
- Runs with @Async.
- Uses taskId routing to send progress to subscribed clients.

## AssignmentService
Responsibilities:
- Create Assignment, ReferenceSolution, and TestCase entities in one transaction.
- Upload reference solution and test case inputs to MinIO via ObjectStorageService.
- Publish TestGenerationJob to `codehive_test_generation_queue`.
- Assignment is created with `isActive = false`; activated only after worker confirms output generation.

Key dependencies:
- AssignmentRepository, TestCaseRepository, ReferenceSolutionRepository
- ObjectStorageService, TestGenerationRequestProducer

Key detail: `sampleFlags` from the request is a parallel list to the uploaded files indicating which test cases are samples. Missing flags default to false.

## ExecutionRequestService
Responsibilities:
- Load Assignment entity to get real time/memory limits, comparator, and test count.
- Load ReferenceSolution to determine reference language and storage path.
- Create Execution entity.
- Upload source code to MinIO.
- Build and publish ExecutionJob to `codehive_queue`.
- Fetch and deserialize the execution report JSON from MinIO.

Key methods:
- `requestExecution(ExecutionRequest)` — full submission flow; returns ExecutionDTO for polling
- `getExecutionById(UUID)` — status polling
- `getExecutionReport(UUID)` — downloads `report.json` from MinIO and deserializes via ObjectMapper; returns 404 if pending or not found

Key dependencies:
- ExecutionRepository, AssignmentRepository, ReferenceSolutionRepository, TestCaseRepository
- ObjectStorageService, ExecutionRequestProducer, UserRepository, ObjectMapper

PRACTICE mode: uses inline testCases, resolves reference solution from DB.
DEFINITIVE mode: numTests counted from TestCaseRepository, no reference solution needed at runtime.

## ExecutionResultService
Responsibilities:
- Consume worker reports (via listener call chain).
- Update execution status, timeMs, and memoryMb.
- Persist result summary for polling clients.

## ObjectStorageService
Responsibilities:
- Upload artifacts to MinIO bucket: stream or plain-text overloads.
- Download artifacts by object key.

All keys follow ObjectKeyBuilder conventions.

## MailSenderService
Responsibilities:
- Send password recovery emails with reset links.
- Send welcome emails with temporary credentials.

Configuration-driven fields:
- frontend.url
- spring.mail.username

## Transaction and Error Patterns
- Write operations use @Transactional.
- Read-only fetches use @Transactional(readOnly = true) where applicable.
- Domain-specific exceptions are propagated and translated by GlobalExceptionHandler.

## Service Conventions
- Keep each service focused by domain.
- Avoid direct HTTP concerns in services.
- Keep queue and storage payload-building deterministic.
- Prefer explicit logging at workflow boundaries for observability.
