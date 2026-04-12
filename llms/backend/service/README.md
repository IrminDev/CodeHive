# Backend Service Layer Implementation

## Scope
This document explains service-layer responsibilities and coordination patterns in codehive-backend.

Service classes:
- AuthService
- RecoveryPasswordService
- CsvRegistrationService
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
- JWT issuance and user retrieval by token.

Key dependencies:
- UserRepository
- PasswordEncoder
- JwtUtil
- MailSenderService

## RecoveryPasswordService
Responsibilities:
- Handle forgot-password with neutral response messaging.
- Invalidate previous unused reset tokens.
- Generate and persist a new token with 15-minute expiry.
- Validate token (exists, not expired, not used) and update password.

Key dependencies:
- PasswordResetTokenRepository
- UserRepository
- PasswordEncoder
- MailSenderService

## CsvRegistrationService
Responsibilities:
- Async parsing and processing of CSV rows.
- Row-by-row validation and persistence.
- Progress and completion events through WebSocket handler.

Execution model:
- Runs with @Async.
- Uses taskId routing to send progress to subscribed clients.

## ExecutionRequestService
Responsibilities:
- Create execution records.
- Persist source code to object storage.
- Build ExecutionJob payload.
- Send execution request to RabbitMQ.

Current implementation notes:
- Contains TODOs indicating current behavior is oriented to manual test execution.
- Uses default time/memory/comparator values pending assignment-driven policies.

## ExecutionResultService
Responsibilities:
- Consume worker reports (via listener call chain).
- Update execution status and resource metrics.
- Persist result summary for polling clients.

## ObjectStorageService
Responsibilities:
- Upload and download artifacts from MinIO bucket.
- Support both stream uploads and plain-text content uploads.

## MailSenderService
Responsibilities:
- Send password recovery emails.
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
