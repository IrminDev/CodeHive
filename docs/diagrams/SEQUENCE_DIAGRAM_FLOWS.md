# Sequence Diagram Specifications: Groups, Assignments, Submissions, Grades, and Feedback

## Purpose

This document describes six CodeHive sequence diagrams and gives each message's source,
destination, method, parameters, result, and synchronization type. It reflects current
backend and worker behavior.

## Shared notation

| Notation | Meaning |
|---|---|
| `->` | Synchronous call; caller waits for a result. |
| `-->` | Return message. |
| `->>` | Asynchronous event or RabbitMQ message. |
| `alt` | Mutually exclusive success/error paths. |
| `opt` | Optional interaction. |
| `loop` | Repeated interaction, normally once per test case. |

Common rules:

- Every HTTP call carries `Authorization: Bearer <JWT>`. Spring Security builds
  `Authentication`; controllers pass `authentication.getName()` as `email`.
- HTTP success bodies use `SuccessResponse<T>`: `success`, `message`, and `data`.
- Entity IDs are UUID values. Date fields are UTC `Instant` values.
- Controller-to-service calls are synchronous. RabbitMQ calls and domain-event
  notification delivery are asynchronous.
- Repository lifelines represent PostgreSQL access through Spring Data JPA.
- Service methods marked `@Transactional` commit after successful return. Notification
  routing and submission job dispatch happen after transaction commit.
- Error fragments should end with the matching HTTP response (`400`, `403`, `404`,
  `429`, or `500`) and must not continue into later success messages.

Recommended participants, left to right:

`Actor` | `Frontend/API client` | `Spring Security` | `Controller` | `Domain service` |
`Repository/PostgreSQL` | `Notification router` | `RabbitMQ` | `Worker` | `MinIO` |
`Docker sandbox`

---

## 1. Group creation

### Goal and preconditions

Teacher creates an owned group and receives its generated join code. Caller must have
`CREATE_GROUP` authority. `name` must be nonblank and no longer than 120 characters.

### Participants

`Teacher`, `Frontend`, `GroupController`, `GroupService`, `UserRepository`,
`ClassGroupRepository`.

### Main sequence

| # | Type | Source | Destination | Method/message | Parameters | Result or state change |
|---:|:---:|---|---|---|---|---|
| 1 | `->` | Teacher | Frontend | Submit group form | `name`, `description` | Frontend validates required fields. |
| 2 | `->` | Frontend | GroupController | `POST /api/groups` / `create(request, authentication)` | Body: `CreateGroupRequest { name, description }`; JWT | `@PreAuthorize("hasAuthority('CREATE_GROUP')")` authorizes caller. |
| 3 | `->` | GroupController | GroupService | `create(request, email)` | `CreateGroupRequest`, authenticated email | Transaction starts. |
| 4 | `->` | GroupService | UserRepository | `findByEmail(email)` | Authenticated email | Returns owner `User`; otherwise `404`. |
| 5 | `loop` | GroupService | ClassGroupRepository | `existsByJoinCodeIgnoreCase(code)` | Random 8-character code | Repeats until code is unique. |
| 6 | `->` | GroupService | ClassGroupRepository | `save(group)` | `ClassGroup(name.trim(), description, owner, joinCode)` | Persists active, unarchived group. |
| 7 | `-->` | GroupService | GroupController | `GroupDTO` | `includeJoinCode = true` | Owner-visible DTO contains join code. |
| 8 | `-->` | GroupController | Frontend | `201 Created` | `SuccessResponse<GroupDTO>` | Frontend stores/displays `data.id` and `data.joinCode`. |

### Required fragments

- `alt invalid request`: bean validation fails -> `400 Bad Request`.
- `alt missing authority`: security rejects request -> `403 Forbidden`.
- `alt authenticated user missing`: `findByEmail` fails -> `404 Not Found`.

---

## 2. Join group

### Goal and preconditions

