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
│   ├── groups/
│   ├── messaging/
│   ├── metrics/
│   ├── model/
│   ├── notifications/
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
- Groups, enrollments, assignment lifecycle, deliveries: llms/backend/groups/
- Teacher performance metrics catalog and API contract: llms/backend/metrics/
- Email notification rules, preferences, and delivery: llms/backend/notifications/

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
1. Start infrastructure (PostgreSQL, RabbitMQ, MinIO) with Docker Compose from codehive-backend.
2. Run backend from codehive-backend (`./gradlew bootRun`).
3. Run worker from codehive-worker when execution pipelines are needed (`./gradlew bootRun`).
4. Run frontend from codehive-frontend (`npm run dev`).

Use project wrappers and local scripts:
- Backend and worker: ./gradlew
- Frontend: npm scripts in package.json

## Testing
Run tests in each project independently:
- Backend: unit and integration tests via Gradle (`./gradlew test`)
- Worker: service and sandbox-related tests via Gradle (`./gradlew test`)
- Frontend: type checks and UI/app tests via npm scripts (`npm run typecheck`)

Testing rules:
- Add or update tests for every behavior change.
- Keep tests isolated and deterministic.
- Use fixed `UUID.fromString("00000000-0000-0000-0000-000000000001")` values in tests — not `UUID.randomUUID()`.
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
- Shared infrastructure includes RabbitMQ, PostgreSQL, and MinIO (object storage).

For concrete architecture, contracts, data models, and execution flow, always consult:
- llms/backend/OVERVIEW.md
- llms/frontend/OVERVIEW.md
- llms/worker/OVERVIEW.md

Then drill into corresponding llms subfolders for implementation details.

## ID Convention
All entity primary keys use `java.util.UUID` (not `Long`).
- JPA entities: `@GeneratedValue(strategy = GenerationType.UUID)`
- Repositories: `JpaRepository<Entity, UUID>`
- DTOs, request/response models, and queue DTOs: `UUID` fields
- Controllers: `@PathVariable UUID id`
- Frontend: entity IDs are typed as `string`

## Queue Topology
Four durable queues — names are configurable via system properties, defaults shown:

| Queue | Direction | Purpose |
|---|---|---|
| `codehive_queue` | backend → worker | Student code execution jobs |
| `codehive_result_queue` | worker → backend | Execution results |
| `codehive_test_generation_queue` | backend → worker | Teacher assignment creation — generate expected outputs |
| `codehive_test_generation_result_queue` | worker → backend | Output generation result |

Payload contracts:
- `model/dto/queue/ExecutionJob` — student execution job
- `model/dto/queue/ExecutionReport` — student execution result
- `model/dto/queue/TestGenerationJob` — output generation job (contains list of `TestCaseInfo`)
- `model/dto/queue/TestGenerationResult` — output generation outcome

Queue DTO changes are contract changes — coordinate backend and worker deployment together.

## MinIO Object Key Conventions
All paths are produced by `utils/ObjectKeyBuilder`:

| Method | Path pattern |
|---|---|
| `testCaseInput(assignmentId, revisionId, testCaseId)` | `assignments/{a}/test-suite-revisions/{r}/test-cases/{t}/input.in` |
| `testCaseExpectedOutput(assignmentId, revisionId, testCaseId)` | `assignments/{a}/test-suite-revisions/{r}/test-cases/{t}/expected.out` |
| `referenceSolutionSourceCode(assignmentId, revisionId, ext)` | `assignments/{a}/test-suite-revisions/{r}/reference/Main.{ext}` |
| `submissionSourceCode(assignmentId, submissionId, ext)` | `assignments/{a}/submissions/{s}/source/Main.{ext}` |
| `executionReport(executionId)` | `executions/{e}/report.json` |
| `executionTestCaseStdout(executionId, testCaseId)` | `executions/{e}/test-cases/{t}/stdout.txt` |
| `executionTestCaseStderr(executionId, testCaseId)` | `executions/{e}/test-cases/{t}/stderr.txt` |
| `practiceExecutionSourceCode(executionId, ext)` | `practice-executions/{e}/source/Main.{ext}` |

Backend-produced queue payloads carry complete MinIO keys. The worker treats keys as opaque and must not reconstruct them from test indexes.

## Implemented Features
- Authentication: login, signup (admin), CSV bulk signup with WebSocket progress
- Password recovery: forgot/reset flow with 15-minute tokens
- Assignment creation: teacher uploads reference solution + test case inputs; worker generates expected outputs asynchronously
- Student execution: PRACTICE (inline test cases vs reference solution) and DEFINITIVE (pre-generated outputs)
- Execution status polling
- Execution report retrieval: `GET /api/execution/check/{id}/report` fetches per-test-case results from MinIO
- Docker sandbox security hardening: PID limits, capability drop, read-only rootfs, tmpfs mounts, seccomp profile, nobody user, OLE verdict for output floods

## Not Yet Implemented (frontend)
- Professor/teacher pages for assignment management
- Student pages for submitting code and viewing results

## Documentation Routing Rule
When working on a specific area, read docs in this order:
1. Relevant llms/<area>/OVERVIEW.md
2. Relevant llms/<area>/<domain>/ documentation
3. Source code in the target module

Do not place deep implementation playbooks in this root AGENTS.md.
Keep this file focused on repository-wide standards only.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
