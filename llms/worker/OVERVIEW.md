# Worker Overview

## What This Component Does
The worker is a background Spring Boot service responsible for sandboxed code execution and test output generation. It consumes jobs from RabbitMQ, runs code in isolated Docker environments, evaluates outputs, and publishes results back to the backend.

Main responsibilities:
- Consume student execution jobs and produce execution reports.
- Consume teacher assignment creation jobs and generate expected test outputs.
- Select the proper language executor.
- Run untrusted code with sandbox and timeout constraints.
- Compare produced output with expected output.
- Publish results to backend-facing queues.

## How It Works

### Student Execution Pipeline
1. Backend publishes ExecutionJob to `codehive_queue`.
2. ExecutionRequestListener receives and logs the job.
3. TestExecutionService runs the submission in a language executor.
4. Per-test results are aggregated and artifacts uploaded to MinIO.
5. ExecutionResultProducer publishes ExecutionReport to `codehive_result_queue`.

### Test Generation Pipeline
1. Backend publishes TestGenerationJob to `codehive_test_generation_queue`.
2. TestGenerationRequestListener receives and delegates to TestGenerationService.
3. Service compile-checks reference solution, then executes it for each test case input.
4. Outputs are uploaded to MinIO at the expected output paths.
5. TestGenerationResultProducer publishes TestGenerationResult to `codehive_test_generation_result_queue`.
6. Backend activates the assignment on success.

Safety and reliability concerns:
- Timeout protection prevents runaway executions.
- Language-specific executors isolate compile/run logic.
- Compilation gate aborts both pipelines early on CE.
- Results (including failures) are always published — no silent job loss.

## Useful Commands
Run these from codehive-worker.

Build and run:
- ./gradlew build
- ./gradlew bootRun

Testing:
- ./gradlew test

Operational dependency:
- RabbitMQ and MinIO must be running before bootRun.

Typical local setup:
1. Start infrastructure from codehive-backend using `docker compose up -d`.
2. Run backend.
3. Run worker.

## Project Folder Structure
Runtime module structure (codehive-worker/src/main/java/com/github/codehive/worker):
- config: Worker infrastructure configuration (Docker client, MinIO, RabbitMQ).
- messaging/listener: ExecutionRequestListener, TestGenerationRequestListener.
- messaging/producer: ExecutionResultProducer, TestGenerationResultProducer.
- model/dto: ExecutionReport, TestCaseResult, ExecutionResult.
- model/dto/queue: ExecutionJob, TestGenerationJob, TestCaseInfo, TestGenerationResult.
- model/enums: Language, ExecutionType, ExecutionStatus, ComparatorType.
- sandbox: Execution core and language implementations.
- service: TestExecutionService, TestGenerationService, ObjectStorageService, OutputComparatorService.

Sandbox structure highlights:
- sandbox/factory: Executor selection by Language enum.
- sandbox/java, sandbox/python, sandbox/c, sandbox/cpp: Language-specific strategies.
- sandbox/LanguageExecutor.java: Executor contract.

Worker docs structure in llms/worker:
- OVERVIEW.md: This document.
- comparator: Output comparison behavior and rules.
- execution: Execution and generation lifecycle.
- messaging: Queue payloads and message flow.
- sandbox: Isolation, execution strategy, and constraints.

## How To Navigate Worker Docs
Read in this order:
1. llms/worker/OVERVIEW.md
2. The relevant domain folder in llms/worker
3. The corresponding package in codehive-worker