Student joins active, unarchived group using join code. Caller must have `STUDENT`
authority. Endpoint is rate-limited to 10 attempts per 60 seconds.

### Participants

`Student`, `Frontend`, `GroupController`, `GroupService`, `UserRepository`,
`ClassGroupRepository`, `GroupEnrollmentRepository`, `NotificationDomainEventPublisher`,
`NotificationDomainEventRouter`, `RabbitMQ`.

### Main sequence

| # | Type | Source | Destination | Method/message | Parameters | Result or state change |
|---:|:---:|---|---|---|---|---|
| 1 | `->` | Student | Frontend | Submit join form | `joinCode` | Frontend sends nonblank code. |
| 2 | `->` | Frontend | GroupController | `POST /api/groups/join` / `join(request, authentication)` | Body: `JoinGroupRequest { joinCode }`; JWT | Role and rate limit checked. |
| 3 | `->` | GroupController | GroupService | `join(joinCode, email)` | Trimmed join code, authenticated email | Transaction starts. |
| 4 | `->` | GroupService | UserRepository | `findByEmail(email)` | Authenticated email | Returns student `User`. |
| 5 | `->` | GroupService | ClassGroupRepository | `findByJoinCodeIgnoreCase(joinCode.trim())` | Join code | Returns matching group. |
| 6 | `->` | GroupService | GroupEnrollmentRepository | `findByGroupIdAndStudentId(groupId, studentId)` | Group UUID, student UUID | Returns old enrollment or empty. |
| 7 | `->` | GroupService | GroupEnrollmentRepository | `save(enrollment)` | Status `ACTIVE`, `joinedAt = now`, `endedAt = null` | Creates enrollment or reactivates prior `LEFT`/`REMOVED` enrollment. |
| 8 | `->>` | GroupService | NotificationDomainEventPublisher | `publish(event)` | `STUDENT_ENROLLED`, actor/subject student ID, group ID | Domain event queued for after-commit routing. |
| 9 | `-->` | GroupService | GroupController | `GroupDTO` | `includeJoinCode = false` | Student never receives join code in DTO. |
| 10 | `-->` | GroupController | Frontend | `200 OK` | `SuccessResponse<GroupDTO>` | Joined group becomes available to student. |
| 11 | `->>` | NotificationDomainEventRouter | RabbitMQ | Route notification after commit | Recipient: group owner; event: `STUDENT_ENROLLED` | Teacher notification dispatched if preference enabled. |

### Required fragments

- `alt invalid/unknown code`: missing code -> `400`; no group for code -> `404`.
- `alt invalid caller`: nonstudent or group owner tries joining -> `403`/`400`.
- `alt group not writable`: deleted or archived group -> `400`.
- `alt already active`: active enrollment exists -> `400`.
- `alt rate exceeded`: more than 10 attempts in 60 seconds -> `429`.
- `opt roster refresh`: student may call `GET /api/groups/{id}/students`; only active
  enrollments are returned, with no assignments, submissions, or grades.

---

## 3. Create assignment

### Goal and preconditions

Teacher uploads assignment metadata, reference solution, and one or more test inputs.
API persists assignment as `PROCESSING`, stores source artifacts in MinIO, and queues
expected-output generation. HTTP response does not wait for worker completion.

Caller must be teacher owning target active, unarchived group. Dates are optional, must
not be before current time, and must satisfy `launchDate <= dueDate <= closeDate` whenever
corresponding values exist.

### Participants

`Teacher`, `Frontend`, `AssignmentController`, `AssignmentService`, `GroupService`,
`Assignment repositories`, `MinIO`, `TestGenerationRequestProducer`, `RabbitMQ`,
`TestGenerationRequestListener`, `TestGenerationService`, `Docker sandbox`,
`TestGenerationResultProducer`, `TestGenerationResultListener`, `Notification router`.

### HTTP and persistence phase

