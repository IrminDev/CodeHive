# Student Frontend

## Routes

- `/dashboard` — student dashboard.
- `/assignments` — full student assignment list with class, current verdict, deadlines, limits, and filters.
- `/grades` — all accessible assignments with returned grades, awaiting/not-submitted states, points, and published feedback.
- `/groups` — active joined groups (`relationship=ENROLLED`).
- `/groups/join` — join a group with an eight-character code.
- `/groups/:groupId` — authorized group detail with assignments and student delivery status.
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

## Notification Settings

`/notifications` is canonical student/teacher page for email notification preferences. It uses
`GET` and `PUT /api/notification-preferences`, supports reset and test-email actions,
and exposes backend-provided audience catalog, reminder timing, timezone, and master switch. Scoped students receive student plus owner preferences. Student header exposes Manage groups when `CREATE_GROUP` exists.

## Assignment Workspace

`GET /api/assignments/{id}` returns public examples and sample test inputs. The Problem tab
shows every available example with input, output, and explanation. The practice test editor
starts with sample inputs ordered by their test-case order; when no samples exist, it starts
with one blank editable case.

The workspace exposes expected and actual output only for a practice run that fails. Definitive
submissions retain aggregate verdicts and per-case statuses without mapping private tests onto
visible inputs or exposing their expected output.

The workspace header links to `/assignment/{id}/submissions` for complete definitive submission
history; this avoids a duplicate partial history panel beside problem content.

The workspace also links to the assignment's row in `/grades`, shows returned points when present,
and uses functional Problem/Editor/Tests panes below `lg`. AI help remains visibly disabled as
**Coming soon** until a real backend contract exists.

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
