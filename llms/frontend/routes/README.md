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

## Route Module Pattern
Each route module typically contains:
1. meta export for SEO metadata.
2. Default export component that renders page composition.

Common composition strategy:
- Public routes: render page directly, often wrapped with ThemeProvider.
- Protected admin routes: ThemeProvider + ProtectedRoute + admin page.

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
- Current protected area is admin.
- Role checks occur client-side using /api/auth/me.

## Extension Guidance
- Add new path entries in app/routes.ts first.
- Keep route files thin and move UI into page components.
- Apply ProtectedRoute in route composition for role/scoped pages.
- Keep metadata maintained per route for SEO and social previews.