| # | Type | Source | Destination | Method/message | Parameters | Result or state change |
|---:|:---:|---|---|---|---|---|
| 1 | `->` | Teacher | Frontend | Submit assignment form | Metadata, reference file, test input files | Frontend builds multipart request. |
| 2 | `->` | Frontend | AssignmentController | `POST /api/assignments` / `createAssignment(...)` | Part `metadata: CreateAssignmentRequest`; part `referenceSolution: MultipartFile`; repeated part `testCaseInputs: List<MultipartFile>`; JWT | `TEACHER` or `ADMIN` endpoint guard; service currently requires actual `TEACHER`. |
| 3 | `->` | AssignmentController | AssignmentService | `createAssignment(request, referenceSolutionFile, testCaseInputFiles, email)` | Multipart data and authenticated email | Transaction starts. |
| 4 | `->` | AssignmentService | UserRepository | `findByEmail(email)` | Email | Resolves teacher. |
| 5 | `->` | AssignmentService | GroupService | `requireOwnedWritableGroup(groupId, teacher)` | `groupId`, teacher | Confirms ownership and writable group. |
| 6 | `->` | AssignmentService | AssignmentRepository | `save(assignment)` | Metadata; `validationStatus = PROCESSING` | Persists assignment and examples. |
| 7 | `->` | AssignmentService | ReferenceSolutionRevisionRepository | `save(referenceRevision)` | Assignment, reference language, initial key `pending` | Generates revision UUID. |
| 8 | `->` | AssignmentService | MinIO | `ObjectStorageService.upload(referencePath, content)` | `assignments/{a}/test-suite-revisions/{r}/reference/Main.{ext}` | Stores reference solution. |
| 9 | `->` | AssignmentService | TestSuiteRevisionRepository | `save(testSuiteRevision)` | Assignment, reference revision, revision number `1` | Persists test-suite revision. |
| 10 | `loop` | AssignmentService | TestCaseRepository | `save(testCase)` | Assignment, suite revision, order, sample flag | One record per uploaded test input. |
| 11 | `loop` | AssignmentService | MinIO | `ObjectStorageService.upload(inputPath, content)` | `assignments/{a}/test-suite-revisions/{r}/test-cases/{t}/input.in` | Stores each test input; expected-output key is reserved. |
| 12 | `->>` | AssignmentService | TestGenerationRequestProducer | `sendTestGenerationRequest(job)` | `TestGenerationJob` described below | Publishes to `codehive_test_generation_queue`. |
| 13 | `-->` | AssignmentService | AssignmentController | `AssignmentDTO` | Assignment UUID and `PROCESSING` state | Transaction commits. |
| 14 | `-->` | AssignmentController | Frontend | `202 Accepted` | `SuccessResponse<AssignmentDTO>` | UI shows “generation in progress” and polls assignment status. |

`CreateAssignmentRequest` metadata:

| Field | Type/constraint |
|---|---|
| `groupId` | Required UUID. |
| `title`, `description` | Required nonblank strings. |
| `constraints`, `hints`, `tags` | Optional string lists. |
| `timeLimitMs` | Required long, minimum `100`. |
| `memoryLimitMb` | Required long, minimum `16`. |
| `comparatorType` | Required enum. |
| `allowedLanguages` | Required nonempty language list. |
| `referenceLanguage` | Required language enum. |
| `launchDate`, `dueDate`, `closeDate` | Optional future-or-present instants. |
| `examples` | Optional list of `{ input, output, explanation }`. |
| `sampleFlags` | Optional booleans aligned by index with `testCaseInputs`; missing values mean `false`. |
| `maxPoints` | Decimal greater than zero; default `100.00`. |

`TestGenerationJob` parameters:

`assignmentId`, `referenceSolutionPath`, `referenceLanguage`, `testCases[]`
(`testCaseId`, `inputPath`, `outputPath`), `timeLimitMs`, `memoryLimitMb`,
`testSuiteRevisionId`, `referenceSolutionRevisionId`, `comparatorType`, and mode
`TEST_SUITE_GENERATION`.

