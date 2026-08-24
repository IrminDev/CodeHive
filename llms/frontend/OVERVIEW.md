# Frontend Overview

## What This Component Does
The frontend is a React Router v7 single-page application. It provides the user interface for authentication, account recovery, role-based navigation, and administration flows.

Main responsibilities:
- Render pages and reusable UI components.
- Manage client-side routing.
- Call backend APIs through service modules.
- Store and expose auth/theme state through context providers.
- Guard protected routes based on authentication state.

## How It Works
Typical page flow:
1. User navigates to a route.
2. Route component loads and renders page-level UI.
3. Page calls service methods for API communication when needed.
4. Context providers supply shared state (for example auth state).
5. Components render success, loading, and error states based on API results.

Authentication flow at a high level:
1. User submits credentials on login page.
2. Auth service calls backend endpoint.
3. Auth context updates session state.
4. Protected routes allow or block access accordingly.

## Useful Commands
Run these from codehive-frontend.

Development:
- npm install
- npm run dev

Build and serve:
- npm run build
- npm run start

Type safety:
- npm run typecheck

Tests:
- npm test

## Project Folder Structure
Runtime module structure (codehive-frontend/app):
- root.tsx: Root app shell and provider wiring.
- routes.ts: Route registration.
- routes: Route entry files.
- pages: Page-level components.
- components: Reusable UI building blocks.
- services: API clients and request helpers.
- types: Shared TypeScript types.
- context: App-wide state providers.
- welcome: Welcome-related route content.
- app.css: Global styling.

Frontend docs structure in llms/frontend:
- OVERVIEW.md: This document.
- admin: Admin feature behavior and constraints.
- components: Shared component guidelines.
- professor: Professor-facing workflows.
- routes: Route-level behavior and conventions.
- services: API service contracts and patterns.
- student: Student-facing workflows.

## How To Navigate Frontend Docs
Read in this order:
1. llms/frontend/OVERVIEW.md
2. The relevant domain folder in llms/frontend
3. The corresponding folder in codehive-frontend/app
