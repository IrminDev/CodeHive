# Worker Comparator Implementation

## Scope
This document explains how output comparison is implemented in the worker.

Main class:
- codehive-worker/src/main/java/com/github/codehive/worker/service/OutputComparatorService.java

Comparator enum:
- codehive-worker/src/main/java/com/github/codehive/worker/model/enums/ComparatorType.java

## Supported Comparator Types
- EXACT_MATCH
- FLOATING_POINT

## Comparison Workflow
1. TestExecutionService executes submission and obtains actual output.
2. Expected output is resolved from:
   - definitive mode: .out files from object storage
   - practice mode: reference solution execution output
3. OutputComparatorService.compareWithFeedback is called.
4. Result includes:
   - matches boolean
   - feedback message for diagnostics
5. If comparison fails, test case status is set to WA.

## EXACT_MATCH Behavior
- Normalizes output into trimmed non-empty lines.
- Requires same line count and exact line equality.
- Returns detailed mismatch feedback including line number and truncated diff values.

## FLOATING_POINT Behavior
- Also normalizes lines.
- Compares token-by-token.
- Tries numeric parse first and applies epsilon tolerance of 1e-9.
- Falls back to string equality for non-numeric tokens.

## Error and Fallback Rules
- If expected and actual are both null, comparison passes.
- If only one is null, comparison fails.
- Unknown comparator type falls back to EXACT_MATCH with warning logs.

## Integration Points
- Caller: TestExecutionService
- Affects: TestCaseResult.status and feedback
- Contributes to: ExecutionReport overall status determination

## Extension Guidance
- Add comparator enum values in ComparatorType and implement branch handling in OutputComparatorService.
- Keep feedback deterministic and concise, since it is user-facing diagnostic text.