### Asynchronous worker phase

| # | Type | Source | Destination | Method/message | Parameters | Result or state change |
|---:|:---:|---|---|---|---|---|
| 15 | `->>` | RabbitMQ | TestGenerationRequestListener | `handleTestGenerationJob(job)` | `TestGenerationJob` | Worker receives queued job. |
| 16 | `->` | TestGenerationRequestListener | TestGenerationService | `generateOutputs(job)` | Entire job | Selects executor from `referenceLanguage`. |
| 17 | `->` | TestGenerationService | MinIO | `download(referenceSolutionPath)` | Reference object key | Returns source stream. |
| 18 | `->` | TestGenerationService | Docker sandbox | `executor.prepare(source, timeLimitMs, memoryLimitMb)` | Reference source and limits | Compiles/prepares one container session. |
| 19 | `loop` | TestGenerationService | MinIO | `download(testCase.inputPath)` | Input key per test case | Returns input stream. |
| 20 | `loop` | TestGenerationService | Docker sandbox | `executor.runTestCase(session, input)` | Prepared session, test input | Returns output, status, timing, memory. |
| 21 | `loop` | TestGenerationService | MinIO | `upload(testCase.outputPath, output)` | Expected-output key and generated text | Stores expected output only when reference run succeeds. |
| 22 | `->>` | TestGenerationResultProducer | RabbitMQ | `sendTestGenerationResult(result)` | `assignmentId`, `success`, `generatedCount`, `errorMessage`, revision IDs | Publishes to `codehive_test_generation_result_queue`. |
| 23 | `->>` | RabbitMQ | TestGenerationResultListener | `handleTestGenerationResult(result)` | `TestGenerationResult` | Backend consumes result transactionally. |
| 24 | `alt` | TestGenerationResultListener | Assignment repositories | Success: activate revisions and set `READY`; failure: set revision/assignment `FAILED` | Assignment and revision IDs | Persists final validation state. |
| 25 | `->>` | TestGenerationResultListener | Notification router | Publish validation event | Success: `ASSIGNMENT_READY` and possibly `ASSIGNMENT_PUBLISHED`; failure: `ASSIGNMENT_VALIDATION_FAILED` | Routes after commit to teacher and/or enrolled students. |

### Required fragments

- `alt invalid metadata/files/dates`: reject with `400`; no job is queued.
- `alt not teacher/not owner`: reject with `403`.
- `alt reference compilation or test failure`: stop loop, return failed generation result,
  mark validation `FAILED`.
- `loop status polling`: frontend calls `GET /api/assignments/{id}` until
  `validationStatus` becomes `READY` or `FAILED`.

---

## 4. Create submission and evaluate it

### Goal and preconditions

Student creates a definitive submission. Backend records `Submission` and pending
`Execution`, stores source in MinIO, then dispatches evaluation after transaction commit.
Worker executes hidden tests and returns result asynchronously.

Assignment and group must be active; group must not be archived; assignment must be
`READY` and launched; close date must not have arrived. Student must have active group
enrollment, choose allowed language, and have no current `SUBMITTED` submission.

### Participants

`Student`, `Frontend`, `CheckExecutionController`, `ExecutionRequestService`,
`Assignment/User/Enrollment repositories`, `StudentAssignmentWorkService`,
`SubmissionRepository`, `ExecutionRepository`, `MinIO`, `ExecutionRequestProducer`,
`RabbitMQ`, `ExecutionRequestListener`, `TestExecutionService`, `Docker sandbox`,
`ExecutionResultProducer`, `ExecutionResultListener`, `ExecutionResultService`,
`Notification router`.

### Request and dispatch phase

