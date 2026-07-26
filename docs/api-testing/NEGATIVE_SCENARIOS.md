# Negative and Boundary Scenarios

Run these scenarios after the [core workflow](CORE_WORKFLOW.md). Each scenario
must verify both the HTTP response and that rejected operations did not create
or activate unintended state.

## 1. Authentication and authorization

### Protected route without a token

```http
GET {{baseUrl}}/api/groups
```

**Expected:** HTTP `403` with the current Spring Security configuration.

### Invalid JWT

```http
GET {{baseUrl}}/api/groups
Authorization: Bearer not-a-valid-jwt
```

**Expected:** HTTP `401`.

### Student attempts to create an assignment

Repeat the assignment multipart request using `studentToken`.

**Expected:** HTTP `403`; no assignment is created.

### Teacher attempts a definitive student submission

```http
POST {{baseUrl}}/api/execution/check
Authorization: Bearer {{teacherToken}}
```

```json
{
  "code": "print(1)",
  "language": "PYTHON",
  "assignmentId": "{{assignmentId}}",
  "executionType": "DEFINITIVE"
}
```

**Expected:** HTTP `403`.

### Student reads another student's work

Replace `studentId` with another student's UUID:

```http
GET {{baseUrl}}/api/assignments/{{assignmentId}}/students/<otherStudentId>/work
Authorization: Bearer {{studentToken}}
```

**Expected:** HTTP `403`.

### Student reads a teacher-only update

```http
GET {{baseUrl}}/api/assignments/updates/{{updateId}}
Authorization: Bearer {{studentToken}}
```

**Expected:** HTTP `403`.

### Unauthorized execution report

Use a token belonging to a user who neither initiated the execution nor owns
the submission's group:

```http
GET {{baseUrl}}/api/execution/check/{{executionId}}/report
Authorization: Bearer <unrelatedToken>
```

**Expected:** HTTP `403`.

## 2. Request validation

### Missing assignment language

```json
{
  "code": "print(1)",
  "assignmentId": "{{assignmentId}}",
  "executionType": "PRACTICE",
  "testCases": ["1 2"]
}
```

**Expected:** HTTP `400`, with `"Language is required"` in `errors`.

### Unsupported language

The core assignment allows only Python:

```json
{
  "code": "public class Main {}",
  "language": "JAVA",
  "assignmentId": "{{assignmentId}}",
  "executionType": "PRACTICE",
  "testCases": ["1 2"]
}
```

**Expected:** HTTP `400`; no execution is created.

### Practice without test cases

Run this once as the student and once as the teacher:

```json
{
  "code": "print(1)",
  "language": "PYTHON",
  "assignmentId": "{{assignmentId}}",
  "executionType": "PRACTICE"
}
```

**Expected:** HTTP `400` for both actors.

### Blank source code

```json
{
  "code": "   ",
  "language": "PYTHON",
  "assignmentId": "{{assignmentId}}",
  "executionType": "DEFINITIVE"
}
```

**Expected:** HTTP `400`.

### Malformed assignment dates

Use metadata-only PATCH with dates in the wrong order:

```json
{
  "launchDate": "2026-08-03T12:00:00Z",
  "dueDate": "2026-08-02T12:00:00Z",
  "closeDate": "2026-08-01T12:00:00Z"
}
```

**Expected:** HTTP `400`. The existing dates remain unchanged.

### Grade exceeds max points

When assignment `maxPoints` is 100:

```http
PUT {{baseUrl}}/api/assignments/{{assignmentId}}/students/{{studentId}}/grade
Authorization: Bearer {{teacherToken}}
```

```json
{
  "value": 100.01
}
```

**Expected:** HTTP `400`; no grade is created or modified.

### Empty feedback

```json
{
  "body": "   "
}
```

**Expected:** HTTP `400`; no feedback is created.

### Multipart metadata uses the wrong media type

Send assignment `metadata` as plain `text/plain`.

**Expected:** HTTP `415` or a request-conversion `400`, depending on the API
tester multipart encoding. Correct the part to `application/json`.

## 3. Assignment lifecycle

### Execution before launch

Use a metadata-only update to set future dates. Generate them in a Postman
pre-request script:

```javascript
const now = Date.now();
pm.environment.set("futureLaunch", new Date(now + 60 * 60 * 1000).toISOString());
pm.environment.set("futureDue", new Date(now + 2 * 60 * 60 * 1000).toISOString());
pm.environment.set("futureClose", new Date(now + 3 * 60 * 60 * 1000).toISOString());
```

Metadata:

```json
{
  "launchDate": "{{futureLaunch}}",
  "dueDate": "{{futureDue}}",
  "closeDate": "{{futureClose}}"
}
```

Then request an execution as the student.

**Expected:** HTTP `404`; the assignment is intentionally hidden before
launch. The teacher owner may still use practice mode for preview.

Restore immediate availability:

