# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (`codehive-backend/`)
```bash
./gradlew bootRun           # start dev server (port 8080)
./gradlew build
./gradlew clean build
./gradlew test
./gradlew test --tests "com.github.codehive.SomeTest"   # single test class
./gradlew jacocoTestReport  # coverage at build/reports/jacoco/test/html/index.html
docker compose up -d        # start PostgreSQL, RabbitMQ, MinIO (required before bootRun)
docker compose down
```

Swagger UI: http://localhost:8080/swagger-ui.html

### Worker (`codehive-worker/`)
```bash
./gradlew bootRun           # requires infra running (start from backend first)
./gradlew test
./gradlew securityTest      # sandbox security tests (require Docker, tagged "security")
./gradlew test -Dtags=security
```

Worker needs RabbitMQ and MinIO up before it boots. Start infra from `codehive-backend/` with `docker compose up -d`.

### Frontend (`codehive-frontend/`)
```bash
npm install
npm run dev         # dev server at http://localhost:3000
npm run build
npm run typecheck   # react-router typegen + tsc
```

## Architecture

Three independent services communicating via RabbitMQ and MinIO:

```
Frontend (React Router v7) ──REST──► Backend (Spring Boot 3 / Java 21)
                                              │  RabbitMQ
                                              ▼
                                       Worker (Spring Boot 3 / Java 21)
```

### Backend key flows

**Assignment creation** — teacher sends multipart (metadata JSON + reference solution file + test input files) → `AssignmentService` persists entities, uploads to MinIO, publishes `TestGenerationJob` → worker generates expected outputs → backend activates assignment.

**Student execution** — `POST /api/execution/check` → backend stores source in MinIO, publishes `ExecutionJob` → worker runs code → worker publishes `ExecutionReport` → client polls `GET /api/execution/check/{id}`.

**Auth** — stateless JWT via `JwtAuthenticationFilter`. Role-based: `STUDENT`, `TEACHER`, `ADMIN`. Rate limiting via `@RateLimit` annotation backed by Bucket4j.

**Integration tests** use H2 in-memory DB. Production uses PostgreSQL.

### Worker sandbox model

Each language executor (`sandbox/java`, `sandbox/python`, `sandbox/c`, `sandbox/cpp`) extends `AbstractLanguageExecutor`. Two-stage model: compile image → hardened runtime image (custom Docker images in `codehive-worker/docker/`).

Security posture applied to all containers:
- `nobody` user, no Linux capabilities (`CAP_ALL` dropped)
- Read-only root fs, tmpfs at `/tmp` and `/run`
- PID limit (16 JVM/Python, 8 C/C++)
- Custom seccomp profile blocking ptrace, bpf, io_uring, clone+NEWUSER
- fsize ulimit, stdout+stderr cap at 8 MB (→ OLE verdict)
- Memory limit exceeded detected via exit code 137 (SIGKILL)

Verdicts: `AC`, `WA`, `CE`, `TLE`, `MLE`, `OLE`, `RTE`, `PENDING`. Priority when multiple failures: `CE > TLE > MLE > RTE > WA`.

### Queue topology

| Queue | Direction | Purpose |
|---|---|---|
| `codehive_queue` | backend → worker | Student execution jobs |
| `codehive_result_queue` | worker → backend | Execution results |
| `codehive_test_generation_queue` | backend → worker | Generate expected outputs |
| `codehive_test_generation_result_queue` | worker → backend | Generation results |

### MinIO object layout

```
test-suites/assignments/{assignmentId}/
  reference/Main.{ext}
  tc-{testCaseId}/tc{testCaseId}.in
  tc-{testCaseId}/tc{testCaseId}.out     ← worker-generated

test-execution/execution-{executionId}/
  source.{ext}
  output/tc-{n}/stdout.txt
  output/tc-{n}/stderr.txt

submissions/assignments/{assignmentId}/submission-{id}/Main.{ext}
```

### Frontend structure

Feature-based architecture (`app/features/<name>/`). Each feature owns: `api/`, `services/`, `types/`, `pages/`, `components/`, `hooks/`, `config/`, `routes.ts`. Shared code in `app/shared/`; global config/providers in `app/core/`.

Naming: `PascalCase.tsx` for components/pages, `kebab-case.ts` for services/api/types. No `index.ts` re-export barrels.

Features must not import from other feature internals — share through `app/shared/` or global state (Zustand).

## Infrastructure env vars

Backend reads from environment (or `.env` picked up by Spring/Docker Compose):
- `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`
- `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_NAME`

The `minio-init` container in `docker-compose.yaml` auto-creates the bucket on first run.

## Custom Docker execution images

Located in `codehive-worker/docker/{java-exec,python-exec,c-exec,cpp-exec}/`. Must be built and available locally before the worker can execute code. These are the hardened runtime images (not the compile images).
