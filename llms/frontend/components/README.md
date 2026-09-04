# Frontend Components Implementation

## Scope
This document describes reusable UI and guard components in app/components.

Component files:
- app/components/Header.tsx
- app/components/Hero.tsx
- app/components/Features.tsx
- app/components/HowItWorks.tsx
- app/components/Testimonials.tsx
- app/components/Contact.tsx
- app/components/Footer.tsx
- app/components/ProtectedRoute.tsx

## Structural Components
Landing page sections are split into reusable blocks:
- Header and hero sections
- feature explanation sections
- testimonial and contact sections
- footer

These are composed by landing page modules rather than tightly coupled to route files.

Student navigation is shared by:

- `app/features/student/components/StudentHeader.tsx` — breadcrumb, search shell,
  notification placeholder, theme toggle, and logout.
- `app/features/student/components/StudentSidebar.tsx` — dashboard, groups, join,
  and assignments navigation with active state.

## Access Control Component
ProtectedRoute is the core guard component.

Behavior:
1. Checks token presence through AuthService.getToken.
2. Calls AuthService.getMe to resolve the current user.
3. Optionally validates role list and scope list.
4. Redirects unauthorized users to role dashboard or login.
5. Renders loading state while auth check is pending.

Current redirect mapping:
- ADMIN -> /admin
- default -> /

## Context Dependencies
ProtectedRoute relies on:
- app/services/AuthService.ts
- app/types for Role and Scope

Other components rely on theme classes and app-level styling from app.css.

## Reuse Rules
- Keep data-fetching and auth checks out of visual section components.
- Place access logic in ProtectedRoute or route-level wrappers.
- Preserve component-level responsibility: presentational or guard, not both.

## Extension Guidance
- New reusable sections should be added to app/components.
- New protected pages should use ProtectedRoute at route-level composition.
- If role routes expand, update getDashboardRoute behavior in ProtectedRoute.