| # | Type | Source | Destination | Method/message | Parameters | Result or state change |
|---:|:---:|---|---|---|---|---|
| 1 | `->` | Student | Frontend | Submit code | `code`, `language`, `assignmentId` | Frontend selects `executionType = DEFINITIVE`. |
| 2 | `->` | Frontend | CheckExecutionController | `POST /api/execution/check` / `submitExecution(request, authentication)` | Body: `{ code, language, assignmentId, executionType: "DEFINITIVE" }`; JWT | Endpoint rate limit: 10 requests/60 seconds. `requesterId`, if sent, is ignored for identity. |
| 3 | `->` | CheckExecutionController | ExecutionRequestService | `requestExecution(request, authenticatedEmail)` | `ExecutionRequest`, JWT email | Transaction starts. |
| 4 | `->` | ExecutionRequestService | Assignment/User/Enrollment repositories | Lookup and validate | `assignmentId`, email, role, enrollment, language, lifecycle dates | Rejects unauthorized or unavailable submissions. |
| 5 | `->` | ExecutionRequestService | StudentAssignmentWorkService | `getOrCreate(assignment, user)` | Assignment, student | Returns work aggregate. |
| 6 | `opt` | ExecutionRequestService | AssignmentGradeService | `clearGrade(work, CLEARED_RESUBMISSION, user)` | Existing grade, actor student | Clears prior grade and records history before resubmission. |
| 7 | `->` | ExecutionRequestService | SubmissionRepository | `save(new Submission(...))` | Assignment, student, language, `late = now > dueDate` | Persists `SUBMITTED` submission and source object key. |
| 8 | `->` | ExecutionRequestService | ExecutionRepository | `save(execution)` | Type `DEFINITIVE`, student, submission, active test-suite revision, trigger `INITIAL_SUBMISSION` | Persists `PENDING` execution. |
| 9 | `->` | ExecutionRequestService | MinIO | `upload(sourceCodeKey, code)` | `assignments/{a}/submissions/{s}/source/Main.{ext}` | Stores student source. |
| 10 | `->>` | ExecutionRequestService | Application event bus | `publishEvent(new ExecutionJobCreatedEvent(job))` | `ExecutionJob` described below | Job waits for transaction commit. |
| 11 | `->>` | ExecutionRequestService | Notification router | Publish `ASSIGNMENT_SUBMITTED` or `LATE_ASSIGNMENT_SUBMITTED` | Student, group, assignment, submission IDs | Teacher notification routes after commit. |
| 12 | `-->` | ExecutionRequestService | CheckExecutionController | `ExecutionDTO` | Includes execution ID, submission ID, `PENDING` | Transaction commits. |
| 13 | `->>` | ExecutionRequestService | ExecutionRequestProducer | `dispatchExecutionJob(event)` -> `sendExecutionRequest(job)` | After-commit `ExecutionJobCreatedEvent` | Publishes to `codehive_queue`. |
| 14 | `-->` | CheckExecutionController | Frontend | `202 Accepted` | `SuccessResponse<ExecutionDTO>` | Frontend stores execution and submission IDs. |

Definitive `ExecutionJob` parameters:

`id` (execution UUID), `source`, `language`, `executionType`, `testCases[]`
(`testCaseId`, `order`, `inputPath`, `expectedOutputPath`, `stdoutPath`, `stderrPath`),
`timeLimitMs`, `memoryLimitMb`, `comparatorType`, `reportPath`,
`testSuiteRevisionId`, and trigger `INITIAL_SUBMISSION`.

### Asynchronous evaluation phase

