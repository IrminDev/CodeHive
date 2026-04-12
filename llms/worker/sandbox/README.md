# Worker Sandbox Implementation

## Scope
This document explains how language executors run code in isolated Docker containers with time and memory constraints.

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
- sourceCode input stream
- testInput input stream (nullable)
- timeLimitMs
- memoryLimitMb

Returns ExecutionResult with:
- status
- output / errorOutput
- executionTimeMs
- memoryUsedMb
- exitCode
- compilationError (when applicable)

## Isolation Strategy
Each execution uses temporary filesystem workspace and Docker container isolation.

Container restrictions:
- no network access (networkMode none)
- memory hard limit and swap disabled
- CPU quota for bounded CPU usage

Timeout control:
- WaitContainer uses Future timeout based on timeLimitMs.
- timeout leads to TLE.

Memory limit signaling:
- exit code 137 is interpreted as likely OOM and mapped to MLE.

## Language-Specific Behavior
Java:
- compile step with javac Main.java
- run step with java Main

Python:
- no explicit compile step
- syntax errors are treated as CE when stderr includes SyntaxError

C:
- compile with gcc -o program main.c -lm
- run compiled binary

C++:
- compile with g++ -o program main.cpp -std=c++17 -lm
- run compiled binary

All executors:
- optionally pipe input.txt when test input exists
- capture stdout and stderr from container logs
- attempt to read peak memory via Docker stats snapshot
- clean up container and temporary directory in finally blocks

## Image Management
On executor initialization:
- inspect configured base image
- pull image if missing

Default images:
- Java: eclipse-temurin:21-jdk-ubi10-minimal
- Python: python:3.11-slim
- C/C++: gcc:latest

## Factory Resolution
LanguageExecutorFactory receives Spring component map keyed by bean names.
- Bean names are language enum names (JAVA, PYTHON, C, CPP).
- Unknown or null language throws IllegalArgumentException.

## Extension Guidance
- To add a new language:
  1. implement LanguageExecutor
  2. register Spring component with enum-name bean key
  3. extend Language enum and backend mapping
  4. verify ExecutionJob contract supports new language
