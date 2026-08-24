# Backend Email Notifications

## Documentación funcional y técnica

La especificación completa en español está separada por propósito:

- [Requisitos funcionales](REQUIREMENTS.md): actores, precondiciones, flujos principales, flujos alternativos y postcondiciones.
- [Restricciones y reglas de negocio](BUSINESS_RULES.md): catálogo, destinatarios, preferencias, fechas, deduplicación y garantías.
- [Descripción técnica](TECHNICAL_DESIGN.md): componentes, persistencia, eventos, RabbitMQ, estrategias, plantillas y operación.

Estos documentos describen el comportamiento implementado, incluidos los
eventos de edición, feedback, calificación y revaluación.

## Scope

Email notifications run inside `codehive-backend`. RabbitMQ separates request handling from SMTP delivery, but there is no notification microservice.

The implementation covers:

- Per-user email settings and per-notification overrides.
- Role-specific notification catalogs.
- Domain-event routing after successful database commits.
- Scheduled assignment publication and deadline reminders.
- RabbitMQ delivery, delayed retry, and dead-letter handling.
- English HTML and plain-text templates using the CodeHive landing-page palette.
- Existing welcome and password-reset emails migrated to the same branded template system.

## Architecture

Runtime flow:

1. A service completes a group, assignment, validation, submission, or execution transaction.
2. It publishes a `NotificationDomainEvent`.
3. `NotificationDomainEventRouter` handles the event after commit and resolves recipients.
4. `NotificationDispatchService` verifies the recipient preference and publishes a `NotificationMessage`.
5. `NotificationEmailListener` consumes the message from RabbitMQ.
6. `NotificationStrategyRegistry` selects the strategy for the notification type.
7. The strategy loads current domain data and creates `NotificationEmailContent`.
8. `MailSenderService` renders HTML and plain text and sends through the existing SMTP account.
9. A failed message waits five minutes in the retry queue. After the configured maximum attempts it moves to the dead-letter queue.

This is an in-process producer/consumer design: the producer and consumer are Spring beans in the same backend application, while RabbitMQ persists and tracks pending work.

## RabbitMQ Topology

| Resource | Name | Purpose |
|---|---|---|
| Direct exchange | `codehive.notification.exchange` | Main and failed-email routes |
| Main queue | `codehive_notification_email_queue` | Pending email work |
| Retry exchange | `codehive.notification.retry.exchange` | Routes failed work to the delayed queue |
| Retry queue | `codehive_notification_email_retry_queue` | Holds messages for five minutes, then dead-letters them back to the main exchange |
| Dead-letter queue | `codehive_notification_email_dlq` | Messages that exhausted retries or have an unsupported schema |

New `NotificationMessage` records use schema version `2` and carry an optional
`resourceId` for the exact enrollment, assignment update, test-suite revision,
execution, feedback, or grade that triggered the email. Consumers accept versions `1` and `2`; version
`1` messages render reduced content when exact context is unavailable.

## Preference Model

`UserNotificationSettings` contains:

- `emailEnabled`: master email switch; default `true`.
- `timezone`: IANA timezone; default `America/Mexico_City`.
- `locale`: currently restricted to `en-US`.

`UserNotificationPreference` contains sparse overrides:

- `(user, notificationType)` is unique.
- `enabled` overrides the default-enabled behavior.
- `reminderLeadMinutes` is only valid for reminder types.
- Allowed reminder lead times are 120, 1440, 2880, and 10080 minutes.

Missing rows mean defaults apply. This avoids creating a full preference catalog row set for every new user.

## Notification Catalog

Teacher notifications:

- `STUDENT_ENROLLED`
- `STUDENT_LEFT`
- `ASSIGNMENT_SUBMITTED`
- `LATE_ASSIGNMENT_SUBMITTED`
- `ASSIGNMENT_DUE_SOON`
- `ASSIGNMENT_CLOSE_SOON`
- `ASSIGNMENT_VALIDATION_FAILED`
- `ASSIGNMENT_READY`

