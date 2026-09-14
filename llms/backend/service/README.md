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
- AdminUserService

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
- Enforce group ownership and read access through active enrollment.
- Create Assignment, ReferenceSolutionRevision, TestSuiteRevision, and TestCase entities in one transaction.
- Persist ordered instructional examples separately from executable test cases.
- Validate launch/due/close ordering.
- Build owner-only clone-form snapshots from assignment metadata plus MinIO reference/test input content.
- Create clones from the complete edited snapshot in another owned active writable group; clone dates
  remain null unless the teacher explicitly supplies new values.
- Reject explicitly supplied launch, due, or close dates before current time during create,
  clone, and update flows; still enforce `launchDate <= dueDate <= closeDate`.
- When due date is extended, change late submissions whose creation time now falls on or
  before new deadline to on-time. Clearing due date changes every late submission to on-time.
  Deadline shortening does not retroactively mark submissions late.
- Upload reference solution and test case inputs to MinIO via ObjectStorageService.
- Publish TestGenerationJob to `codehive_test_generation_queue`.
- Assignment is logically active on creation and has validationStatus PROCESSING until the worker reports READY or FAILED.

## GroupService
Responsibilities:
- Create scope-authorized groups with random, unique join codes.
- Enroll only STUDENT users while retaining leave/removal history.
- Enforce owner-only roster, archive, logical-delete, restore, update, and join-code rotation operations regardless of owner role.
- Treat archived groups as read-only and hide logically deleted groups from students.

## AdminUserService
Responsibilities:
- Paginated user lookup and profile updates.
- Reversible account deactivation while preserving related academic data.
- Target-role-specific authorization for user and admin management.
- Guarded scope delegation, self-management prevention, and last-superadmin protection.

## Delivery validation
- Execution identity always comes from the authenticated JWT principal; client requesterId is ignored.
- Students require active enrollment and assignments must be launched, logically active, and READY.
- Definitive deliveries are accepted repeatedly until closeDate and create immutable Submission rows.
- Deliveries after dueDate are persisted with deliveredLate=true, subject to later
  late-to-on-time reconciliation when teacher extends or clears due date.

Key dependencies:
- AssignmentRepository, TestCaseRepository, ReferenceSolutionRevisionRepository
- ObjectStorageService, TestGenerationRequestProducer

Key detail: `sampleFlags` from the request is a parallel list to the uploaded files indicating which test cases are samples. Missing flags default to false.

## ExecutionRequestService
Responsibilities:
- Load Assignment entity to get real time/memory limits, comparator, and test count.
- Load active ReferenceSolutionRevision to determine reference language and storage path.
- Create Execution entity.
- Upload source code to MinIO.
- Build and publish ExecutionJob to `codehive_queue`.
- Fetch and deserialize the execution report JSON from MinIO.

Key methods:
- `requestExecution(ExecutionRequest)` — full submission flow; returns ExecutionDTO for polling
- `getExecutionById(UUID)` — status polling
- `getExecutionReport(UUID)` — downloads `report.json` from MinIO and deserializes via ObjectMapper; returns 404 if pending or not found

Key dependencies:
- ExecutionRepository, AssignmentRepository, TestCaseRepository
- ObjectStorageService, ExecutionRequestProducer, UserRepository, ObjectMapper

PRACTICE mode: uses inline testCases and active reference-solution revision.
DEFINITIVE mode: ordered test cases and complete object keys come from the
active test-suite revision; no reference solution is needed at runtime.

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
- Queue welcome emails with temporary credentials on a bounded async executor so
  user creation and CSV processing do not wait for SMTP.
- Log welcome-email delivery failures without rolling back the created account;
  users can recover access through the forgot-password flow.

Configuration-driven fields:
- frontend.url
- spring.mail.username
- app.email.welcome.core-pool-size (default 2)
- app.email.welcome.max-pool-size (default 4)
- app.email.welcome.queue-capacity (default 5000)

## Transaction and Error Patterns
- Write operations use @Transactional.
- Read-only fetches use @Transactional(readOnly = true) where applicable.
- Domain-specific exceptions are propagated and translated by GlobalExceptionHandler.

## Service Conventions
- Keep each service focused by domain.
- Avoid direct HTTP concerns in services.
- Keep queue and storage payload-building deterministic.
- Prefer explicit logging at workflow boundaries for observability.
