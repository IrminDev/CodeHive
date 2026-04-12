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
