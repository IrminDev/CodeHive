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
- Create/clone assignment AI policy as disabled/0/conceptual by default. `AssignmentAiPolicyService` applies owner-authorized immediate policy changes on a separate versioned row, without invoking worker validation.

## GroupService
Responsibilities:
- Create scope-authorized groups with random, unique join codes.
- Enroll only STUDENT users while retaining leave/removal history.
- Enforce owner-only roster, archive, logical-delete, restore, update, and join-code rotation operations regardless of owner role.
- Treat archived groups as read-only and hide logically deleted groups from students.
- Archive and logical deletion call `AssistantTextPurgeService` transactionally to erase assistant text and cancel pending responses while retaining charged usage records. Admin-owned group lifecycle changes use the same purge.

## AssistantHistoryService
- Lists and retrieves authenticated student's own interaction records; current enrollment and assignment openness are not prerequisites for history reads.
- Only metadata remains after group archive/deletion.

## Assistant stages 3–5
- `AssistantTransactionService` serializes reservation and finalization with group/conversation locks, uses interaction rows as lifetime quota ledger, enforces idempotency and lease expiry, and never calls a model in a transaction. `AssistantLeaseRecoveryJob` expires abandoned requests.
- `AssistantContextService` builds allowlisted public assignment data, current editor code only after explicit opt-in, and latest eligible student execution summary only after separate opt-in. It omits definitive hidden diagnostics and policy-incompatible or erased history.
- `AssistantGuardrailService` classifies inputs, generates structured candidate answers, applies deterministic and semantic output checks, permits one regeneration, and can revalidate an approved candidate against a changed policy without generating another answer. `SpringAiAssistantModelGateway` adapts Spring AI `ChatModel`; the Google GenAI starter supplies Gemini when `ASSISTANT_MODEL_PROVIDER=google-genai` and `GEMINI_API_KEY` are set. `GEMINI_MODEL` defaults to `gemini-3.5-flash-lite`; provider defaults to `none`, so startup needs no key. Gateway bounds output, concurrency, per-call timeout, and per-process provider calls per minute; project-level Gemini RPM/TPM/RPD remain external limits.
- `AssistantService` orchestrates student-only POST/availability through `AssistantController`, using immutable refreshed policy snapshots to avoid same-request JPA cache/version races. Model calls occur outside ledger transactions; finalization locks group/conversation and rechecks policy and eligibility. Provider failure stops uncharged; archive clears text and prevents late answer release. Global `ASSISTANT_ENABLED` defaults false. Outcome logs use IDs/status/attempts/duration/safe code only; model logs use model ID/token totals/duration only. Provider rate-limit responses map to `MODEL_RATE_LIMITED` without raw provider details.

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

## Assistant usage instrumentation

`AssistantModelCallRecorder` persists technical calls in independent short transactions.
Context carries interaction ID, stage, attempt, and prompt version through executor explicitly.
Provider text never enters telemetry. Start failures prevent transmission; terminal writes are
idempotent. Caller timeout stays separate from late provider results. Scheduled recovery marks
old STARTED rows UNKNOWN without calling provider. Legacy interaction token columns are unused.
See [implementation status](../../../docs/ai-assistant/AI_USAGE_IMPLEMENTATION.md).
