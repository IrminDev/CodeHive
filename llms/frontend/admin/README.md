# Frontend Admin Workspace

## Shell and routes

All admin pages use `app/features/admin/components/AdminShell.tsx`, matching the compact authenticated shell in `DESIGN.md` and teacher pages. Sidebar items are permission-aware and ordered Overview, Users, Incidents, Audit.

Routes:

- `/admin` — overview; statistics load only with `CHECK_ANALYTICS`.
- `/admin/users` — list with `VIEW_USERS`, or registration action center with `CREATE_USERS`/`CREATE_ADMINS`.
- `/admin/users/:userId` — user detail and read-only associated resources; requires `VIEW_USERS`.
- `/admin/create-user` — requires `CREATE_USERS` or `CREATE_ADMINS`; role choices match held scope.
- `/admin/csv-upload` — requires `CREATE_USERS`.
- `/admin/incidents` — requires `VIEW_USERS`.
- `/admin/audit` — requires `VIEW_AUDIT_LOG`.

`SUPER_ADMIN` is treated as every effective scope in `AuthProvider`, `ProtectedRoute`, admin navigation, and mutation helpers, matching backend authorities.

## Data and operations

`app/features/admin/api/admin.api.ts` contains typed methods for every `/api/admin/**` contract plus WebSocket ticket issuance. `AdminApiError` preserves backend blocker arrays and rate-limit response headers.

User list state is URL-backed: search, role, active/blocked status, sort, direction, page, and size. Deleted users are not offered because backend intentionally hides soft-deleted identities.

User detail provides:

- Resource counts and lifetime rate-limit totals.
- Lazy tabs for group, assignment, submission, and execution metadata.
- Owned/enrolled and authored/participated relationship switches.
- Focused profile, role, scope, block, unblock, and delete dialogs.
- Mandatory 10–500 character audit reasons.
- Typed email/enrollment confirmation for deletion.
- Explicit warnings/acknowledgements for enrollment cancellation and terminal group deletion.
- Typed email/enrollment confirmation before revoking `CREATE_GROUP` from student with owned groups.
- Teacher `CREATE_GROUP` is mandatory; admins cannot receive it.

Group resources remain read-only. `MANAGE_GROUPS` is never delegable. Source code, execution reports, expected output, and private tests are never requested from admin pages.

## Lifecycle UX

- Blocking warns that active owned groups are archived.
- Unblocking warns that groups remain archived.
- Deleting warns that the account and active owned groups are soft-deleted and cannot be restored.
- Successful deletion returns to visible user list.
- Student-to-nonstudent changes cancel active enrollments; rejoin is never automatic.
- Promotion to admin and student scope revocation terminally soft-delete owned groups while preserving admin read-only history and deletion reason.

## Monitoring

Overview uses Recharts for role, assignment validation, and execution-verdict distributions. Metric cards and textual chart values remain accessible without color. Date ranges support 7/30/90-day presets and custom inclusive-through dates serialized to backend's exclusive `to` instant.

Incident and audit filters are URL-backed. Audit rows preserve backend redaction for deleted users and never link null identities. HTTP 429 errors show retry and policy metadata when returned.

## CSV progress security

CSV flow uploads file, requests `POST /api/auth/websocket-ticket`, connects to `/ws/csv-progress?ticket=...`, then sends task ID. Sockets close on completion, error, replacement, or unmount. Ticket expiry, malformed messages, and premature closes surface explicit errors.

## Verification

- `npm test`
- `npm run typecheck`
- `npm run build`

Vitest uses jsdom and React Testing Library. Current focused tests cover admin API envelope/errors and permission rules.
