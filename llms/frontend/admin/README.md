# Frontend Admin Implementation

## Scope
This document explains the admin-facing frontend implementation currently available in codehive-frontend.

## Route Entry Points
Admin routes are declared in app/routes.ts:
- /admin
- /admin/create-user
- /admin/csv-upload

Route modules:
- app/routes/admin.tsx
- app/routes/admin.create-user.tsx
- app/routes/admin.csv-upload.tsx

Each admin route wraps pages with:
- ThemeProvider
- ProtectedRoute roles={[Role.ADMIN]}

This guarantees role-gated rendering for admin pages.

## Admin Pages
Page implementations:
- app/pages/admin/AdminDashboardPage.tsx
- app/pages/admin/CreateUserPage.tsx
- app/pages/admin/CsvUploadPage.tsx

### AdminDashboardPage
- Entry navigation to create-user and csv-upload features.
- Theme toggle and quick placeholders for summary metrics.

### CreateUserPage
- Form to create one user account.
- Calls AuthService.signUp.
- Handles loading, success, and error states.

Input model aligns with backend signup contract:
- role
- name
- fatherLastName
- motherLastName
- enrollmentNumber
- email

### CsvUploadPage
- Uploads CSV through AuthService.uploadCsv.
- Uses backend taskId and WebSocket subscription to stream progress.
- Shows processed/success/failure counts and row-level errors.
- Handles WebSocket lifecycle with cleanup on unmount.

## Dependencies and Contracts
Service dependency:
- app/services/AuthService.ts

Type dependency:
- app/types (Role, SignUpRequest, CsvProgressMessage, response wrappers)

## Security and Access Pattern
- Admin route protection is enforced in frontend by ProtectedRoute.
- Backend still remains source of truth for authorization.

## Extension Guidance
- Keep admin flows under app/pages/admin and app/routes/admin.*.
- Reuse AuthService and typed contracts instead of duplicating fetch logic.
- For new admin features, include role-gated route wrappers by default.

## AI usage statistics

Shared module: `app/features/assistant-usage`. Personal route `/ai-usage` reads own historical
usage independently of academic active-enrollment metrics. Teacher route
`/teacher/analytics` embeds group AI summary and per-assignment counts in the drawer's AI Usage tab. Legacy `section=ai` URLs open that integrated view.
Admin route `/admin/ai-usage` requires CHECK_ANALYTICS; user rows/details require VIEW_USERS too.
Admin user detail includes an AI usage tab. Role clients reuse existing authenticated helpers.
Filters, search, sort and pagination stay in URL; requests abort/ignore stale results on scope
changes and session identity remounts state. No statistics polling. Technical coverage remains
explicit; nullable tokens are not zero. Lifetime quota is per assignment and independent of dates.
Recharts has a UTC daily table alternative. See
[implementation contract](../../../docs/ai-assistant/AI_USAGE_IMPLEMENTATION.md).

### Admin AI usage dashboard layout

`AdminAiUsagePage` opts into the admin presentation of `UsageDashboard`; shared request logic,
permission gates, session remounting, and cancellation remain centralized. Admin user-detail
and other audiences keep their existing presentation.

- Reporting-window toolbar offers 7/30/90 UTC-day presets, custom exclusive-end dates, all history,
  refresh, and reset. Provider/model filters are expandable and apply only to technical work.
- Five metric cards summarize questions, answers used, unanswered questions, pending questions,
  and active students. Overview separates daily trend, question outcomes, provider consumption,
  and expandable educational details; chart has a daily-table alternative.
- User activity supports user -> group -> assignment drill-down, URL search/sort/pagination,
  optional technical columns, and lifetime assignment quotas. VIEW_USERS gates identities.
- Providers & models expands per-stage calls, tokens, latency, and measurement coverage.
  Unknown token values remain Not measured; partial coverage stays explicit.
- View selection uses aiView; existing aiFrom/aiTo/aiLifetime and scope/filter parameters persist.
