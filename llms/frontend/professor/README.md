# Teacher Frontend

## Routes

- `/teacher` — action dashboard with validation failures, grading queue, deadlines, and recent submissions.
- `/teacher/assignments` — paginated assignment management across active, archived, and deleted groups.
- `/teacher/create-assignment` — assignment form.
- `/teacher/assignments/:assignmentId/clone` — editable clone form.
- `/teacher/assignments/:assignmentId/edit` — metadata, schedule, and public-example update form.
- `/teacher/assignments/:assignmentId/revalidate` — explicit source, private-test, constraints, and execution-settings revision form.
- `/teacher/groups` — owned active and archived groups.
- `/teacher/groups/create` — group creation form.
- `/teacher/groups/:groupId` — roster, lifecycle, assignments, join code, and metrics.
- `/teacher/grades` — student work, submission evidence, execution reports, grade history, draft/returned grades, and feedback.
- `/teacher/analytics` — group overview, assignment details, and student metrics.
- `/teacher/notifications` — authenticated email notification preferences.

All routes use `ProtectedRoute` with `Role.TEACHER`.

## Application Shell

Teacher pages use `TeacherShell`, matching student workspace geometry: fixed `w-14` icon rail,
compact `h-12` breadcrumb header, one scrolling main region, and role-aware notification, theme,
profile, and logout controls. `DashboardLayout` temporarily adapts legacy teacher pages into this
shell while admin pages retain their existing layout. Shared teacher loading, empty, error, status,
confirmation, field, and panel patterns live in `components/TeacherUI.tsx`.

## Management Workflows

- Assignment list filters by group, lifecycle, validation status, and title. Deleted records can be
  restored; each assignment exposes preview, edit, revalidate, clone, grade, and management status.
- Management status combines latest validation failure, update history, and latest reevaluation batch.
- Grade review drawer exposes every attempt, retained source, execution evidence, and grade audit history.
- Teacher dashboard aggregates owned active groups, students, assignments, grading queue, validation
  problems, upcoming lifecycle dates, and recent submissions server-side.

## Clone Flow

1. Teacher opens Assignments and clicks Clone.
2. Frontend loads active, non-archived groups from `GET /api/groups`.
3. Frontend loads full source snapshot from `GET /api/assignments/{id}/clone-form`.
4. Group, metadata, limits, languages, examples, reference source, and all test inputs are editable.
5. Launch, due, and close date inputs always start empty; source scheduling is never inherited.
6. Submit sends complete JSON snapshot to `POST /api/assignments/{id}/clone`.
7. Backend creates clone with `PROCESSING` validation status and regenerates expected outputs.

Target must be another owned active, non-archived group. Source group remains visible but disabled
in the selector.

Date inputs use next available minute as minimum. Submit validation rejects past values and
invalid `launchDate <= dueDate <= closeDate` ordering. Backend repeats these checks as
authoritative protection for create, clone, and update requests.

## Assignment Publishing

The create-assignment form defaults to **Publish immediately**. It omits `launchDate`,
so students can access the assignment as soon as asynchronous test generation marks it
`READY`. Teachers can instead select **Schedule publish**, which requires a future
launch date and keeps the assignment hidden until then.

## Assignment Editing

`PATCH /api/assignments/{id}` always carries multipart `metadata`. Metadata, public examples,
and schedule changes apply immediately. Empty schedule fields preserve their current value;
the explicit clear controls send `clearLaunchDate`, `clearDueDate`, or `clearCloseDate`.

The standard edit page never includes a reference source or private test files, so an ordinary
metadata change cannot replace a test suite.

The **Update and validate** page loads active reference source and private test inputs into
editors. It always submits current source plus the complete current input suite with
`testSuiteUpdateMode: REPLACE_ALL`; this explicitly re-runs worker validation. Constraints, hints,
limits, comparator, and allowed languages are edited there so their new values apply with the
validated revision.

- Reference-only update: validates proposed source against active test suite.
- Test-suite update: regenerates expected outputs. The explicit validation page sends `REPLACE_ALL`
  from its complete editor state, preserving unchanged inputs and applying edits/removals
  intentionally.
- Any source/test revision remains `VALIDATING` until worker succeeds. Existing active revisions
  remain available if validation rejects update.

Client limits match creation flow: source 500 lines/256 KiB, each test input 1 MiB, selected
test inputs 5 MiB, and no more than 50 resulting tests. Public examples require input, output,
and explanation.

## API Module

`app/features/teacher/api/assignment.api.ts` owns teacher group, assignment list,
create, clone-form, and clone requests.

Other teacher API modules:

- `group.api.ts` — owned group CRUD/lifecycle, roster, removal, and join-code rotation.
- `student-work.api.ts` — student work, evidence review, grade history, grades, and feedback.
- `metrics.api.ts` — group/assignment/student performance aggregates.
- `dashboard.api.ts` — teacher action-center aggregate.
- `client.ts` — shared bearer-token and `SuccessResponse<T>` parsing.

Typed contracts live under `app/features/teacher/types/` and mirror backend DTOs/enums.
