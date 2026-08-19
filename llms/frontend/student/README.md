# Student Frontend

## Routes

- `/dashboard` — student dashboard.
- `/groups` — all accessible student groups.
- `/groups/join` — join a group with an eight-character code.
- `/groups/:groupId` — authorized group detail with assignments and student delivery status.
- `/assignment/:id` — assignment workspace.
- `/assignment/:id/submissions` — student submission history.
- `/assignment/:id/report/:executionId` — execution report.

## Group Detail

`StudentGroupDetailPage` loads the accessible group, its assignments, and the
student's current definitive submissions in parallel. Assignment status is calculated
client-side from submission state and assignment dates:

- Delivered or delivered late when a current submission exists.
- Not delivered before its due date.
- Late and not delivered after its due date but before close.
- Closed with no submission at or after close.

The backend returns only current `SUBMITTED` work for the authenticated student;
withdrawn submission history is not treated as a delivery.

## Shared Student Navigation

`StudentHeader` and `StudentSidebar` keep dashboard and group pages visually and
functionally aligned. Group navigation points to `/groups`; `/groups/join` is used
only for explicit join actions.

## Assignment Workspace

`GET /api/assignments/{id}` returns public examples and sample test inputs. The Problem tab
shows every available example with input, output, and explanation. The practice test editor
starts with sample inputs ordered by their test-case order; when no samples exist, it starts
with one blank editable case.