```json
{
  "clearLaunchDate": true,
  "clearDueDate": true,
  "clearCloseDate": true
}
```

### Late but still accepted

Set `dueDate` five minutes in the past and `closeDate` one hour in the future.
Withdraw the current submission first, then submit definitively.

**Expected:** HTTP `202`; the created submission has `deliveredLate = true`.

### Definitive submission at or after close

Set `closeDate` to a past instant and submit definitively.

**Expected:** HTTP `400`; no submission or execution is created.

### Withdrawal at or after close

This requires a current submitted delivery. Set `closeDate` in the past, then:

```http
POST {{baseUrl}}/api/submissions/{{submissionId}}/withdraw
Authorization: Bearer {{studentToken}}
```

**Expected:** HTTP `400`. The submission remains current and `SUBMITTED`.

Restore the dates before continuing.

### Resubmission without withdrawal

With a current `SUBMITTED` delivery, send another definitive request.

**Expected:** HTTP `400`; submission history remains unchanged.

### Withdraw a historical submission

Use the ID of an older withdrawn/non-current submission.

**Expected:** HTTP `400`; only the current `SUBMITTED` delivery is withdrawable.

## 4. Group and enrollment lifecycle

### Duplicate join

Join the same group again using `studentToken`.

**Expected:** HTTP `400`; the active enrollment is not duplicated.

### Teacher joins a group

Send the join request using `teacherToken`.

**Expected:** HTTP `403`.

### Inactive enrollment

Remove the student as the group owner:

```http
DELETE {{baseUrl}}/api/groups/{{groupId}}/students/{{studentId}}
Authorization: Bearer {{teacherToken}}
```

Then list assignments or request an execution with `studentToken`.

**Expected:** HTTP `403` or resource hiding according to the requested route.
No new submission is accepted.

Rejoin with the original join code before continuing. The historical enrollment
should be reactivated rather than duplicated.

### Archived group is read-only

```http
POST {{baseUrl}}/api/groups/{{groupId}}/archive
Authorization: Bearer {{teacherToken}}
```

Attempt:

- Student join
- Assignment creation/update
- Practice execution
- Definitive submission

**Expected:** each mutation is rejected. Existing historical data remains
readable to the owner.

Restore:

```http
POST {{baseUrl}}/api/groups/{{groupId}}/unarchive
Authorization: Bearer {{teacherToken}}
```

## 5. Staged assignment-update failures

### Concurrent update

Submit a reference or test-suite update, then immediately submit another staged
update before the first reaches a terminal state.

**Expected:** the second request returns HTTP `400` with a message that another
update is still being validated.

### Incompatible reference

Use:

```python
a, b = map(int, input().split())
print(a * b)
```

**Expected:** initial HTTP `202`, then update status `REJECTED`. Active revision
IDs remain unchanged and submissions are not reevaluated.

### Reference compilation failure

Upload:

```python
def broken(
```

**Expected:** initial HTTP `202`, then `REJECTED` with a failure message.

### Test that crashes the reference

Append:

```text
not valid integers
```

**Expected:** initial HTTP `202`, then `REJECTED`. The proposed suite never
becomes active, grades remain intact, and no reevaluation is created.

## 6. Execution result boundaries

Use practice executions to exercise verdicts without changing submission
history.

### Wrong answer (`WA`)

```python
a, b = map(int, input().split())
print(a - b)
```

### Compilation error (`CE`)

```python
def broken(
```

### Runtime error (`RTE`)

```python
raise RuntimeError("manual test")
```

### Time limit (`TLE`)

```python
while True:
    pass
```

### Output limit (`OLE`)

```python
while True:
    print("x" * 10000)
```

For every request:

1. Expect HTTP `202` and initial `PENDING`.
2. Poll until terminal.
3. Retrieve the report.
4. Confirm the overall and per-test status match the intended verdict.

Memory-limit behavior is language/runtime-dependent; use the worker sandbox
security tests for deterministic `MLE` verification.

## 7. Report availability and retention

### Pending report

Request the report immediately after creating an execution:

```http
GET {{baseUrl}}/api/execution/check/{{executionId}}/report
Authorization: Bearer {{studentToken}}
```

If the execution is still pending, expect HTTP `404` with a message indicating
that the report is not available yet.

### Expired report

Execution artifacts are retained for 180 days. Once `artifactsExpireAt` is
reached, the report endpoint returns HTTP `410 Gone`, even if the execution
summary remains in PostgreSQL.

This boundary normally requires a controlled database timestamp in a local
test environment; do not wait for the real retention period.

## 8. Cleanup

For a reusable environment:

1. Clear assignment dates.
2. Unarchive the group if necessary.
3. Keep withdrawn submissions and feedback tombstones; they are intentional
   history.
4. Use logical assignment/group deletion only when specifically testing those
   lifecycle endpoints.
5. For a completely clean run, recreate the development database, clear stale
   RabbitMQ messages, and remove old MinIO objects.

