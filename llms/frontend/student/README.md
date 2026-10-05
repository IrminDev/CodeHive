# Student Frontend

## Routes

- `/dashboard` — student dashboard.
- `/assignments` — full student assignment list with class, current verdict, deadlines, limits, and filters.
- `/grades` — all accessible assignments with returned grades, awaiting/not-submitted states, points, and published feedback.
- `/groups` — all accessible student groups.
- `/groups/join` — join a group with an eight-character code.
- `/groups/:groupId` — authorized group detail with assignments and student delivery status.
- `/groups/:groupId/metrics` — personal delivery, grading, and execution metrics for an active group enrollment.
- `/assignment/:id` — assignment workspace.
- `/assignment/:id/submissions` — student submission history.
- `/assignment/:id/report/:executionId` — execution report.

## Group Detail

`StudentGroupDetailPage` loads the accessible group, its assignments, and the
student's current definitive submissions in parallel. Assignment status is calculated
client-side from submission state and assignment dates:

- Delivered and accepted only when a current submission's latest execution verdict is `AC`.
- Delivered but checking, or delivered with its non-accepted verdict, when evaluation is
  pending or fails. This never misrepresents delivery as an accepted solution.
- Not delivered before its due date.
- Late and not delivered after its due date but before close.
- Closed with no submission at or after close.

The backend returns only current `SUBMITTED` work for the authenticated student;
withdrawn submission history is not treated as a delivery.

## Shared Student Navigation

`StudentHeader` and `StudentSidebar` keep dashboard and group pages visually and
functionally aligned. Group navigation points to `/groups`; `/groups/join` is used
only for explicit join actions.

Students can leave a group from its detail page after confirmation. The page posts to
`POST /api/groups/{id}/leave`, returns to My groups on success, and explains that a
future join with the code restores historical enrollment.

## Group Metrics

`/groups/:groupId/metrics` loads the group plus the student's own summary and per-assignment
metrics in parallel. It is available only to active student enrollments. It visualizes completion,
returned-grade average, on-time delivery, attempts, latest verdict, runtime/memory, and returned
grades. Draft grades remain hidden; unavailable aggregate values render as an em dash, not zero.

## Notification Settings

`/notifications` is a student-only page for email notification preferences. It uses
`GET` and `PUT /api/notification-preferences`, supports reset and test-email actions,
and exposes the backend-provided role-specific notification catalog, reminder timing,
timezone, and master email switch. Student header notification controls link here.

## Assignment Workspace

`GET /api/assignments/{id}` returns public examples and sample test inputs. The Problem tab
shows every available example with input, output, and explanation. The practice test editor
starts with sample inputs ordered by their test-case order; when no samples exist, it starts
with one blank editable case.

The workspace exposes expected output and captured student stdout for every practice test case
whose reference execution succeeds, including non-AC verdicts. Definitive submissions retain
aggregate verdicts and per-case statuses without mapping private tests onto visible inputs or
exposing their expected output or stdout.

The workspace header links to `/assignment/{id}/submissions` for complete definitive submission
history; this avoids a duplicate partial history panel beside problem content.

The workspace also links to the assignment's row in `/grades`, shows returned points when present,
and uses functional Problem/Editor/Tests panes below `lg`. AI help opens a responsive assistant
panel. It loads quota/availability and paginated own history, including content-erased metadata
after group archive. New questions use separate, initially-off editor-code and latest-finished-
execution opt-ins; editor text is sent only when explicitly selected. Answers appear only after
the backend commits validated output. Pending work is polled; interrupted requests refresh history
and can retry with the same in-memory idempotency key. No generated code enters the editor.
The composer discloses before submission that Gemini receives the question, public assignment
details, and relevant earlier assistant messages. It also explains that editor code and the latest
finished execution result are shared only when their separate checkboxes are selected.
Students must open and accept the compact disclosure before asking. Acceptance is stored in
browser storage per user and disclosure version; accepted users no longer see the disclosure
button in that browser. Structured answers render explanation, syntax-highlighted code
snippets, and follow-up question separately; fenced code in legacy answers is also
highlighted when its language is supported. Code remains inert text.
Panel and full history render right-aligned student bubbles and left-aligned assistant bubbles,
without internal result labels or failure codes. New questions appear immediately with an animated
thinking indicator. Only backend-approved replies receive a local progressive reveal; existing
history appears immediately. Students can skip the reveal, and reduced-motion preferences disable
it. Follow-up questions use violet text with separate light/dark colors. The panel follows new
content while at the bottom, preserves position when loading older questions, and lets students
scroll back while an answer appears.
The panel blocks new questions when policy, quota, assignment lifecycle, or enrollment disallows
them, while retained history remains readable.
`/assignment/:id/assistant-history` loads directly by conversation ownership, without the normal
assignment workspace endpoint. It preserves history access after enrollment/assignment eligibility
ends and renders metadata-only entries after archive/deletion.

When a current definitive submission exists, the workspace disables a new submit and shows a
confirmed **Withdraw to update** action. Withdrawal retains history and results, then enables the
student to submit editor code as the next version before the assignment closes.

Submission history uses persisted backend summaries and never substitutes development mocks.
Execution-report pages poll pending work, render OLE and other verdicts, and explain the 90-day
artifact-expiration state without losing the historical verdict.

Compiler errors use a dedicated error panel. RTE, MLE, and per-test CE results expose
bounded worker diagnostics and exit codes in expandable panels, while definitive runs
still hide private inputs and expected outputs. Memory displays use MiB and render an
unavailable marker when telemetry is null or legacy data contains zero; UI never claims
that a real execution consumed `0 MB`.

## AI usage statistics

Shared module: `app/features/assistant-usage`. Personal route `/ai-usage` reads own historical
usage independently of academic active-enrollment metrics. Teacher route
`/teacher/analytics?section=ai` uses owned historical group selector and assignment/student tables.
Admin route `/admin/ai-usage` requires CHECK_ANALYTICS; user rows/details require VIEW_USERS too.
Admin user detail includes an AI usage tab. Role clients reuse existing authenticated helpers.
Filters, search, sort and pagination stay in URL; requests abort/ignore stale results on scope
changes and session identity remounts state. No statistics polling. Technical coverage remains
explicit; nullable tokens are not zero. Lifetime quota is per assignment and independent of dates.
Recharts has a UTC daily table alternative. See
[implementation contract](../../../docs/ai-assistant/AI_USAGE_IMPLEMENTATION.md).
