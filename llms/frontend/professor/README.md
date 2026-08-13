# Teacher Frontend

## Routes

- `/teacher` — dashboard.
- `/teacher/assignments` — real assignment list filtered by active owned group.
- `/teacher/create-assignment` — assignment form.
- `/teacher/assignments/:assignmentId/clone` — editable clone form.
- `/teacher/assignments/:assignmentId/edit` — metadata and schedule update form.
- `/teacher/groups` — owned active, archived, and deleted groups.
- `/teacher/groups/create` — group creation form.
- `/teacher/groups/:groupId` — roster, lifecycle, assignments, join code, and metrics.
- `/teacher/grades` — student work, draft/returned grades, and feedback.
- `/teacher/analytics` — group overview, assignment details, and student metrics.

All routes use `ProtectedRoute` with `Role.TEACHER`.

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

## API Module

`app/features/teacher/api/assignment.api.ts` owns teacher group, assignment list,
create, clone-form, and clone requests.

Other teacher API modules:

- `group.api.ts` — owned group CRUD/lifecycle, roster, removal, and join-code rotation.
- `student-work.api.ts` — student work, grades, and feedback.
- `metrics.api.ts` — group/assignment/student performance aggregates.
- `client.ts` — shared bearer-token and `SuccessResponse<T>` parsing.

Typed contracts live under `app/features/teacher/types/` and mirror backend DTOs/enums.
