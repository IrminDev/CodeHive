# Automated evidence: retried AI requests do not consume extra quota

Executed: 25 October 2026, America/Mexico_City.

## Claim and scope

Resending the same student/assignment request with the same `clientRequestId` and
payload does not create another interaction, restart answer generation, or add a
quota charge. A new ID represents a new attempt and follows normal quota rules.

Two existing tests in
[AssistantControllerIntegrationTest.java](../../codehive-backend/src/test/java/com/github/codehive/controller/AssistantControllerIntegrationTest.java)
were strengthened to verify HTTP responses, database state, quota counters, and
model-boundary invocation counts after **three consecutive replays**.

These are Spring/MockMvc integration tests with real authentication, controller,
assistant services, quota transactions, and JPA persistence against the test-profile
H2 database. The guardrail/model-generation boundary is mocked deterministically;
there are no paid Gemini calls or deliberately unstable network conditions.
Production behavior was not modified.

## Evidence A: completed answer replay charges once

Test: `completedAnswerChargesOnceAndReplayDoesNotCallModelAgain`.

The assignment starts with a lifetime quota of **one answer**. The test sends one
successful POST and then submits the exact same payload three more times. This
checks server recovery semantics for a client that did not receive the first
successful response; it does not simulate physical packet loss.

| Step | HTTP | Interaction | Used | Reserved | Remaining | Database interaction rows | Generation executions |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| Initial availability | 200 | None | 0 | — | 1 | 0 | 0 |
| First POST | 200 | COMPLETED | 1 | — | 0 | 1 | 1 |
| Replay 1 | 200 | Same ID, COMPLETED | 1 | 0 | 0 | 1 | 1 |
| Replay 2 | 200 | Same ID, COMPLETED | 1 | 0 | 0 | 1 | 1 |
| Replay 3 | 200 | Same ID, COMPLETED | 1 | 0 | 0 | 1 | 1 |
| New-ID control | 429 / QUOTA_EXHAUSTED | No new interaction | — | — | — | 1 | 1 |

Each replay asserts the exact original interaction ID, its original client request
ID, `quotaCharged=true`, and unchanged quota counters. One stored interaction with
one charged flag is one charged answer, not a separate charge per HTTP response.
The final availability GET independently confirms `used=1`, `remaining=0`, and
`reason=QUOTA_EXHAUSTED`. A fresh request ID is rejected because quota is exhausted.

## Evidence B: failed request replay remains uncharged

Test: `timeoutStoresUnchargedFailureAndReturnsSafeCode`.

The mock raises `MODEL_TIMEOUT` on the initial generation execution. The test then
replays the same payload three times and finally makes a new-ID attempt whose
mocked answer succeeds.

| Step | HTTP | Interaction | Used | Reserved | Remaining | Database interaction rows | Generation executions |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| Initial failed POST | 504 / MODEL_TIMEOUT | FAILED | — | — | — | 1 | 1 |
| Availability after timeout | 200 | Existing failure | 0 | 0 | 1 | 1 | 1 |
| Replay 1 | 200 | Same ID, FAILED | 0 | 0 | 1 | 1 | 1 |
| Replay 2 | 200 | Same ID, FAILED | 0 | 0 | 1 | 1 | 1 |
| Replay 3 | 200 | Same ID, FAILED | 0 | 0 | 1 | 1 | 1 |
| New-ID control | 200 | New COMPLETED interaction | 1 | — | 0 | 2 | 2 |

Every replay retains `failureCode=MODEL_TIMEOUT`, `quotaCharged=false`, no assistant
response, and the same persisted interaction ID. Generation is verified to have
executed only once before the new-ID control. After that control, the database has
two interactions but **only one charged interaction**.

HTTP 200 on a replay means the saved interaction was retrieved successfully. Its
status remains FAILED: this does not claim that a terminal failed interaction was
regenerated successfully. The new-ID control proves a new attempt can use the
quota that the failed interaction did not consume.

`Generation executions` counts calls to `AssistantGuardrailService.generate`, not
individual provider HTTP calls or the separate input/generation/output stages.

## Reproduce and attach evidence

From `codehive-backend`, using Java 21:

```bash
./gradlew test \
  --tests '*AssistantControllerIntegrationTest.completedAnswerChargesOnceAndReplayDoesNotCallModelAgain' \
  --tests '*AssistantControllerIntegrationTest.timeoutStoresUnchargedFailureAndReturnsSafeCode'
```

Executed focused result:

```text
Tests run: 2
Passed: 2
Failed: 0
Skipped: 0
BUILD SUCCESSFUL
```

Broader regression validation also passed: **35 tests**, zero failures or skips,
covering both `AssistantControllerIntegrationTest` and
`AssistantTransactionServiceIntegrationTest`, including concurrent finalization.

```bash
./gradlew test \
  --tests '*AssistantControllerIntegrationTest' \
  --tests '*AssistantTransactionServiceIntegrationTest'
```

For the technical-document attachment, include this evidence note, the two test
methods, and a screenshot/export of the Gradle report showing their passing results:

- HTML report: `codehive-backend/build/reports/tests/test/index.html`.
- JUnit XML: `codehive-backend/build/test-results/test/TEST-com.github.codehive.controller.AssistantControllerIntegrationTest.xml`.

Gradle regenerates reports on subsequent test runs; preserve the relevant report
with your submission and record its application revision. The counters above are
assertions that passed in the integration run, not manually observed browser logs.

## Why the implementation prevents duplicate charges

- [AssistantTransactionService](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantTransactionService.java)
  looks up an existing interaction by conversation and client request ID, checks
  its payload fingerprint, and returns it as a replay before new reservation.
- [AssistantService](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantService.java)
  returns saved interaction state when the reservation is a replay, bypassing
  context building and generation.
- [AssistantInteraction](../../codehive-backend/src/main/java/com/github/codehive/model/entity/AssistantInteraction.java)
  declares a database uniqueness constraint on conversation/client request ID.
- Existing `concurrentFinalizationChargesOnlyOnce` in
  [AssistantTransactionServiceIntegrationTest](../../codehive-backend/src/test/java/com/github/codehive/service/assistant/AssistantTransactionServiceIntegrationTest.java)
  checks two concurrent finalizations yield DELIVERED and ALREADY_FINISHED with
  exactly one charged row. H2 coverage is not a substitute for PostgreSQL-specific
  locking qualification.

Suggested technical-document statement:

> Repeated-request quota safety was verified through automated HTTP/database
> integration tests. Three replays of a completed request retained the original
> interaction and one total quota charge. Three replays after a simulated model
> timeout retained the original failed interaction and zero quota charges. New-ID
> controls confirmed that distinct requests follow normal quota rules. Both focused
> tests passed without real Gemini calls.
