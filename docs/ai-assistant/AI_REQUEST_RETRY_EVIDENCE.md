# Evidence guide: retrying an interrupted AI assistant request

Revision: 25 October 2026.

**Execution status: not executed by this document.** Complete the evidence record
and attach actual screenshots before reporting a pass.

For attachable code-based proof without reproducing a browser failure, see
[executed automated retry/quota evidence](AI_REQUEST_RETRY_AUTOMATED_EVIDENCE.md).

## What this demonstration proves

A student can retry an AI assistant HTTP request after a connection failure. The
frontend resends the same `clientRequestId` and payload, instead of silently creating
a different question. Once a response is approved, the conversation displays it.

This is different from restarting an interaction already persisted as `FAILED`.
Replaying that ID returns its saved failure; it does not start new Gemini work.
A new attempt after a terminal failure needs a new question submission/new ID.

## Prerequisites

- Use a test student enrolled in an active, eligible assignment.
- Global AI assistance and assignment policy are enabled, with at least one answer remaining.
- Keep the same assignment page open throughout the test: the retry payload lives in memory.
- Open the AI panel while online and wait for availability/history to finish loading.
- Accept the AI sharing notice if required. Leave both code/execution sharing choices off.
- Use a harmless in-scope question, such as `What is an off-by-one error?`.
- Record the assistance level and initial used/remaining answer counts.

## Procedure: deterministic connection failure

1. Open Chrome DevTools → **Network**. Enable **Preserve log** and keep recording enabled.
2. In the network throttling dropdown, select **Offline**. Do this only after the
   assignment and AI panel have loaded. Chrome documents this simulation in its
   [Network reference](https://developer.chrome.com/docs/devtools/network/reference).
3. Send the question using **Ask assistant**. Wait for the connection error and
   **Retry same request** button. Network may also show failed history/availability
   GETs from recovery; the relevant failed request is the **POST** to:

   ```text
   /api/assignments/<assignment-id>/assistant/interactions
   ```

4. Capture screenshot **E1** showing the connection error, retry button, and failed
   POST. Record its request payload, especially `clientRequestId`, message, language,
   and sharing flags. If DevTools does not retain its payload, mark identity evidence
   incomplete rather than claiming a match.
5. Restore **No throttling** (online). Do not reload the page, retype the question,
   click Ask assistant again, or use DevTools Replay XHR.
6. Click the application's **Retry same request** button once.
7. Capture screenshot **E2** of the retry POST payload. Compare all payload fields
   with the failed POST. The `clientRequestId` and content must match exactly.
8. Wait for the result. A successful terminal response is normally HTTP 200, with
   interaction status `COMPLETED` or `REDIRECTED`. HTTP 202/PENDING is intermediate:
   wait for polling to recover the final interaction before declaring a pass.
9. Capture screenshot **E3** showing the delivered answer and final quota. Keep the
   question/answer occurrence count in view or record it from history. Expected:
   one persisted interaction for this request ID, and one charged answer.
10. Restore normal network settings when finished.

The initial offline POST never reaches the backend, so it should not appear in
backend access logs. Server logs can corroborate the retry's HTTP result but cannot
by themselves prove that the browser reused the same payload. This scenario proves
retry after failed transmission; it does not prove recovery after a server accepted
a request but its response was lost, or after a terminal provider failure.

## Evidence to attach

| Evidence | Required content | File |
| --- | --- | --- |
| E1 | Failed POST, connection error, application's Retry same request button | `<screenshot>` |
| E2 | Failed and retry payloads with identical clientRequestId and content; retry HTTP result | `<screenshots or sanitized payload comparison>` |
| E3 | Delivered answer, one interaction, final quota compared with baseline | `<screenshot/history evidence>` |

Use a short screen recording if a single screenshot cannot show the sequence clearly.
Do not attach Authorization headers, cookies, session tokens, or unsanitized HAR files.
Use synthetic question text and remove unrelated personal data from screenshots.

## Technical-document evidence record

```markdown
### RETRY-01 — Recovery after interrupted AI request

- Execution date/time and timezone:
- Tester:
- Application revision/build:
- Environment and browser version:
- Assignment/test student identifiers:
- Assistance level:
- Failure injected: browser offline before POST transmission.
- Question:
- Initial answers used/remaining:
- First POST result:
- First clientRequestId:
- Retry clientRequestId:
- Payload equality: <verified / different / not observable>.
- Retry HTTP result:
- Final interaction ID/status:
- Persisted interactions for this request ID:
- Final answers used/remaining:
- Evidence: E1 <file>; E2 <file>; E3 <file>.
- Actual observations:
- Verdict: <PASS / FAIL / INCONCLUSIVE / NOT RUN>.
- Limitations or deviations:

Conclusion, only after verifying evidence:
<The first HTTP transmission failed under simulated offline conditions. After
connectivity was restored, the student used Retry same request. Both POSTs carried
the same clientRequestId and payload. The retry completed successfully and produced
one persisted interaction with one charged answer.>
```

A pass requires actual evidence for recovery, matching identity/payload, and final
interaction/quota state. Unavailable provider, exhausted quota, expired login, or
missing identity evidence makes the run inconclusive for this specific claim.

## Implementation references

- [Request retained in memory and resent by retry](../../codehive-frontend/app/features/student/hooks/useAssignmentAssistant.ts).
- [Application retry button](../../codehive-frontend/app/features/student/components/AssistantPanel.tsx).
- [Assistant POST endpoint client](../../codehive-frontend/app/features/student/api/assistant.api.ts).
- [Backend existing-ID lookup and fingerprint check](../../codehive-backend/src/main/java/com/github/codehive/service/assistant/AssistantTransactionService.java).
