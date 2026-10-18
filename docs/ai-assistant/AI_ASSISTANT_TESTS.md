# AI assistant automated tests

Revision: 17 October 2026.

This change adds **80 test executions**: **51 backend unit**, **14 backend integration**,
and **15 frontend hook** cases. Parameterized inputs count as separate executions.
Existing useful tests are retained. No production behavior is changed.

## Files added or extended

Backend paths below are relative to `codehive-backend/src/test/java/com/github/codehive/`.

| File | Change | Type | New executions | Total in file |
| --- | --- | --- | ---: | ---: |
| [AiPolicyRulesTest.java](../../codehive-backend/src/test/java/com/github/codehive/service/AiPolicyRulesTest.java) | Added | Unit | 11 | 11 |
| [AssignmentAiPolicyServiceTest.java](../../codehive-backend/src/test/java/com/github/codehive/service/AssignmentAiPolicyServiceTest.java) | Added | Unit | 6 | 6 |
| [AssistantServiceTest.java](../../codehive-backend/src/test/java/com/github/codehive/service/assistant/AssistantServiceTest.java) | Added | Unit | 15 | 15 |
| [AssistantGuardrailServiceTest.java](../../codehive-backend/src/test/java/com/github/codehive/service/assistant/AssistantGuardrailServiceTest.java) | Extended | Unit | 12 | 21 |
| [AssistantContextServiceTest.java](../../codehive-backend/src/test/java/com/github/codehive/service/assistant/AssistantContextServiceTest.java) | Extended | Unit | 7 | 11 |
| [AssistantControllerIntegrationTest.java](../../codehive-backend/src/test/java/com/github/codehive/controller/AssistantControllerIntegrationTest.java) | Extended | Spring/HTTP/database integration | 10 | 23 |
| [AssistantTransactionServiceIntegrationTest.java](../../codehive-backend/src/test/java/com/github/codehive/service/assistant/AssistantTransactionServiceIntegrationTest.java) | Extended | Spring/database integration | 4 | 12 |
| [useAssignmentAssistant.test.tsx](../../codehive-frontend/app/features/student/hooks/useAssignmentAssistant.test.tsx) | Added | React hook with mocked API | 15 | 15 |

## New backend unit cases

### AiPolicyRulesTest

| Test | Executions | Coverage |
| --- | ---: | --- |
| `enabledPolicyAcceptsBothQuotaBoundaries` | 2 | Enabled quota accepts 1 and 10; preserves the requested help level. |
| `disablingRequiresZeroQuotaAndPreservesChosenLevel` | 1 | Disabled policy uses zero quota while retaining its assistance level. |
| `invalidPolicyDoesNotPartiallyMutateExistingValues` | 8 | Rejects enabled quota -1/0/11, disabled quota -1/1, and each missing required field. Failed validation leaves the original policy unchanged. |

### AssignmentAiPolicyServiceTest

| Test | Executions | Coverage |
| --- | ---: | --- |
| `updatesExistingPolicyAfterWritableOwnershipCheck` | 1 | Checks writable ownership before locking/saving policy and returns saved settings. |
| `createsMissingPolicyAttachedToAssignment` | 1 | Creates a missing policy tied to the correct assignment. |
| `unauthorizedOrReadOnlyGroupCannotReadOrWritePolicy` | 1 | A rejected group authorization prevents policy access and persistence. |
| `invalidQuotaDoesNotSaveOrMutateExistingPolicy` | 1 | Invalid settings neither overwrite existing values nor call save. |
| `missingAuthenticatedUserStopsBeforeAssignmentLookup` | 1 | Missing identity prevents downstream work. |
| `missingAssignmentStopsBeforePolicyOrOwnershipWork` | 1 | Unknown assignment cannot create or modify policy. |

### AssistantServiceTest

| Test | Executions | Coverage |
| --- | ---: | --- |
| `globalSwitchPreservesQuotaButPreventsReservations` | 1 | Global disable retains quota/pending metadata but prevents reservation and model work. |
| `nonStudentsCannotReadAvailabilityOrAsk` | 2 | Both teacher and admin identities are rejected before accessing assistant collaborators. |
| `nullRequestCannotReserveQuota` | 1 | Null requests fail before quota reservation. |
| `replayReturnsPersistedStateWithoutStartingNewModelWork` | 6 | Replays PENDING, COMPLETED, REDIRECTED, BLOCKED, FAILED, and CANCELLED records without rebuilding context or restarting model work. |
| `changedInitialPolicyCancelsBeforeBuildingOrSendingContext` | 1 | Policy version mismatch cancels before context construction or transmission. |
| `rejectedContextReservationPreventsModelTransmission` | 1 | Cancellation during context attachment prevents generation. |
| `unexpectedProviderFailureIsSanitizedAndStopsWithoutDelivery` | 1 | Unexpected exception becomes safe `MODEL_FAILURE`; raw provider details are not returned and no delivery occurs. |
| `knownProviderTimeoutKeepsSafeCodeAndStopsWithoutDelivery` | 1 | Preserves `MODEL_TIMEOUT`, marks failure, and prevents delivery. |
| `terminalHistoryMismatchNeverReleasesGeneratedCandidate` | 1 | A cancelled persisted record prevents response release even after delivery reports success. |

