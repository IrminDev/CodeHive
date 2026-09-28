# AI assistant rollout and rollback (development)

Status: **enabled for local development only**, by explicit project-owner direction on 2026-09-27. No real users or production data are in scope. The checked-in default remains `ASSISTANT_ENABLED=false`; local `codehive-backend/.env` sets it to `true`. No existing database was erased.

## Production / real-user release gates

1. Decide whether formal student consent is required for Google Gemini. The student composer now discloses what is sent before submission. Development rollout proceeds without a recorded or server-enforced consent gate. If one is required for real student traffic, implement and test it; the UI notice alone does not enforce consent.
2. Agree live-model acceptance threshold; run representative and adversarial assignment set against intended deployment model. Three-case smoke passed; expanded ten-case run passed nine, with one safe provider `429` failure. This is not yet a quality qualification.
3. Re-run PostgreSQL, backend, frontend, and policy/archive checks with final code/config. Verify no prompt, editor code, execution context, or provider response body appears in logs.
4. Check chosen model and API key in target environment. `GEMINI_MODEL` may override default. Local `gemini-3.8-flash` was intermittent at 20–30-second per-call deadlines; three synthetic cases passed with `gemini-3.5-flash-lite` at 30 seconds. Do not infer production reliability from this small sample.
5. Enable only on development/canary deployment first; observe safe failure-code counts, latency, charged-versus-failed counts, provider costs, and quotas before broader rollout.

## Configuration

- `ASSISTANT_ENABLED=false` is rollback switch and checked-in default. Local development `.env` sets `true`; do not copy that setting into a real-user environment until gates above pass.
- `ASSISTANT_MODEL_PROVIDER=google-genai`, `GEMINI_API_KEY`, and optional `GEMINI_MODEL` select provider. Without explicit provider selection, no model is created.
- `ASSISTANT_MODEL_TIMEOUT_SECONDS` defaults to `20` per model call, valid `1..120`. Current reservation lease is three minutes; do not raise per-call deadline without checking worst-case review/generation/revalidation duration against lease.
- `ASSISTANT_MODEL_MAX_OUTPUT_TOKENS` defaults to `4096`; `ASSISTANT_MODEL_TEMPERATURE` defaults to `0.2`; Gemini thinking is `LOW`, search/tool execution disabled. Bounded gateway allows four concurrent calls plus eight queued calls. `ASSISTANT_PROVIDER_CALLS_PER_MINUTE` defaults to ten **per backend process**; choose value below project/model limits shown in AI Studio, accounting for up to five model calls per student request. Multiple backend replicas need a shared provider budget before broad rollout. Student endpoint limits ten requests per minute; assignment quota never exceeds ten lifetime delivered answers/redirections.
- Existing assignments remain disabled with quota zero; teacher must opt each assignment in separately.

## Local development rollout result (2026-09-27)

- Local `.env` selects `google-genai`, `gemini-3.5-flash-lite`, `ASSISTANT_ENABLED=true`, and a 30-second per-model-call deadline. Gemini key remains in ignored local configuration.
- Existing named Postgres/MinIO volumes were preserved. Backend started on port 8080 with local Postgres, RabbitMQ, and MinIO. Development schema SQL applied successfully: three assistant indexes and three constraints verified. One existing assignment has assistant enabled; others require teacher opt-in.
- Prior verification: disposable PostgreSQL 16/16, backend 416/416, frontend 24/24 plus typecheck/build. Expanded synthetic live-model run passed 9/10; remaining case ended safely on provider `429`. This is acceptable for this development-only rollout by owner direction, not a production quality qualification.
- Prompts and separately opted-in editor code/execution context can now be sent to Google Gemini when an eligible student uses that enabled assignment. Use synthetic accounts/content only until real-user disclosure and consent are settled.

## Verification commands

From `codehive-backend`, run `./gradlew test --offline`. Live Gemini calls are excluded. For synthetic live smoke, explicitly run `./gradlew liveAssistantTest --offline` with configured development key and model; no student content appears in fixtures.

For PostgreSQL proof, create a **disposable** PostgreSQL database named with `assistant_test`, then set `CODEHIVE_ASSISTANT_TEST_DATABASE_URL` and `CODEHIVE_ASSISTANT_TEST_DATABASE_PASSWORD` (optional username defaults to `postgres`). Run `./gradlew postgresAssistantTest --offline`. This task uses Hibernate `create-drop` and directly applies `docs/AI_ASSISTANT_DEV_SCHEMA.sql`; **never point it at a database containing data you need**. It checks partial indexes, constraints, concurrent first requests/finalization, quota, archive erasure, and controller policy behavior.

From `codehive-frontend`, run `npm test`, `npm run typecheck`, and `npm run build`.

## Rollback

Set `ASSISTANT_ENABLED=false` and restart backend. New requests stop; existing student history remains readable. Do not delete conversation/interaction rows to roll back: they carry lifetime charge ledger. Provider selection can be set to `none` after switch is off. Group archive/deletion still erases retained text; unarchive cannot restore it.
