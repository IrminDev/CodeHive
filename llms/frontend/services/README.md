# Frontend Services Implementation

## Scope
This document describes API service modules used by the frontend.

Service files:
- app/services/AuthService.ts
- app/services/RecoveryPasswordService.ts
- app/services/index.ts
- app/features/teacher/api/assignment.api.ts
- app/features/teacher/api/group.api.ts
- app/features/teacher/api/student-work.api.ts
- app/features/teacher/api/metrics.api.ts
- app/features/teacher/api/dashboard.api.ts
- app/features/teacher/api/client.ts
- app/features/admin/api/admin.api.ts
- app/features/admin/api/client.ts

Base URL strategy:
- Uses VITE_API_URL when provided.
- Falls back to http://localhost:8080.

## AuthService
Base path:
- /api/auth

Implemented methods:
- login(credentials)
- signUp(userData)
- uploadCsv(file)
- getMe()
- getWebSocketUrl()
- setToken/getToken/removeToken/isAuthenticated/logout

Behavior details:
- signUp and uploadCsv include Authorization Bearer token.
- uploadCsv uses multipart/form-data.
- getMe validates token by calling /me.
- token storage is localStorage key authToken.
- websocket URL rewrites http(s) base to ws(s) and appends /ws/csv-progress.

## RecoveryPasswordService
Base path:
- /api/recovery-password

Implemented methods:
- forgotPassword(request)
- resetPassword(request)

Behavior details:
- Both methods post JSON payloads.
- Non-2xx responses throw Error with API message fallback.

## Teacher Assignment API

- Lists active teacher groups and paginated assignments per group.
- Creates assignments with multipart metadata/reference/test files.
- Retrieves and updates assignment metadata/schedules through multipart requests.
- Deletes assignments logically.
- Restores logically deleted assignments and supports server-side lifecycle, validation, and title filters.
- Loads owner-only assignment validation/update/reevaluation management status.
- Loads an owner-only complete clone-form snapshot.
- Loads an owner-only read-only assignment preview with reference source, private test inputs, and generated expected outputs.
- Submits a complete edited clone snapshot as JSON, including reference source and test inputs.
- Converts backend wrapper responses to typed feature data and surfaces API messages on failure.

## Student Assignment Data

- Loads accessible groups from `GET /api/groups`.
- Loads all student-visible assignments and progress in one request through `GET /api/assignments/mine`.
- Aggregate rows include group context, current submission/latest verdict, returned grade, and published-feedback count. Archived active groups stay visible as read-only.
- Loads recent definitive submission results from `GET /api/submissions/mine?limit=5`.
- Loads one group and its assignments from `GET /api/groups/{groupId}` and
  `GET /api/assignments?groupId={groupId}`.
- Loads current student submissions for group delivery flags from
  `GET /api/submissions/mine/group/{groupId}`. Dashboard uses these current verdicts
  to distinguish open work, in-progress attempts, and accepted/done assignments.
- Loads persisted assignment submission history from
  `GET /api/submissions/mine/assignment/{assignmentId}`. Detailed report links are shown only when `reportAvailable` is true.
- Loads student-visible feedback and deleted tombstones from `GET /api/assignments/{assignmentId}/my-feedback`.
- Student API errors use `ApiError`, preserving HTTP status so report views can distinguish expired artifacts (`410`) from ordinary failures.

## Teacher Group API

- Creates, lists, retrieves, and updates owned groups.
- Lists active roster entries and removes active students.
- Archives, unarchives, logically deletes, restores, and rotates join codes.

## Teacher Student-Work API

- Lists assignment student-work aggregates and submission history.
- Loads owner-only submission source, retained execution evidence, and grade audit history.
- Saves draft grades and explicitly returns them to students.
- Creates, lists, and logically deletes feedback.

## Teacher Metrics API

- Loads group overview, per-assignment, and per-student metrics.
- Loads detailed metrics for one assignment.

## Teacher Dashboard API

- Loads one action-center aggregate from `GET /api/teacher/dashboard`.
- Includes owned active group/student/assignment counts, grading queue, validation issues,
  upcoming lifecycle dates, and recent submissions.

Teacher API modules share authenticated response/error parsing through
`app/features/teacher/api/client.ts`.

## Type Contracts
Services consume and return typed contracts from app/types:
- request types (login/signup/forgot/reset)
- response wrappers (SuccessResponse, ErrorResponse)
- domain payloads (AuthResponse, MessageResponse, CsvTaskResponse, User)

## Error Handling Pattern
- Parse JSON response.
- If response not ok, throw Error using backend message/error fields.
- Let page or route components handle user-facing error display.

Admin requests use `AdminApiError`, preserving HTTP status, validation/blocker details,
`Retry-After`, and `X-RateLimit-Policy`. Admin list filters serialize through one query
builder and all read methods accept `AbortSignal` for stale-request cancellation.

## Re-export Pattern
app/services/index.ts re-exports service singletons for concise imports:
- import { AuthService, RecoveryPasswordService } from ~/services

## Extension Guidance
- Keep one service class per backend API domain.
- Centralize token/header behavior in services, not components.
- Preserve response wrappers to maintain consistency across pages.
