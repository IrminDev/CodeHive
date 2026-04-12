# Worker Overview

## What This Component Does
The worker is a background Spring Boot service responsible for sandboxed code execution. It consumes execution jobs from RabbitMQ, runs code in isolated environments, evaluates outputs, and publishes results back to the system.

Main responsibilities:
- Consume execution jobs from message queues.
- Select the proper language executor.
- Run untrusted code with sandbox and timeout constraints.
- Compare produced output with expected output when required.
- Publish execution results to backend-facing queues.

## How It Works
Execution pipeline:
1. Backend publishes an execution job message.
2. Worker listener receives and validates the job.
3. Worker fetches required assets and input data.
4. Worker selects a language executor through a factory.
5. Code is compiled/run inside constrained execution environments.
6. Comparator logic validates output when test-based execution is used.
7. Worker publishes the final execution result message.

Safety and reliability concerns:
- Timeout protection prevents runaway executions.
- Language-specific executors isolate compile/run logic.
- Messaging decouples API traffic from execution workload.

## Useful Commands
Run these from codehive-worker.

Build and run:
- ./gradlew build
- ./gradlew bootRun

Testing:
- ./gradlew test

Operational dependency:
- RabbitMQ must be running before bootRun.

Typical local setup:
1. Start infrastructure from codehive-backend using docker compose up -d.
2. Run backend.
3. Run worker.

## Project Folder Structure
Runtime module structure (codehive-worker/src/main/java/com/github/codehive/worker):
- config: Worker infrastructure configuration.
- messaging: Queue listeners and producers.
- model: Worker DTOs and enums.
- sandbox: Execution core and language implementations.
- service: Worker service-level integrations.
- WorkerApplication.java: Spring Boot entry point.

Sandbox structure highlights:
- sandbox/factory: Executor selection.
- sandbox/java, sandbox/python, sandbox/c, sandbox/cpp: Language-specific execution strategies.
- sandbox/LanguageExecutor.java: Executor contract.

Worker docs structure in llms/worker:
- OVERVIEW.md: This document.
- comparator: Output comparison behavior and rules.
- execution: Execution lifecycle and orchestration.
- messaging: Queue payloads and message flow.
- sandbox: Isolation, execution strategy, and constraints.

## How To Navigate Worker Docs
Read in this order:
1. llms/worker/OVERVIEW.md
2. The relevant domain folder in llms/worker
3. The corresponding package in codehive-worker
