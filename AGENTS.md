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


<claude-mem-context>
# Memory Context

# [CodeHive] recent context, 2026-08-16 9:21pm CST

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (19,081t read) | 294,682t work | 94% savings

### May 22, 2026
S54 Fix reference solution test case 1 RTE failures and validate sandbox security controls (May 22, 7:17 PM)
S55 Validate sandbox resource exhaustion controls (fork bomb and CPU exhaustion attacks) (May 22, 7:18 PM)
S56 Validate Java fork bomb attack handling and confirm sandbox resource limit responses are correct (May 22, 7:21 PM)
S57 Fix memory exhaustion test reporting 262GB instead of 256MB limit in CodeHive worker MLE results (May 22, 7:23 PM)
S73 Initialize CLAUDE.md project documentation for CodeHive codebase (May 22, 7:27 PM)
228 7:40p 🔵 Existing CI/CD workflows for backend discovered
229 " 🔵 Test coverage gaps identified in worker and backend
230 " 🔵 Backend services use messaging + object storage for async operations
231 " 🔵 Test configuration infrastructure identified
232 7:41p 🔵 Execution types and request models identified
233 " 🔵 Worker execution factory and result models identified
234 7:42p 🟣 ExecutionResult unit tests added to worker
235 " 🟣 ContainerSession unit tests added to worker
236 " 🟣 LanguageExecutorFactory unit tests added to worker
237 7:43p 🟣 AssignmentController integration tests added to backend
238 " 🟣 CheckExecutionController integration tests added to backend
239 7:44p 🟣 Worker CI workflow created for GitHub Actions
240 7:45p 🔵 Worker unit tests execute successfully
241 " 🔴 Backend integration tests fail with H2 database schema errors
242 7:46p 🔴 Backend integration tests fail: User.lastName null constraint + auth status code mismatch
243 " 🔴 AssignmentControllerIntegrationTest fixed: added missing User.lastName
244 " 🔴 AssignmentControllerIntegrationTest fully fixed: added lastName + corrected auth status expectation
### Jun 7, 2026
328 4:18p 🔵 CodeHive Project Architecture and Tech Stack Discovery
329 " 🔵 CodeHive Backend Project Structure Identified
330 4:35p ✅ CLAUDE.md initialized with CodeHive architecture and guidance
S76 Inspect CodeHive worker sandbox application for security vulnerabilities; recommend hardening improvements; implement fixes and add tests (Jun 7, 4:35 PM)
### Jul 18, 2026
353 6:58p 🔵 Sandbox execution architecture uses defense-in-depth Docker hardening
354 6:59p 🔵 Execution images strip development tools; runtime-only containers prevent tool access
355 7:00p 🔵 Seccomp profile blocks namespace/privilege escalation and kernel-level syscalls
356 " 🔵 Test execution service reuses single container per submission; practice tests run reference solution separately
357 " 🔵 Docker client connects via Unix socket with Apache HTTP client pool
358 7:01p 🔵 Comprehensive security integration tests verify isolation boundaries hold under attack
359 " 🔵 ExecutionRequestListener receives jobs from RabbitMQ, orchestrates execution, returns results via producer
360 " 🔵 RabbitMQ queues declared as durable; config via environment variables
361 7:03p ✅ Seccomp profile hardened: blocked 8 newer filesystem syscalls and clone3
362 7:04p ✅ Added hard bounds on job-supplied time/memory limits and test case count
363 7:05p ✅ Added file descriptor (NOFILE) ulimit; added clamp() utility for bounds validation
364 " ✅ Applied NOFILE ulimit to execution container HostConfig
365 " ✅ Applied NOFILE ulimit to compilation container HostConfig
366 7:06p ✅ Applied clamp() bounds checking to job-supplied time and memory limits in prepare()
367 " ✅ Applied MAX_TEST_CASES cap to DEFINITIVE test execution loop
368 7:07p ✅ Added MAX_TEST_CASES cap logging to PRACTICE test execution (incomplete)
369 " 🔴 Fixed PRACTICE test loop to respect MAX_TEST_CASES cap
370 " ✅ Added RabbitMQ concurrency limits to prevent unbounded simultaneous job execution
371 7:09p ✅ Added unit tests for clamp() utility and resource-limit bounds
372 " ✅ Added two integration tests: memfd exec blocking and limit clamping
373 7:10p ✅ Build and test verification: compilation successful, unit tests pass, seccomp JSON valid
S77 Inspect CodeHive worker sandbox for security vulnerabilities; recommend hardening; implement and test comprehensive improvements (Jul 18, 7:10 PM)
374 7:13p ✅ Seccomp profile switched from blocklist to whitelist security model
375 7:14p ✅ Seccomp profile loading switched from fail-open to fail-closed
376 7:15p ✅ Final verification: compilation passes, seccomp JSON valid with new whitelist profile
377 " 🔵 Docker up; security test task wired; all sandbox images present
378 7:18p 🔵 securityTest task runs but shows NO-SOURCE (tests not yet discovered/compiled)
379 " 🔵 securityTest task missing compilation dependency; should declare dependsOn(testClasses)
380 7:20p 🔵 All 12 security integration tests PASSED; sandbox hardening verified end-to-end
382 " 🔵 Smoke test PASSED: JVM/C/C++ execute successfully under whitelist seccomp allowlist
383 7:22p 🔵 Full test suite PASSED: all security and unit tests passing
S78 Security audit and hardening of CodeHive worker sandbox; assess vulnerabilities, implement mitigations, verify with comprehensive testing (Jul 18, 7:22 PM)
S79 Vulnerability remediation for CodeHive worker sandbox; implement fixes for seccomp surface exposure and noexec bypass; verify closure (Jul 18, 7:24 PM)
S80 Post-remediation risk assessment: evaluate residual vulnerabilities after security hardening implementation (Jul 18, 7:26 PM)
**Investigated**: - Attack surface post-mitigation: narrowed syscall allowlist, blocked memfd/namespace creation
    - Residual escape vector: kernel vulnerability via allowed syscalls (e.g., futex, io_uring class bugs)
    - Threat model: students submitting exercises (low-sophistication attacker profile)
    - Co-tenancy risk: whether host runs other workloads or sensitive data
    - Docker socket exposure: worker process has full Docker access (separate privilege path)

**Learned**: - CVSS base score unchanged (8.5 High) because impact of escape didn't change (full host compromise)
    - Likelihood term (not captured in base score) dropped dramatically: exploit now requires bespoke kernel LPE against hardened allowlist, not public tooling
    - Effective residual risk ~Medium-Low (4–5) after accounting for exploit maturity and attacker profile
    - Host kernel patch cadence is **dominant control** — unpatched kernel with known LPE reachable via allowed syscall is real exposure
    - io_uring not on allowlist (good); futex/common-bug syscalls are allowed (minor surface, mitigated by cap-drop/rootfs/network)
    - Worker-app compromise via Docker socket may be easier path to host than kernel escape

**Completed**: - Implemented defense-in-depth hardening: seccomp allowlist, resource limits, fd ulimits, concurrency bounds, fail-closed config
    - Verified all mitigations: 12 security tests + runtime smoke tests passing
    - Documented residual risks: shared host kernel (unmitigated by seccomp)
    - Assessed post-fix CVSS: effective risk dropped from High (8.5) credible to Medium-Low (4–5) with exploit-maturity factors

**Next Steps**: Session work complete. Hardening shipped and verified. Residual risk acceptable for educational platform with typical student threat model. Strategic next steps (host patching, gVisor runtime) are deployment-level decisions, not code changes.


Access 295k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>