### AssistantGuardrailServiceTest additions

| Test | Executions | Coverage |
| --- | ---: | --- |
| `malformedInputReviewNeverStartsAnswerGeneration` | 4 | Invalid JSON, array, unknown classification, and wrong response shape cannot authorize generation. |
| `unsafeProseIsRejectedLocallyBeforeSemanticReview` | 4 | Script markup, HTTPS links, fenced code, and JavaScript URLs fail local checks; two rejected candidates terminate without release. |
| `malformedCandidatesRegenerateOnceWithoutBeingReleased` | 3 | Invalid JSON, missing fields, and unexpected extra fields trigger one regeneration; only the valid reviewed replacement is returned. |
| `nonBooleanOutputApprovalCannotAuthorizeCandidate` | 1 | String `"true"` is not boolean approval; the rejected candidate is replaced and reviewed within five calls. |

Existing cases retain coverage for normal three-call delivery, blocked input, educational
redirection, per-call eligibility, forbidden/oversized snippets, rejected regeneration,
and retained history in semantic review.

### AssistantContextServiceTest additions

| Test | Executions | Coverage |
| --- | ---: | --- |
| `executionOptInWithoutFinishedExecutionReportsUnavailable` | 1 | Missing eligible execution produces an explicit unavailable flag without an artifact read. |
| `codeAtMaximumLengthIsIncludedOnlyWithOptIn` | 1 | Explicitly shared editor code accepts the 32,768-character boundary. |
| `blankOptedInCodeIsRejectedBeforeStorageReads` | 2 | Empty and whitespace-only shared code are rejected. |
| `oversizedOrUnconsentedCodeIsRejected` | 1 | Rejects 32,769 characters and code supplied without consent. |
| `wrongExecutionReportIdentityKeepsOnlySummary` | 1 | A report belonging to another execution contributes no diagnostics; safe execution summary remains. |
| `missingExecutionArtifactDoesNotFailEducationalContext` | 1 | Artifact failure preserves public assignment/summary and marks report unavailable. |

Existing cases retain coverage for opt-out, definitive hidden-output protection, expired
artifacts, and exclusion of erased or more permissive history.

## New backend integration cases

### AssistantControllerIntegrationTest additions

These tests exercise real HTTP mapping, JWT authentication, validation, services, and JPA
persistence through MockMvc. Most stub the guardrail boundary; the regeneration case
uses the real guardrail service with a deterministic fake model.

| Test | Executions | Coverage |
| --- | ---: | --- |
| `historyPagesAreNewestFirstWithoutDuplicatingInteractions` | 1 | Two persisted questions appear on distinct newest-first pages with correct total/last metadata. |
| `ownHistoryRemainsReadableAfterLeavingEnrollment` | 1 | Assistance becomes unavailable after leaving, while both own history list and detail remain readable. |
| `studentWithOwnConversationCannotReadAnotherStudentsInteraction` | 1 | Even with an existing conversation, another student's interaction returns 404; listing contains only the authenticated student's records. |
| `invalidHistoryPaginationIsRejected` | 3 | Negative page, zero size, and size 51 return HTTP 400. |
| `blankQuestionsNeverReserveOrCallModel` | 2 | Empty/whitespace questions return HTTP 400 without interaction rows or model work. |
| `oversizedQuestionNeverReservesOrCallsModel` | 1 | A 2,001-character question is rejected before reservation/model work. |
| `approvedRegenerationUsesFiveCallsAndChargesOnlyDeliveredReplacement` | 1 | Real orchestration and guardrails use input review, two generations, and two output reviews. Only the second approved answer is persisted; quota charges once. |

Existing cases retain coverage for replay, blocked/timeout outcomes, safe logging,
teacher denial, archive during generation, policy changes at each stage, and refusing
a sixth model call without resetting the budget on replay.

### AssistantTransactionServiceIntegrationTest additions

