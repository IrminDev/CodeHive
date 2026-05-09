[![Backend CI](https://github.com/IrminDev/CodeHive/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/IrminDev/CodeHive/actions/workflows/backend-ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

# CodeHive

> A collaborative platform for programming education. Teachers create assignments with automated test generation; students submit code that is evaluated in sandboxed Docker containers.

## Features

- **Secure Authentication** — JWT-based login, password recovery, role-based access (Student, Teacher, Admin)
- **Bulk User Registration** — CSV upload with real-time WebSocket progress streaming
- **Assignment Management** — Teachers upload reference solutions and test case inputs; expected outputs are generated automatically by the worker
- **Sandboxed Code Execution** — Submissions run in isolated Docker containers with CPU, memory, and time limits
- **Multi-language Support** — Java, Python, C, C++
- **Two Execution Modes** — Practice (inline test cases vs reference solution) and Definitive (pre-generated expected outputs)
- **Output Comparison** — Exact match and floating-point comparators
- **Asynchronous Pipeline** — Execution and test generation fully decoupled via RabbitMQ
- **Object Storage** — Source code, test inputs, expected outputs, and execution artifacts stored in MinIO
- **API Documentation** — Interactive Swagger/OpenAPI at `/swagger-ui.html`
- **Rate Limiting** — Per-endpoint throttling to prevent abuse
- **CI/CD** — Automated testing and coverage via GitHub Actions

## Architecture

```
┌─────────────┐    REST API    ┌──────────────────────────────────────────────┐
│   Frontend  │ ◄────────────► │                   Backend                    │
│ React/TS    │                │  Spring Boot · PostgreSQL · MinIO             │
└─────────────┘                │                                              │
                               │  ┌──────────┐  ┌───────────────────────┐    │
                               │  │   Auth   │  │  Assignment Service    │    │
                               │  │ Service  │  │  (upload + queue job)  │    │
                               │  └──────────┘  └───────────┬───────────┘    │
                               │  ┌──────────────────────┐  │                │
                               │  │  Execution Service   │  │                │
                               │  │  (load assignment,   │  │                │
                               │  │   queue job)         │  │                │
                               │  └──────────┬───────────┘  │                │
                               └─────────────┼──────────────┼────────────────┘
                                             │  RabbitMQ    │
                               ┌─────────────▼──────────────▼────────────────┐
                               │                   Worker                     │
                               │  Spring Boot · Docker SDK · MinIO            │
                               │                                              │
                               │  ┌──────────────────┐  ┌─────────────────┐  │
                               │  │ TestExecutionSvc │  │ TestGenerationSvc│  │
                               │  │ (run submission) │  │ (gen outputs)    │  │
                               │  └──────────────────┘  └─────────────────┘  │
                               └─────────────────────────────────────────────┘
```

### Queue Topology

| Queue | Direction | Purpose |
|---|---|---|
| `codehive_queue` | backend → worker | Student code execution jobs |
| `codehive_result_queue` | worker → backend | Execution results |
| `codehive_test_generation_queue` | backend → worker | Generate expected test outputs |
| `codehive_test_generation_result_queue` | worker → backend | Output generation result |

### MinIO Object Layout

```
test-suites/assignments/{assignmentId}/
  reference/Main.{ext}              ← reference solution
  tc-{testCaseId}/tc{testCaseId}.in ← test case input
  tc-{testCaseId}/tc{testCaseId}.out ← expected output (worker-generated)

test-execution/execution-{executionId}/
  source.{ext}                      ← submitted code
  output/tc-{n}/stdout.txt          ← actual output
  output/tc-{n}/stderr.txt

submissions/assignments/{assignmentId}/submission-{id}/Main.{ext}
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Spring Boot 3, Java 21, Spring Security, JPA/Hibernate |
| Frontend | React Router v7, TypeScript, Vite |
| Worker | Spring Boot 3, Java 21, Docker Java SDK |
| Database | PostgreSQL |
| Message Broker | RabbitMQ |
| Object Storage | MinIO |
| Auth | JWT (stateless), BCrypt |
| Testing | JUnit 5, Mockito, AssertJ |
| Docs | SpringDoc OpenAPI / Swagger |

## Getting Started

### Prerequisites

- Java 21+
- Node.js 18+
- Docker and Docker Compose

### 1. Start Infrastructure

```bash
cd codehive-backend
docker compose up -d
```

This starts PostgreSQL, RabbitMQ, and MinIO.

### 2. Backend

```bash
cd codehive-backend
./gradlew bootRun
```

Available at: http://localhost:8080  
Swagger UI: http://localhost:8080/swagger-ui.html

### 3. Worker

```bash
cd codehive-worker
./gradlew bootRun
```

The worker connects to RabbitMQ and MinIO on startup and begins consuming jobs.

### 4. Frontend

```bash
cd codehive-frontend
npm install
npm run dev
```

Available at: http://localhost:3000

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Login with email or enrollment number |
| POST | `/api/auth/signup` | ADMIN | Create a single user account |
| POST | `/api/auth/signup/csv` | ADMIN | Bulk register users from CSV |
| GET | `/api/auth/me` | Bearer | Get current authenticated user |

### Password Recovery

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/recovery-password/forgot` | — | Request a password reset email |
| POST | `/api/recovery-password/reset` | — | Reset password with token |

### Assignments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/assignments` | TEACHER / ADMIN | Create assignment with reference solution and test inputs |

The assignment endpoint accepts `multipart/form-data` with three parts:
- `metadata` — JSON with title, description, limits, comparator, languages, sampleFlags
- `referenceSolution` — source file
- `testCaseInputs` — one or more input files (order determines test case index)

The assignment is created as inactive. The worker runs the reference solution against each input and stores the expected outputs. Once complete the assignment is automatically activated.

### Code Execution

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/execution/check` | — | Submit code for execution |
| GET | `/api/execution/check/{id}` | — | Poll execution status |

Execution request body:

```json
{
  "code": "...",
  "language": "JAVA",
  "executionType": "PRACTICE",
  "assignmentId": "uuid",
  "requesterId": "uuid",
  "testCases": ["input1", "input2"]
}
```

`PRACTICE` — inline test cases are compared against the reference solution output.  
`DEFINITIVE` — submission is compared against pre-generated expected outputs from MinIO.

### Rate Limits

| Endpoint | Limit | Window |
|---|---|---|
| POST `/api/auth/login` | 5 requests | 60 s |
| POST `/api/auth/signup` | 3 requests | 5 min |
| POST `/api/recovery-password/forgot` | 3 requests | 5 min |
| POST `/api/recovery-password/reset` | 5 requests | 5 min |
| POST `/api/execution/check` | 10 requests | 60 s |

## Execution Verdict Reference

| Status | Meaning |
|---|---|
| `PENDING` | Queued, not yet processed |
| `AC` | Accepted — all test cases passed |
| `WA` | Wrong Answer |
| `CE` | Compilation Error |
| `RTE` | Runtime Error |
| `TLE` | Time Limit Exceeded |
| `MLE` | Memory Limit Exceeded |

Overall verdict priority when tests fail: `CE > TLE > MLE > RTE > WA`.

## Supported Languages

| Language | Compile command | Run command |
|---|---|---|
| Java | `javac Main.java` | `java Main` |
| Python | — | `python main.py` |
| C | `gcc -o program main.c -lm` | `./program` |
| C++ | `g++ -o program main.cpp -std=c++17 -lm` | `./program` |

## Testing

```bash
# Backend unit and integration tests
cd codehive-backend
./gradlew test

# With coverage report
./gradlew test jacocoTestReport
open build/reports/jacoco/test/html/index.html

# Worker tests
cd codehive-worker
./gradlew test

# Frontend type check
cd codehive-frontend
npm run typecheck
```

## Project Structure

```
CodeHive/
├── codehive-backend/       ← Spring Boot REST API
│   ├── src/main/java/com/github/codehive/
│   │   ├── config/         ← RabbitMQ, MinIO, Security, WebSocket, Async
│   │   ├── controller/     ← Auth, RecoveryPassword, Assignment, CheckExecution
│   │   ├── messaging/      ← Producers and listeners for both queue pairs
│   │   ├── model/          ← Entities, DTOs, queue DTOs, requests, responses
│   │   ├── repository/     ← JPA repositories (UUID primary keys)
│   │   ├── security/       ← JWT filter, UserDetailsService
│   │   ├── service/        ← Auth, Assignment, Execution, ObjectStorage, Mail
│   │   ├── ratelimit/      ← @RateLimit annotation and aspect
│   │   ├── websocket/      ← CSV progress handler
│   │   └── utils/          ← ObjectKeyBuilder, FileExtensionUtil, JwtUtil
│   └── src/test/           ← Unit and integration tests
│
├── codehive-worker/        ← Sandboxed execution worker
│   └── src/main/java/com/github/codehive/worker/
│       ├── config/         ← Docker client, MinIO, RabbitMQ
│       ├── messaging/      ← Listeners (execution + generation) and producers
│       ├── model/          ← DTOs and enums
│       ├── sandbox/        ← LanguageExecutor interface and implementations
│       └── service/        ← TestExecutionService, TestGenerationService
│
├── codehive-frontend/      ← React Router v7 SPA
│   └── app/
│       ├── components/     ← Reusable UI and ProtectedRoute guard
│       ├── context/        ← Auth and theme providers
│       ├── pages/          ← Admin, login, recovery pages
│       ├── routes/         ← Route entry files
│       ├── services/       ← AuthService, RecoveryPasswordService
│       └── types/          ← TypeScript contracts
│
└── llms/                   ← Implementation documentation for AI agents
    ├── backend/
    ├── frontend/
    └── worker/
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Write tests for your changes
4. Ensure all tests pass
5. Open a Pull Request against `main`

## License

MIT — see [LICENSE](LICENSE) for details.

## Authors

- **Irmin Hernandez Jimenez** — [IrminDev](https://github.com/IrminDev)
- **Johann Daniel Trejo Flores** — [JohannTF](https://github.com/JohannTF)
- **Rodolfo Aparicio Lopez** — [rodolfo-rgb ](https://github.com/rodolfo-rgb)


---
