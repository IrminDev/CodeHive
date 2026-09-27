# AI assistant contract (stages 0–2)

Status: domain/API contract frozen for staged implementation. Stage 8 student UI now consumes availability, message, and history endpoints behind `ASSISTANT_ENABLED=false`; stage 9 live-provider qualification remains pending. See [implementation plan](AI_EDUCATIONAL_ASSISTANT_IMPLEMENTATION_PLAN.md).

## Policy

Every assignment has an independent, versioned AI policy. Existing/missing policy means disabled, maximum `0`, `CONCEPTUAL_ONLY`. Enabled maximum must be `1..10`; disabled maximum must be `0`. Lifetime charged count never resets when policy changes. Levels, from least to most permissive:

| Value | Allowed response |
|---|---|
| `CONCEPTUAL_ONLY` | Concepts and terminology; no assignment-specific steps, pseudocode, or code |
| `EXPLANATIONS_AND_GUIDING` | Explanations and guiding hints; no pseudocode or code |
| `EXPLANATIONS_GUIDING_AND_SNIPPETS` | Above plus short assignment-specific snippets/pseudocode; never complete solutions |

`PUT /api/assignments/{id}/ai-policy` is owner-only, immediate, and independent of staged worker validation. Request: `{"aiAssistanceEnabled":true,"maxAiRequests":3,"aiAssistanceLevel":"EXPLANATIONS_AND_GUIDING"}`. Response uses standard `SuccessResponse` with same three values plus `aiPolicyVersion`. Disabling requires maximum `0`. Create/clone metadata accepts same fields and defaults to disabled/0/conceptual when absent.

## Interaction lifecycle

Exactly one conversation per student and assignment. Each interaction has stable ID/sequence and one `clientRequestId` within that conversation. `PENDING` reserves a slot but does not charge it. Validated, delivered `COMPLETED` and educational `REDIRECTED` responses each charge one. `BLOCKED`, `FAILED`, and `CANCELLED` charge zero. One output regeneration is allowed; no response text is shown until all output checks and final policy checks finish. At most one pending interaction per conversation.

Student request shape planned for stage 6: `{"clientRequestId":"00000000-0000-0000-0000-000000000001","message":"Why does my loop miss the last item?","language":"JAVA","includeEditorCode":false,"includeExecutionContext":false}`. Editor and execution opt-ins are independent and default off. `editorCode` is accepted only with editor opt-in. Execution selection stays server-side: latest non-pending, student-initiated execution for that assignment. Public assignment data is included; reference solution, private tests, hidden inputs/outputs, raw definitive diagnostics, and unselected code/execution context are excluded. Only original student prompt and validated visible response are stored as text, never assembled prompt or opted-in attachments. Input-blocked prompts retain original student message for traceability until group archive/deletion.

New assistance requires student role, active enrollment, open/ready assignment, active non-archived group, enabled policy, quota, and global switch. Only the student can read own history, even after enrollment or assignment eligibility ends. Professor/admin ownership never grants conversation access. Policy/lifecycle changes that make a pending answer ineligible cancel it before release.

## Read and erasure API

- `GET /api/assignments/{id}/assistant/interactions?page=0&size=20`: own history, newest first; page `>=0`, size `1..50`.
- `GET /api/assignments/{id}/assistant/interactions/{interactionId}`: own single interaction.
- No conversation yet: `404` in stages 0–2; stage 6 availability endpoint will expose empty state separately.
- Response entries contain ID, sequence, status, student message, assistant response, `contentErased`, `quotaCharged`, safe failure code, created/completed timestamps. No context payload or model output rejected by guardrails is exposed.

Archiving or logically deleting group cancels pending interactions and clears both text fields transactionally. Interaction IDs, statuses, timestamps, charge facts, and count remain. Unarchive/restore never restores text or resets quota. Deleting records solely because text expired is prohibited; charged ledger must outlive content. History remains readable as content-free metadata.

## Error contract for stage 6

Use existing `ErrorResponse` envelope with stable machine-readable code to distinguish: `400` malformed/invalid input; `403` ineligible new request; `404` inaccessible assignment/history; `409` idempotency conflict, pending conflict, or policy/lifecycle cancellation; `429` quota/rate limit; `502` rejected output after regeneration; `503` provider unavailable/global switch off; `504` provider timeout. A matching idempotent retry returns committed interaction or pending state, never charges twice. No raw prompt/context/provider exception in errors or logs.

Representative outcomes: successful answer → `COMPLETED`, charged; educational redirection → `REDIRECTED`, charged; blocked prompt → `BLOCKED`, original student text only, uncharged; provider failure → `FAILED`, uncharged; policy change or archive before release → `CANCELLED`, uncharged, no answer; retry → same interaction. Archive additionally erases all conversation text permanently.

## Configuration and release gate

Planned backend keys: `assistant.enabled` (default false), `assistant.max-message-chars`, `assistant.max-editor-code-chars`, `assistant.max-context-chars`, `assistant.max-output-chars`, `assistant.model-timeout-seconds` (stage-5 adapter default `20`, valid `1..120`), `assistant.lease-recovery-ms` (stage-3 scheduler default `60000`), and `assistant.rate-limit-per-minute`. Choose/validate remaining safe numeric defaults when stage 6 wiring lands. Gemini provider is selected; `ASSISTANT_MODEL_PROVIDER=google-genai` activates it, `GEMINI_API_KEY` supplies credentials, and `GEMINI_MODEL` selects the model. Default provider is `none`, so backend starts without credentials. Global assistant switch stays off through stages 1–8. External-provider student-data disclosure/consent is unresolved; resolve before live-model traffic.