For `ASSIGNMENT_VALIDATION_FAILED`, the teacher email includes the failed revision's
stored worker diagnostic (compiler stderr or generation error). Rendering is bounded
to 2,000 characters and 20 lines, strips control characters, and indicates when the
displayed output was truncated. Full bounded output remains in the failed revision.

Student notifications:

- `ASSIGNMENT_PUBLISHED`
- `ASSIGNMENT_DUE_SOON_NO_SUBMISSION`
- `ASSIGNMENT_CLOSE_SOON_NO_SUBMISSION`
- `ASSIGNMENT_RESCHEDULED`
- `SUBMISSION_EVALUATED`
- `FEEDBACK_RECEIVED`
- `REMOVED_FROM_GROUP`
- `GROUP_ARCHIVED`

Assignment editing, test-suite updates, feedback, returned grades, cleared grades,
and submission re-evaluation publish their corresponding domain events after commit.

## Preference API

All routes require the authenticated user. The identity comes from the security context; a request cannot select another user's ID.

| Method | Route | Behavior |
|---|---|---|
| GET | `/api/notification-preferences` | Returns global settings and the complete role-specific catalog with defaults merged with overrides |
| PUT | `/api/notification-preferences` | Updates global settings and the supplied sparse overrides |
| POST | `/api/notification-preferences/reset` | Deletes overrides and restores defaults |
| POST | `/api/notification-preferences/test-email` | Sends one test email; limited to three requests per five minutes |

## Scheduling and Deduplication

`NotificationReminderScheduler` runs every ten minutes by default and looks ahead seven days.

- It publishes an assignment notification once the assignment is `READY`, active, its group is active and not archived, and its launch time has arrived.
- It sends teacher due and close reminders according to the teacher's selected lead time.
- It sends student due and close reminders only when the student has no definitive submission for that assignment.
- It never sends a reminder after its associated deadline.

`NotificationDispatchLog` stores only deterministic dispatch keys for events that can be rediscovered by a scheduler, such as publication and reminders. It is not a pending-email table; RabbitMQ remains the pending-work store.

Changing a reminder lead time creates a distinct dispatch key. This allows one reminder at the newly selected window without duplicating the same configured window.

## Business Constraints

- Notification types are restricted to their intended role.
- Inactive users receive no notification.
- The global email switch overrides every individual type.
- Email is checked again when the consumer receives a message, so a user can disable a notification after it was queued and before it is sent.
- Domain events are routed only after the transaction commits.
- Archived or logically deleted groups are excluded from scheduled publication and reminders.
- Dates use the recipient's configured timezone without displaying the redundant
  IANA timezone identifier in each email.
- Every `NotificationType` has dedicated HTML and plain-text templates. Shared
  layout fragments provide branding while each type keeps event-specific copy,
  facts, callouts, and deep links.
- Email content and date wording are English (`en-US`).
- Both HTML and plain-text MIME alternatives are sent.
- SMTP credentials continue to come from the existing `spring.mail.*` configuration.
- Queue delivery is at-least-once. A process failure after SMTP accepts an email but before RabbitMQ acknowledges it can cause a rare duplicate; SMTP does not provide a distributed exactly-once transaction.

## Configuration

Environment-backed properties:

- `NOTIFICATION_EMAIL_MAX_ATTEMPTS` — default `5`.
- `NOTIFICATION_REMINDER_FIXED_DELAY_MS` — default `600000`.
- `NOTIFICATION_REMINDER_INITIAL_DELAY_MS` — default `60000`.
- Existing `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_SMTP_AUTH`, and `MAIL_STARTTLS_ENABLE`.

## Extension Rules

To add a notification:

1. Add the value and role metadata to `NotificationType`.
2. Add it to exactly one `NotificationStrategy.supportedTypes()` set.
3. Implement its content in that strategy or create a new strategy.
4. Publish a domain event from the transaction that owns the business change, or add scheduler logic for time-based behavior.
5. Add focused tests for recipient selection, preferences, content, and retry behavior.

The registry fails application startup if two strategies claim the same type or if a catalog type has no strategy.