| # | Type | Source | Destination | Method/message | Parameters | Result or state change |
|---:|:---:|---|---|---|---|---|
| 15 | `->>` | RabbitMQ | ExecutionRequestListener | `handleExecutionJob(job)` | `ExecutionJob` from `codehive_queue` | Worker receives evaluation request. |
| 16 | `->` | ExecutionRequestListener | TestExecutionService | `executeJob(job)` | Entire job | Creates execution report. |
| 17 | `->` | TestExecutionService | MinIO | `download(job.source)` | Submission source key | Returns source stream. |
| 18 | `->` | TestExecutionService | Docker sandbox | `executor.prepare(source, limits)` | Source, time and memory limits | Compiles/prepares container session. |
| 19 | `loop` | TestExecutionService | MinIO | Download test input and expected output | Per-test object keys | Returns hidden test artifacts. |
| 20 | `loop` | TestExecutionService | Docker sandbox | `executor.runTestCase(session, input)` | Session and input | Produces status/stdout/stderr/timing/memory. |
| 21 | `loop` | TestExecutionService | MinIO | Upload stdout/stderr | Per-test output keys | Stores detailed artifacts. |
| 22 | `->` | TestExecutionService | MinIO | `upload(reportPath, reportJson)` | `executions/{executionId}/report.json` | Stores full report. |
| 23 | `->>` | ExecutionResultProducer | RabbitMQ | `sendExecutionResult(report)` | `ExecutionReport` | Publishes summary to `codehive_result_queue`. |
| 24 | `->>` | RabbitMQ | ExecutionResultListener | `handleExecutionResult(report)` | Execution report | Backend consumes result. |
| 25 | `->` | ExecutionResultListener | ExecutionResultService | `processExecutionResult(report)` | Report | Updates execution status, time, and memory. |
| 26 | `->` | ExecutionResultService | ExecutionRepository | `save(execution)` | Final status and metrics | Persists final execution state. |
| 27 | `->>` | ExecutionResultService | Notification router | Publish `SUBMISSION_EVALUATED` | Submission/student IDs | Student notification routes after commit. |
| 28 | `loop` | Frontend | CheckExecutionController | `GET /api/execution/check/{id}` | Execution UUID, JWT | Polls until status is not `PENDING`. |
| 29 | `opt` | Frontend | CheckExecutionController | `GET /api/execution/check/{id}/report` | Execution UUID, JWT | Reads detailed report from MinIO when ready. |

### Required fragments

- `alt active submission exists`: reject with `400`; student must withdraw it first.
- `alt assignment unavailable/closed/not ready`: reject with `400` or `404`.
- `alt caller not actively enrolled`: reject with `403`.
- `alt compile/test/runtime failure`: worker still creates report with final failure status.
- `alt artifacts not ready/expired`: report endpoint returns `404` or artifact-expired error.

---

## 5. Grading

### Goal and preconditions

Teacher first saves a draft grade, then explicitly returns it to student. Draft remains
teacher-only. Returned grade becomes visible through `GET /api/assignments/{assignmentId}/my-grade`.
Teacher must own assignment and student work must exist.

### Participants

`Teacher`, `Frontend`, `AssignmentStudentWorkController`, `AssignmentGradeService`,
`UserRepository`, `AssignmentRepository`, `StudentAssignmentWorkRepository`,
`AssignmentGradeRepository`, `AssignmentGradeHistoryRepository`, `Notification router`,
`Student`.

### Draft phase

| # | Type | Source | Destination | Method/message | Parameters | Result or state change |
|---:|:---:|---|---|---|---|---|
| 1 | `->` | Teacher | Frontend | Save grade | `assignmentId`, `studentId`, `value` | Value must be decimal `>= 0`. |
| 2 | `->` | Frontend | AssignmentStudentWorkController | `PUT /api/assignments/{assignmentId}/students/{studentId}/grade` / `saveGrade(...)` | Path UUIDs; body `GradeAssignmentRequest { value }`; JWT | Requires `TEACHER`. |
| 3 | `->` | Controller | AssignmentGradeService | `saveDraft(assignmentId, studentId, value, email)` | Path IDs, decimal, authenticated email | Transaction starts. |
| 4 | `->` | AssignmentGradeService | User/Assignment/Work repositories | Resolve and authorize | Email, assignment ID, student ID | Confirms teacher ownership and existing student work. |
| 5 | `->` | AssignmentGradeService | AssignmentGradeRepository | `findByStudentWorkId(workId)` | Student-work UUID | Returns existing grade or empty. |
| 6 | `->` | AssignmentGradeService | AssignmentGradeRepository | `save(grade)` | Value, max-points snapshot, `DRAFT`, teacher, current submission, timestamps | Creates or replaces draft. |
| 7 | `->` | AssignmentGradeService | AssignmentGradeHistoryRepository | `save(history)` | Grade snapshot; reason `CREATED` or `UPDATED`; actor teacher | Adds immutable audit entry. |
| 8 | `-->` | AssignmentGradeService | Frontend | `200 OK` via controller | `SuccessResponse<AssignmentGradeDTO>` | Draft stored; no student notification. |

