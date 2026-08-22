# Backend Controller Layer

## Scope
This document describes how HTTP controllers are implemented and how requests flow to services.

Controller classes:
- codehive-backend/src/main/java/com/github/codehive/controller/AuthController.java
- codehive-backend/src/main/java/com/github/codehive/controller/RecoveryPasswordController.java
- codehive-backend/src/main/java/com/github/codehive/controller/CheckExecutionController.java
- codehive-backend/src/main/java/com/github/codehive/controller/AssignmentController.java
- codehive-backend/src/main/java/com/github/codehive/controller/GroupController.java
- codehive-backend/src/main/java/com/github/codehive/controller/AdminUserController.java
- codehive-backend/src/main/java/com/github/codehive/controller/NotificationPreferenceController.java

## Controller Responsibilities
- Define API routes and HTTP semantics.
- Validate request payloads with @Valid.
- Apply endpoint-level limits via @RateLimit.
- Enforce authorization with @PreAuthorize where needed.
- Return a consistent wrapper response (SuccessResponse/ErrorResponse).
- Delegate business logic to service classes.

## Response Pattern
Success responses use:
- SuccessResponse<T> for data payloads.

Error handling is centralized in:
- model/exception/handler/GlobalExceptionHandler.java

## Endpoint Group Behavior

### AuthController
- Login, signup, current user, CSV bulk signup.
- Signup routes require `@PreAuthorize("hasAuthority('ADMIN')")`.

### RecoveryPasswordController
- Forgot password and reset password flows.
- Returns generic success messages to avoid account enumeration.

### CheckExecutionController
- `POST /api/execution/check` — creates execution and queues worker job.
- `GET /api/execution/check/{id}` — polls execution status.
- `GET /api/execution/check/{id}/report` — fetches the full execution report JSON from MinIO (per-test-case results, timing, memory, feedback). Returns 404 while unavailable and 410 after retained artifacts expire.

### AssignmentController
- `POST /api/assignments` — multipart; creates assignment, uploads files, queues test generation.
- Requires `@PreAuthorize("hasAnyAuthority('TEACHER', 'ADMIN')")`.
- Returns 202 Accepted immediately (test output generation is async).
- Request parts: `metadata` (JSON), `referenceSolution` (file), `testCaseInputs` (file list).
- Listings require groupId and are ownership/enrollment aware.
- `GET /api/assignments/{id}/clone-form` is teacher-owner-only and returns all editable
  metadata, examples, reference source, and test inputs. Source dates are intentionally omitted.
- `GET /api/assignments/{id}/preview` is owner-only and returns read-only assignment metadata,
  reference source, private test inputs, and generated expected outputs when validation is READY.
- `POST /api/assignments/{id}/clone` accepts the complete edited clone snapshot, creates it
  in another owned active writable group, and queues output generation.
- `DELETE /api/assignments/{id}` performs logical deletion.
- `POST /api/assignments/{id}/restore` restores a logically deleted assignment.
- Teacher assignment listings accept lifecycle, validation-status, and title-query filters with pagination.
- `GET /api/assignments/{id}/management-status` returns validation failure, update history, and latest reevaluation progress.

### GroupController
- Any user with `CREATE_GROUP` can create a group; teachers receive the scope by default.
- Owners can update, list roster, remove students, archive/unarchive, logical delete/restore, and rotate join code regardless of role.
- Student: join by code and leave.
- Both roles list and retrieve only accessible groups; join codes are never exposed to students.

### SubmissionController

- `GET /api/submissions/mine` is student-only and returns a bounded recent-submission feed with latest execution verdict and time.
- `GET /api/submissions/mine/group/{groupId}` is student-only and returns the current
  submitted work for accessible group assignments, including each current submission's
  latest execution verdict. It is used for delivery-state flags; withdrawn work is excluded.
- `GET /api/submissions/mine/assignment/{assignmentId}` is student-only and returns every
  definitive attempt newest-first. Persisted verdict/time/memory summaries remain available
  after report artifacts expire; `reportAvailable` controls links to detailed reports.

### AssignmentStudentWorkController

- `GET /api/assignments/mine` returns every currently accessible, published, READY assignment
  for active enrollments, including archived read-only groups. Each row includes current work,
  latest verdict, returned grade only, and visible-feedback count.
- `GET /api/assignments/{assignmentId}/my-feedback` returns student-visible feedback for authenticated
  student, including body-less deleted tombstones. Draft grades are never included in student views.
- Teacher-owner review endpoints return assignment work, full submission timeline, grade audit history,
  retained submission source, and execution-report availability without exposing data across groups.

### TeacherDashboardController

- `GET /api/teacher/dashboard` returns teacher-owned action data in one request: summary counts,
  validation issues, grading queue, upcoming lifecycle dates, and recent submissions.

### AdminUserController
- Lists and retrieves users with `VIEW_USERS`.
- Updates profiles and account status with target-role-specific scopes.
- Grants and revokes scopes with escalation and last-superadmin safeguards.

### NotificationPreferenceController

- Authenticated users can read, update, and reset their own email notification preferences.
- The authenticated principal determines the target user; user IDs are not accepted from the request.
- Test email requests are rate-limited.

## Cross-Cutting Concerns
- OpenAPI annotations are used for API docs (Swagger at /swagger-ui.html).
- Rate limiting is applied through custom `@RateLimit` annotation and aspect.
- Security is primarily in filters/config, not in controllers.

## Implementation Conventions
- Keep controllers thin and orchestration-only.
- Do not embed repository logic in controllers.
- Prefer explicit HTTP status codes (200, 201, 202, 400, 403, 404).
- Keep route grouping by domain under `/api/{domain}`.

## Adding a New Controller
1. Create class under controller package.
2. Define request/response DTOs under model/request and model/response.
3. Add service method and keep business logic there.
4. Add @RateLimit if endpoint can be abused.
5. Add method security annotations when role-restricted.
6. Document endpoint with OpenAPI annotations.