| Test | Executions | Coverage |
| --- | ---: | --- |
| `scheduledRecoveryExpiresAbandonedRequestOnceAndFreesConversation` | 1 | Scheduled recovery fails an expired reservation without charging; a repeat is harmless and a new question can reserve the conversation. |
| `purgeRequiresAnExistingLifecycleTransaction` | 1 | The Spring proxy enforces mandatory transaction propagation for text purge. |
| `rollingBackArchiveAlsoRollsBackTextErasureAndCancellation` | 1 | Rolling back group archive also restores pending status and original text, proving lifecycle and purge are atomic. |
| `archiveAndUnarchiveKeepChargedMetadataWithoutRestoringText` | 1 | Archiving an approved answer erases text; unarchiving restores neither content nor spent quota. Retained history stays readable as metadata. |

Existing cases retain coverage for idempotency conflict, lifetime quota, late answers,
policy version checks, archive cancellation, execution selection, and concurrent
reservation/finalization.

## New frontend cases

### useAssignmentAssistant.test.tsx

These tests render the real hook with React Testing Library. API functions are mocked;
they do not claim browser-to-server integration coverage.

| Test | Executions | Coverage |
| --- | ---: | --- |
| `defers all requests until the assistant is enabled` | 1 | No availability/history requests occur until activation. |
| `orders history chronologically and deduplicates older pages` | 1 | Older pages prepend in chronological order without duplicate messages; pagination stops at the last page. |
| `omits editor code unless opted in and dispatches usage refresh after delivery` | 1 | Unshared code never enters the request; question is trimmed, delivered quota/history update, retry clears, and usage listeners are notified. |
| `includes explicitly shared code at the maximum size and execution opt-in` | 1 | Request includes 32,768-character code and execution context only after explicit choices. |
| `rejects invalid local input before sending` | 4 | Whitespace question, empty/whitespace code, and oversized code trigger no POST. |
| `prevents simultaneous submissions while preserving the pending question` | 1 | An unresolved POST blocks a second submission; sending/pending UI state clears after completion. |
| `retries an interrupted request with the identical id and payload` | 1 | Network recovery reuses the exact request, including shared code and client ID; no new UUID is created. |
| `shows safe uncharged failure messaging` | 4 | Policy change, cancellation, timeout, and output rejection display safe messages without raw details or an answer. |
| `polls pending work, refreshes its terminal result, and cleans up the timer` | 1 | A deterministic three-second timer fetches terminal status, reloads history, marks the answer for reveal, and stops after cleanup. |

## Execution

Run backend unit and integration suites using Java 21:

```bash
cd codehive-backend
./gradlew test
```

Focused run for every backend file added or extended here:

```bash
./gradlew test \
  --tests '*AiPolicyRulesTest' \
  --tests '*AssignmentAiPolicyServiceTest' \
  --tests '*AssistantServiceTest' \
  --tests '*AssistantGuardrailServiceTest' \
  --tests '*AssistantContextServiceTest' \
  --tests '*AssistantControllerIntegrationTest' \
  --tests '*AssistantTransactionServiceIntegrationTest'
```

Run frontend checks from `codehive-frontend`:

```bash
npm test
npm run typecheck
# Focused hook suite:
npm test -- app/features/student/hooks/useAssignmentAssistant.test.tsx
```

The normal backend suite uses the `test` profile and an in-memory H2 database, with
external model calls replaced by mocks/fakes. New unit tests do not load Spring.
Client-generated fixture IDs are fixed UUIDs; integration entity IDs are generated
by JPA. Hook polling uses fake timers, with no real sleep or Gemini request.

The existing `postgresAssistantTest` task also selects the two extended integration
classes. It requires an explicitly configured **disposable** PostgreSQL database
because it uses `create-drop`. PostgreSQL-specific tests and opt-in live Gemini
qualification are separate from the normal suite; this change does not claim that
H2 validates PostgreSQL locking/index semantics or that fake responses qualify model
safety. Existing transport, call-budget, fingerprint, telemetry, usage, rate-limit,
and provider-configuration suites remain part of regression coverage.

## Validation results

- Full backend suite: **533 passed**, zero failures or skips. This includes all **99**
  executions across the seven backend files added or extended here.
- Focused frontend hook suite: 15 passed.
- Full frontend suite: 58 passed across 9 files.
- Frontend typecheck: passed.
- PostgreSQL-specific and live Gemini suites: not run; require separate explicit setup.

Backend HTML results: `codehive-backend/build/reports/tests/test/index.html`.
Coverage report: `codehive-backend/build/reports/jacoco/test/html/index.html`.