### Return phase

| # | Type | Source | Destination | Method/message | Parameters | Result or state change |
|---:|:---:|---|---|---|---|---|
| 9 | `->` | Teacher | Frontend | Return grade | `assignmentId`, `studentId` | Explicit publish action. |
| 10 | `->` | Frontend | AssignmentStudentWorkController | `POST /api/assignments/{assignmentId}/students/{studentId}/grade/return` / `returnGrade(...)` | Path UUIDs, JWT; no body | Requires `TEACHER`. |
| 11 | `->` | Controller | AssignmentGradeService | `returnGrade(assignmentId, studentId, email)` | Path IDs, authenticated email | Resolves owner, work, and existing grade. |
| 12 | `->` | AssignmentGradeService | AssignmentGradeHistoryRepository | `save(history)` | Status `RETURNED`, reason `RETURNED`, actor teacher | Grade status/timestamps persist on commit. |
| 13 | `->>` | AssignmentGradeService | Notification router | Publish `GRADE_RETURNED` | Teacher ID, student ID, group ID, assignment ID | Student notification dispatched after commit if enabled. |
| 14 | `-->` | AssignmentGradeService | Frontend | `200 OK` via controller | Returned `AssignmentGradeDTO` | UI shows returned state. |
| 15 | `opt` | Student | AssignmentStudentWorkController | `GET /api/assignments/{assignmentId}/my-grade` | Assignment UUID, student JWT | Returns only grade whose status is `RETURNED`. |

### Required fragments

- `alt value > assignment.maxPoints`: reject draft with `400`.
- `alt missing work or draft`: return `404`.
- `alt not teacher/not owner`: return `403`.
- `opt edit draft`: repeat draft phase; history reason changes to `UPDATED`.
- `opt resubmission`: current grade is cleared and history records
  `CLEARED_RESUBMISSION` before new submission.

---

## 6. Give feedback

### Goal and preconditions

Teacher publishes text feedback for one student's assignment work. Teacher must own
assignment. Unlike grading, feedback is published immediately; no draft/return phase.
Service creates student work if it does not exist.

### Participants

`Teacher`, `Frontend`, `AssignmentStudentWorkController`, `AssignmentFeedbackService`,
`UserRepository`, `AssignmentRepository`, `StudentAssignmentWorkService`,
`AssignmentFeedbackRepository`, `Notification router`, `Student`.

### Main sequence

