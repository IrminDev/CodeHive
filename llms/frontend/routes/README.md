# Frontend Routes Implementation

## Scope
This document explains route registration and route-module behavior for the React Router v7 frontend.

## Route Registry
Central route declaration:
- app/routes.ts

Current route map:
- / -> app/routes/home.tsx
- /login -> app/routes/login.tsx
- /forgot-password -> app/routes/forgot-password.tsx
- /reset-password -> app/routes/reset-password.tsx
- /admin -> app/routes/admin.tsx
- /admin/create-user -> app/routes/admin.create-user.tsx
- /admin/csv-upload -> app/routes/admin.csv-upload.tsx
- /teacher -> features/teacher/routes/teacher.dashboard.tsx
- /teacher/assignments -> features/teacher/routes/teacher.assignments.tsx
- /teacher/create-assignment -> features/teacher/routes/teacher.create-assignment.tsx
- /teacher/assignments/:assignmentId/clone -> features/teacher/routes/teacher.assignments.$assignmentId.clone.tsx
- /teacher/assignments/:assignmentId/edit -> features/teacher/routes/teacher.assignments.$assignmentId.edit.tsx
- /teacher/assignments/:assignmentId/preview -> features/teacher/routes/teacher.assignments.$assignmentId.preview.tsx
- /teacher/groups -> features/teacher/routes/teacher.groups.tsx
- /teacher/groups/create -> features/teacher/routes/teacher.create-group.tsx
- /teacher/groups/:groupId -> features/teacher/routes/teacher.groups.$groupId.tsx
- /teacher/grades -> features/teacher/routes/teacher.grades.tsx
- /teacher/analytics -> features/teacher/routes/teacher.analytics.tsx
- /teacher/notifications -> features/teacher/routes/teacher.notifications.tsx
- /groups -> features/student/routes/student.groups.tsx
- /groups/join -> features/student/routes/student.join-group.tsx
- /groups/:groupId -> features/student/routes/student.group.tsx
- /assignment/:id -> features/student/routes/student.assignment.tsx
- /assignment/:id/submissions -> features/student/routes/student.submissions.tsx
- /assignment/:id/report/:executionId -> features/student/routes/student.report.tsx
- /assignments -> features/student/routes/student.assignments.tsx
- /grades -> features/student/routes/student.grades.tsx
- /notifications -> features/student/routes/student.notifications.tsx

## Route Module Pattern
Each route module typically contains:
1. meta export for SEO metadata.
2. Default export component that renders page composition.

Common composition strategy:
- Public routes: render page directly, often wrapped with ThemeProvider.
- Protected role routes: ProtectedRoute + feature page.

## Root and Layout
Root file:
- app/root.tsx

Key responsibilities:
- HTML shell and global links.
- preconnect and font setup.
- inline theme bootstrap script to avoid flash.
- ScrollRestoration and Scripts.
- shared ErrorBoundary behavior.

## Page Binding
Routes map to page modules under app/pages:
- LandingPage
- LoginPage
- RecoveryPasswordPage
- ResetPasswordPage
- admin/* pages

## Guarding Strategy
Role-sensitive routes rely on ProtectedRoute.
- Admin, teacher, and student areas use role-specific guards.
- Role checks occur client-side using /api/auth/me.

## Extension Guidance
- Add new path entries in app/routes.ts first.
- Keep route files thin and move UI into page components.
- Apply ProtectedRoute in route composition for role/scoped pages.
- Keep metadata maintained per route for SEO and social previews.
