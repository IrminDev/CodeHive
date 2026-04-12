# Backend Overview

## What This Component Does
The backend is the central API for CodeHive. It handles authentication, user flows, execution orchestration, persistence, and integration with infrastructure services such as PostgreSQL, RabbitMQ, and object storage.

Main responsibilities:
- Expose REST endpoints used by the frontend.
- Validate and authorize requests.
- Execute business logic in service classes.
- Persist and query data with JPA repositories.
- Publish and consume execution-related messages.
- Return standardized API responses and errors.

## How It Works
Typical request flow:
1. A client calls a controller endpoint.
2. Request payload is validated.
3. Security and rate-limiting checks are applied.
4. Controller delegates to a service.
5. Service uses repositories, utilities, messaging, or external integrations.
6. A structured response is returned to the client.

Execution flow at a high level:
1. Backend receives an execution request.
2. Backend stores required metadata and/or files.
3. Backend publishes a message to RabbitMQ for the worker.
4. Worker processes the job and publishes results.
5. Backend consumes the result and exposes it through API endpoints.

## Useful Commands
Run these from codehive-backend.

Setup and run:
- ./gradlew bootRun
- ./gradlew build
- ./gradlew clean build

Tests and coverage:
- ./gradlew test
- ./gradlew jacocoTestReport

Infrastructure services (from codehive-backend):
- docker compose up -d
- docker compose down

Common local endpoints:
- API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html

## Project Folder Structure
Runtime module structure (codehive-backend/src/main/java/com/github/codehive):
- config: Spring and infrastructure configuration.
- controller: HTTP entry points.
- service: Business logic and orchestration.
- repository: Data access layer.
- model: Entities, DTOs, requests, responses, exceptions.
- security: Auth and security-related classes.
- messaging: Queue listeners/producers and messaging contracts.
- ratelimit: Request throttling concerns.
- websocket: Realtime communication support.
- utils: Shared utility helpers.

Testing structure:
- codehive-backend/src/test/java for unit and integration tests.

Backend docs structure in llms/backend:
- OVERVIEW.md: This document.
- auth: Authentication and authorization details.
- controller: Controller-level conventions and API patterns.
- executions: Execution request and result lifecycle.
- messaging: Queue contracts, listeners, and producers.
- model: Data model and DTO conventions.
- security: Security architecture and policies.
- service: Service-layer behavior and orchestration rules.

## How To Navigate Backend Docs
Read in this order:
1. llms/backend/OVERVIEW.md
2. The relevant domain folder in llms/backend
3. The corresponding source package in codehive-backend