| # | Type | Source | Destination | Method/message | Parameters | Result or state change |
|---:|:---:|---|---|---|---|---|
| 1 | `->` | Teacher | Frontend | Publish feedback | `assignmentId`, `studentId`, `body` | Body must be nonblank, maximum 10,000 characters. |
| 2 | `->` | Frontend | AssignmentStudentWorkController | `POST /api/assignments/{assignmentId}/students/{studentId}/feedback` / `createFeedback(...)` | Path UUIDs; body `CreateFeedbackRequest { body }`; JWT | Requires `TEACHER`. |
| 3 | `->` | Controller | AssignmentFeedbackService | `create(assignmentId, studentId, body, email)` | Path IDs, feedback text, authenticated email | Transaction starts. |
| 4 | `->` | AssignmentFeedbackService | UserRepository | `findByEmail(email)` and `findById(studentId)` | Email, student UUID | Resolves teacher and student. |
| 5 | `->` | AssignmentFeedbackService | AssignmentRepository | `findById(assignmentId)` | Assignment UUID | Confirms teacher owns assignment. |
| 6 | `->` | AssignmentFeedbackService | StudentAssignmentWorkService | `getOrCreate(assignment, student)` | Assignment, student | Returns or creates student-work aggregate. |
| 7 | `->` | AssignmentFeedbackService | AssignmentFeedbackRepository | `save(feedback)` | Work, teacher author, body; default status `PUBLISHED` | Persists feedback. |
| 8 | `->>` | AssignmentFeedbackService | Notification router | Publish `FEEDBACK_RECEIVED` | Teacher ID, student ID, group ID, assignment ID | Student notification dispatched after commit if enabled. |
| 9 | `-->` | AssignmentFeedbackService | AssignmentStudentWorkController | `AssignmentFeedbackDTO` | Feedback ID, assignment/student/author IDs, body, status, timestamps | Transaction commits. |
| 10 | `-->` | AssignmentStudentWorkController | Frontend | `200 OK` | `SuccessResponse<AssignmentFeedbackDTO>` | Feedback appears immediately. |
| 11 | `opt` | Student | AssignmentStudentWorkController | `GET /api/assignments/{assignmentId}/students/{studentId}/feedback` | Path UUIDs, student JWT | Student may list only own feedback. |

### Required fragments

- `alt invalid body`: blank or more than 10,000 characters -> `400`.
- `alt not teacher/not owner`: -> `403`.
- `alt student or assignment missing`: -> `404`.
- `opt logical deletion`: teacher calls `DELETE /api/assignments/feedback/{feedbackId}`;
  service sets `status = DELETED`, hides body in DTO, and preserves record.

---

## Diagram construction notes

- Use one diagram per numbered flow. Create-assignment and create-submission diagrams
  should contain visible synchronous and asynchronous regions.
- Put frontend and backend inside separate UML boxes. Put PostgreSQL, RabbitMQ, MinIO,
  worker, and Docker sandbox inside infrastructure/worker boxes.
- Show activation bars on controller and service lifelines. Keep worker activation open
  only for message processing, not during frontend polling.
- Use solid arrows for HTTP/service/repository calls, dashed return arrows, and open-head
  asynchronous arrows for domain events and RabbitMQ messages.
- Collapse related repositories into one `PostgreSQL` lifeline in presentation diagrams
  when width is limited. Preserve method names as arrow labels or numbered notes.
- Never draw `202 Accepted` after worker completion. It returns after backend persistence
  and queue publication; worker result arrives later.
- Never show client-supplied `requesterId` as submission identity. Authenticated JWT user
  is authoritative.
- Add notes on privacy boundaries: students may see same-group enrollment list, their own
  work/feedback, and returned grades only; they cannot see peers' submissions, grades,
  assignments-in-progress, or feedback.

## Source traceability

| Flow | Primary source files |
|---|---|
| Group creation and join | `codehive-backend/.../controller/GroupController.java`, `service/GroupService.java`, `model/request/group/*`, `repository/GroupEnrollmentRepository.java` |
| Assignment creation | `controller/AssignmentController.java`, `service/AssignmentService.java`, `messaging/producer/TestGenerationRequestProducer.java`, backend/worker test-generation listeners and services |
| Submission and evaluation | `controller/CheckExecutionController.java`, `service/ExecutionRequestService.java`, `service/ExecutionResultService.java`, backend/worker execution producers, listeners, and `TestExecutionService.java` |
| Grading | `controller/AssignmentStudentWorkController.java`, `service/AssignmentGradeService.java` |
| Feedback | `controller/AssignmentStudentWorkController.java`, `service/AssignmentFeedbackService.java` |
| Notifications | `notification/NotificationDomainEventPublisher.java`, `notification/NotificationDomainEventRouter.java`, `notification/NotificationDispatchService.java` |

All backend paths above start at:
`codehive-backend/src/main/java/com/github/codehive/`.
Worker sources start at:
`codehive-worker/src/main/java/com/github/codehive/worker/`.
