# Worker Sandbox Implementation

## Scope
This document explains how language executors run code in isolated Docker containers with full security hardening.

Core abstraction:
- codehive-worker/src/main/java/com/github/codehive/worker/sandbox/LanguageExecutor.java

Factory:
- codehive-worker/src/main/java/com/github/codehive/worker/sandbox/factory/LanguageExecutorFactory.java

Executors:
- JAVA: sandbox/java/JavaExecutor.java
- PYTHON: sandbox/python/PythonExecutor.java
- C: sandbox/c/CExecutor.java
- CPP: sandbox/cpp/CPPExecutor.java

## Executor Contract
LanguageExecutor.execute arguments:
- sourceCode input stream (capped at 512 KB before writing to disk)
- testInput input stream (nullable; capped at 64 MB before writing to disk)
- timeLimitMs
- memoryLimitMb

Returns ExecutionResult with:
- status (AC, WA, TLE, MLE, OLE, RTE, CE, PENDING)
- output / errorOutput
- executionTimeMs
- memoryUsedMb
- exitCode
- compilationError (when applicable)

Job-supplied limits are clamped to 100–10,000 ms, 16–1,000 MB, and at most 50 test cases per job.

## Container Security Hardening
All containers (both compile and execute phases) apply these restrictions:

| Restriction | Detail |
|---|---|
| Network | `networkMode("none")` — no outbound access |
| Memory | Hard limit + swap disabled (`memorySwap = memory`) |
| CPU | 1 vCPU (`cpuQuota = 100000`) |
| PIDs | 64 for Java/Python, 32 for C/C++ — prevents fork bombs |
| Capabilities | `withCapDrop(Capability.ALL)` — no Linux capabilities |
| Root filesystem | `withReadonlyRootfs(true)` — no writes outside /workspace and /tmp |
| tmpfs /tmp | 64 MB (compile), 32 MB (execute) — satisfies runtime scratch needs |
| tmpfs /run | 8 MB — for runtime lock files |
| File size ulimit | 64 MB per file (compile), 32 MB per file (execute) — prevents disk exhaustion |
| No privilege gain | `no-new-privileges:true` in security opts |
| Seccomp | Custom profile at `resources/seccomp/sandbox-profile.json` |
| User | `withUser("nobody")` — containers never run as root |

Seccomp profile blocks: `unshare`, `ptrace`, `bpf`, `io_uring_*`, `keyctl`, `mount`, `reboot`, kernel module syscalls, and `clone` with `CLONE_NEWUSER` flag.

Temp directory permissions are set to `rwxrwxrwx` so `nobody` can access the workspace. Source and input files are set to `r--r--r--`.

## Output Size Limit (OLE verdict)
stdout and stderr are captured with a shared 8 MB cap across both streams. When exceeded the executor returns `ExecutionResult.outputLimitExceeded()` with status `OLE`.

Compilation stderr is separately capped at 256 KB.

The `getContainerLogsLimited` method in each executor implements this via a synchronized shared byte counter in the Docker log callback.

## Timeout and Memory Signals
- Timeout: Future.get(timeLimitMs + 1000) → TLE on TimeoutException.
- Memory: exit code 137 (SIGKILL from OOM killer) → MLE.

## Language-Specific Behavior
Java:
- compile: `javac Main.java` (512 MB memory, 64 PID limit)
- execute: `java Main` or `java Main < input.txt`

Python:
- no compile phase
- syntax errors (SyntaxError in stderr) → CE
- `PYTHONDONTWRITEBYTECODE=1` prevents `__pycache__` writes

C:
- compile: `gcc -o program main.c -lm`
- execute: `./program` or `./program < input.txt`

C++:
- compile: `g++ -o program main.cpp -std=c++17 -lm`
- execute: `./program` or `./program < input.txt`

All executors:
- optionally pipe input.txt when test input is non-empty
- capture stdout/stderr with OLE check
- read peak memory via Docker stats snapshot after container exits
- clean up container and temporary directory in finally blocks using symlink-safe `walkFileTree` deletion

## Image Management
On executor initialization:
- inspect configured base image
- pull image if missing

Default images:
- Java: eclipse-temurin:21-jdk-ubi10-minimal
- Python: python:3.11-slim
- C/C++: gcc:latest

## Seccomp Profile
File: `codehive-worker/src/main/resources/seccomp/sandbox-profile.json`
- defaultAction: SCMP_ACT_ALLOW (permissive base — Docker restrictions remain active)
- Explicitly blocks all dangerous syscalls with `SCMP_ACT_ERRNO`
- Loaded once at class initialization via static block; if loading fails the container runs without it (logged as warning)

## Factory Resolution
LanguageExecutorFactory receives Spring component map keyed by bean names.
- Bean names are language enum names (JAVA, PYTHON, C, CPP).
- Unknown or null language throws IllegalArgumentException.

## Extension Guidance
To add a new language:
1. Implement LanguageExecutor with the same security HostConfig pattern.
2. Register Spring component with enum-name bean key.
3. Extend Language enum and backend mapping.
4. Choose appropriate PIDS_LIMIT (64 for JVM/interpreter, 32 for native).
5. Verify ExecutionJob contract supports new language.
