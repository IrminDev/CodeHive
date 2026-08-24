# Backend Admin API

## Account lifecycle

- `ACTIVE`: `users.is_active=true` and `blocked=false`.
- `BLOCKED`: `users.is_active=true` and `blocked=true`. Authentication and password recovery are denied. Admin reads still include account.
- `DELETED`: `users.is_active=false`. Account is soft-deleted, identity values remain reserved, and application APIs/aggregates must not expose it. No restore endpoint exists.
- Blocking owner archives every active owned group. Unblocking never unarchives groups.
- Deleting owner archives and soft-deletes every active owned group.
- Blocking or deleting invalidates outstanding password-reset tokens and existing JWTs stop authenticating through account-state checks.

## User endpoints

Base path: `/api/admin/users`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Search/filter/sort visible users by role and lifecycle status |
| GET | `/{id}` | User details, resource counts, lifetime rate-limit total |
| PATCH | `/{id}` | Update profile; requires 10-500 character reason |
| PATCH | `/{id}/role` | Change role; returns HTTP 409 with relationship blockers |
| PATCH | `/{id}/status` | Block, unblock, or delete; requires reason |
| PATCH | `/{id}/scopes` | Grant/revoke scopes; requires reason |
| GET | `/{id}/groups` | Read-only owned/enrolled group metadata |
| GET | `/{id}/assignments` | Read-only authored/participated assignment metadata |
| GET | `/{id}/submissions` | Submission metadata; never source code |
| GET | `/{id}/executions` | Execution metadata; never reports or test artifacts |

Role changes never auto-transfer or delete relationships. Conflicting ownership, active enrollment, remaining admin scopes, or last-superadmin status produces explicit blockers. `MANAGE_GROUPS` remains reserved and cannot be granted; admin group access is read-only.

## Monitoring endpoints

- `GET /api/admin/statistics?from=&to=` requires `CHECK_ANALYTICS`. Default range is previous 30 days. Returns operational/moderation counts only, not academic scores.
- `GET /api/admin/rate-limit-incidents` requires `VIEW_USERS`. Supports user, policy, method, endpoint, and time filters.
- `GET /api/admin/audit-events` requires `VIEW_AUDIT_LOG`. Supports actor, target, action, outcome, and time filters.

Deleted identities are redacted in audit results. Rate-limit incident rows keep 180 days; `users.rate_limit_violation_count` and latest violation timestamp remain lifetime moderation signals.

## Rate limiting

- Every authenticated `/api/**` request uses per-user `global.authenticated` policy: 300 requests/minute.
- Public auth/recovery routes retain stricter IP-based policies. Forwarding headers are not trusted, preventing spoofed `X-Forwarded-For` bypass.
- Expensive endpoints have independent named buckets: login, signup, CSV signup, password recovery, group create/join/code rotation, assignment create/update/clone/artifact access, execution submit/report, metrics, teacher dashboard, WebSocket ticket, and admin monitoring.
- Local in-memory buckets are bounded at 100,000 and periodically evicted. This design is single-instance only.
- Authenticated rejections store user, named policy, HTTP method, route template, timestamp, and optional correlation ID. Raw IP is never persisted.
- HTTP 429 includes `Retry-After`, `X-RateLimit-Limit`, and `X-RateLimit-Policy` headers.

## CSV progress WebSocket

1. Authenticated client requests `POST /api/auth/websocket-ticket`.
2. Client connects to `/ws/csv-progress?ticket=...` within 60 seconds.
3. Handshake consumes ticket once and binds session to user ID.
4. Client sends CSV task ID. Handler starts task only when task owner matches bound user.

Tickets and pending task ownership are process-local. CSV task IDs alone no longer authorize progress access.
