# Backend Overview

## What This Component Does
The backend is the central API for CodeHive. It handles authentication, user flows, assignment management, execution orchestration, persistence, and integration with PostgreSQL, RabbitMQ, and MinIO.

Main responsibilities:
- Expose REST endpoints used by the frontend.
- Validate and authorize requests.
- Execute business logic in service classes.
- Persist and query data with JPA repositories.
- Publish and consume execution-related and assignment-related messages.
- Return standardized API responses and errors.

## How It Works

### Typical request flow
1. A client calls a controller endpoint.
2. Request payload is validated.
3. Security and rate-limiting checks are applied.
4. Controller delegates to a service.
5. Service uses repositories, utilities, messaging, or external integrations.
6. A structured response is returned to the client.

### Assignment creation flow (teacher)
1. Teacher sends multipart request with metadata, reference solution file, and test case input files.
2. AssignmentService persists entities and uploads files to MinIO.
3. Backend publishes TestGenerationJob to `codehive_test_generation_queue`.
4. Worker generates expected outputs and publishes TestGenerationResult.
5. Backend activates the assignment on success.

### Student execution flow
1. Backend receives an ExecutionRequest.
2. Loads Assignment to get real time/memory limits and comparator.
3. Stores source code in MinIO and publishes ExecutionJob to `codehive_queue`.
4. Worker processes the job and publishes ExecutionReport to `codehive_result_queue`.
5. Backend updates Execution status; client polls GET /api/execution/check/{id}.

## Useful Commands
Run these from codehive-backend.

Setup and run:
- ./gradlew bootRun
- ./gradlew build
- ./gradlew clean build

Tests and coverage:
- ./gradlew test
- ./gradlew jacocoTestReport

Infrastructure services:
- docker compose up -d
- docker compose down

Common local endpoints:
- API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html

## Project Folder Structure
Runtime module structure (codehive-backend/src/main/java/com/github/codehive):
- config: Spring and infrastructure configuration (RabbitMQ, MinIO, Security, WebSocket, Async).
- controller: HTTP entry points (Auth, RecoveryPassword, CheckExecution, Assignment).
- service: Business logic and orchestration.
- repository: Data access layer (JpaRepository<Entity, UUID> for all).
- model: Entities, DTOs, requests, responses, exceptions.
- security: Auth filter and UserDetailsService.
- messaging: Queue listeners/producers for execution and test generation.
- ratelimit: Request throttling via @RateLimit annotation and aspect.
- websocket: CSV progress streaming.
- utils: ObjectKeyBuilder, FileExtensionUtil, JwtUtil, PasswordGenerator.

Testing structure:
- codehive-backend/src/test/java for unit and integration tests.

Backend docs structure in llms/backend:
- OVERVIEW.md: This document.
- auth: Authentication and authorization details.
- controller: Controller-level conventions and API patterns.
- executions: Assignment creation, execution request and result lifecycle.
- messaging: Queue contracts, listeners, and producers.
- model: Data model and DTO conventions.
- security: Security architecture and policies.
- service: Service-layer behavior and orchestration rules.
- groups: Group ownership, enrollment, assignment lifecycle, deliveries, and functional requirements.
- notifications: Email preference, RabbitMQ delivery, templates, scheduling, and retry rules.
- metrics: Teacher-facing student performance metrics catalog and API contract.

## How To Navigate Backend Docs
Read in this order:
1. llms/backend/OVERVIEW.md
2. The relevant domain folder in llms/backend
3. The corresponding source package in codehive-backend
