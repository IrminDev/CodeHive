# AGENTS.md - CodeHive Root Instructions

## Purpose
This file contains only repository-wide guidance.
Implementation specifics must live in the docs under llms/.

## Project Overview
CodeHive is a full-stack monorepo for collaborative programming education.

Main applications:
- codehive-backend: Spring Boot REST API (Java 21)
- codehive-frontend: React Router v7 SPA (TypeScript)
- codehive-worker: Spring Boot worker for sandboxed execution (Java 21)

The llms folder is the source of truth for implementation-level guidance:
- llms/backend/OVERVIEW.md
- llms/frontend/OVERVIEW.md
- llms/worker/OVERVIEW.md

Subfolder docs under each area (for example auth, service, messaging, sandbox, routes, components) contain domain-specific instructions.

## llms Folder Structure
Use this map to load only the docs relevant to the task.

```
llms/
├── backend/
│   ├── OVERVIEW.md
│   ├── auth/
│   ├── controller/
│   ├── executions/
│   ├── messaging/
│   ├── model/
│   ├── security/
│   └── service/
├── frontend/
│   ├── OVERVIEW.md
│   ├── admin/
│   ├── components/
│   ├── professor/
│   ├── routes/
│   ├── services/
│   └── student/
└── worker/
	├── OVERVIEW.md
	├── comparator/
	├── execution/
	├── messaging/
	└── sandbox/
```

## Quick Doc Lookup
Open only the area needed for the current change.

- Authentication, JWT, password recovery, user registration: llms/backend/auth/
- HTTP endpoint design and controller behavior: llms/backend/controller/
- Data model, entities, DTOs, requests, responses, exceptions: llms/backend/model/
- Backend queue flow and contracts: llms/backend/messaging/
- Execution request/result orchestration in backend: llms/backend/executions/
- Backend service-layer orchestration: llms/backend/service/
- Backend security config and filters: llms/backend/security/

- Frontend route mapping and route-level composition: llms/frontend/routes/
- Frontend API clients and request/response handling: llms/frontend/services/
- Reusable UI and guard components: llms/frontend/components/
- Admin pages and workflows: llms/frontend/admin/
- Professor and student areas: llms/frontend/professor/, llms/frontend/student/ (placeholders until dedicated pages exist)

- Worker execution lifecycle and result aggregation: llms/worker/execution/
- Worker output comparison and verdict logic: llms/worker/comparator/
- Worker queue listener/producer behavior: llms/worker/messaging/
- Worker sandbox executors and isolation constraints: llms/worker/sandbox/

## Development Environment
General prerequisites:
- Java 21
- Node.js 18+
- Docker and Docker Compose

Typical local flow:
1. Start infrastructure (PostgreSQL, RabbitMQ, and other required services) with Docker Compose from backend.
2. Run backend from codehive-backend.
3. Run worker from codehive-worker when execution pipelines are needed.
4. Run frontend from codehive-frontend.

Use project wrappers and local scripts:
- Backend and worker: ./gradlew
- Frontend: npm scripts in package.json

## Testing
Run tests in each project independently:
- Backend: unit and integration tests via Gradle
- Worker: service and sandbox-related tests via Gradle
- Frontend: type checks and UI/app tests via npm scripts

Testing rules:
- Add or update tests for every behavior change.
- Keep tests isolated and deterministic.
- Prefer small unit tests plus focused integration coverage.

## CI/CD
CI is managed with GitHub Actions under .github/workflows/.

Expected checks for changes:
- Build passes
- Relevant tests pass
- Coverage gates (when configured) are met
- No broken formatting or lint checks

Before opening PRs, run local checks for the affected project(s).

## Linting And Code Style
Apply style tools per project:
- Java: follow existing formatter and conventions in backend/worker
- Frontend: follow existing TypeScript, React, and styling conventions

Rules:
- Keep naming and package/module structure consistent with existing code.
- Avoid unrelated refactors in feature/fix PRs.
- Keep diffs focused and minimal.

## Architecture
High-level architecture:
- Frontend consumes backend REST APIs.
- Backend handles auth, core business logic, persistence, and messaging orchestration.
- Worker consumes execution jobs, runs sandboxed code, and publishes execution results.
- Shared infrastructure includes RabbitMQ and object storage.

## ID Convention
All entity primary keys use `java.util.UUID` (not `Long`).
- JPA entities: `@GeneratedValue(strategy = GenerationType.UUID)`
- Repositories: `JpaRepository<Entity, UUID>`
- DTOs, request/response models, and queue DTOs: `UUID` fields
- Controllers: `@PathVariable UUID id`
- Frontend: entity IDs are typed as `string`

For concrete architecture, contracts, data models, and execution flow, always consult:
- llms/backend/OVERVIEW.md
- llms/frontend/OVERVIEW.md
- llms/worker/OVERVIEW.md

Then drill into corresponding llms subfolders for implementation details.

## Documentation Routing Rule
When working on a specific area, read docs in this order:
1. Relevant llms/<area>/OVERVIEW.md
2. Relevant llms/<area>/<domain>/ documentation
3. Source code in the target module

Do not place deep implementation playbooks in this root AGENTS.md.
Keep this file focused on repository-wide standards only.
