# Assignment Updates, Reevaluation, Feedback, and Grades

This guide continues from [Core workflow](CORE_WORKFLOW.md). It assumes:

- `assignmentId`, `teacherToken`, `studentToken`, and `studentId` are set.
- The assignment is `READY`.
- The student has a current definitive submission.
- `submissionId` identifies that current submission.

## Important update semantics

| Change | Immediate? | Student submissions rerun? | Grades cleared? |
|---|---:|---:|---:|
| Metadata only | Yes | No | Only when `maxPoints` changes |
| Reference only | No; validate first | No | Only if combined with `maxPoints` |
| Test suite | No; validate first | Yes, current submissions only | Yes |
| Reference + tests | No; validate together | Yes | Yes |

A staged update is returned with HTTP `202` and status `VALIDATING`. Only one
validating update may exist for an assignment at a time.

## 1. Apply a metadata-only update

Send a multipart request with only the `metadata` part:

```http
PATCH {{baseUrl}}/api/assignments/{{assignmentId}}
Authorization: Bearer {{teacherToken}}
```

`metadata` as `application/json`:

```json
{
  "title": "Add two integers — revised instructions",
  "description": "Read exactly two integers and print their sum followed by a newline.",
  "hints": ["Python users can use map(int, input().split())."]
}
```

**Expected:** HTTP `200`, `data.kind = "METADATA"` and
`data.status = "APPLIED"`.

Verify immediately:

```http
GET {{baseUrl}}/api/assignments/{{assignmentId}}
Authorization: Bearer {{teacherToken}}
```

Expected:

- The title and description changed.
- `activeTestSuiteRevisionId` did not change.
- `activeReferenceSolutionRevisionId` did not change.
- The current submission was not reevaluated.

If the assignment was already published, active students receive an assignment
update email according to their notification preferences.

## 2. Apply a compatible reference-only update

Save this equivalent implementation as `reference-compatible.py`:

```python
numbers = [int(value) for value in input().split()]
print(sum(numbers))
```

Send form-data:

| Key | Type | Value |
|---|---|---|
| `metadata` | Text (`application/json`) | `{"referenceLanguage":"PYTHON"}` |
| `referenceSolution` | File | `reference-compatible.py` |

```http
PATCH {{baseUrl}}/api/assignments/{{assignmentId}}
Authorization: Bearer {{teacherToken}}
```

**Expected:** HTTP `202`, `data.kind = "REFERENCE_ONLY"`,
`data.status = "VALIDATING"`.

Save the update ID:

```javascript
const body = pm.response.json();
pm.environment.set("updateId", body.data.id);
```

Poll:

```http
GET {{baseUrl}}/api/assignments/updates/{{updateId}}
Authorization: Bearer {{teacherToken}}
```

Stop at `APPLIED` or `REJECTED`. Expect `APPLIED`.

Retrieve the assignment and verify:

- `activeReferenceSolutionRevisionId` changed.
- `activeTestSuiteRevisionId` stayed the same.
- The current submission and its prior execution were not replaced.
- Students did not receive an assignment-change notification for this
  reference-only change.

## 3. Reject an incompatible reference-only update

Save as `reference-incompatible.py`:

```python
a, b = map(int, input().split())
print(a * b)
```

Submit it using the same reference-only multipart structure.

**Expected:** HTTP `202` initially. Poll the returned update until:

```json
{
  "kind": "REFERENCE_ONLY",
  "status": "REJECTED",
  "failureMessage": "..."
}
```

Verify with `GET /api/assignments/{{assignmentId}}`:

- Both active revision IDs are unchanged.
- The incompatible reference was not activated.
- Existing submissions were not reevaluated.
- Students were not notified of an assignment change.

The teacher may receive an assignment-validation-failed email.

## 4. Create and return a grade

First save a draft:

```http
PUT {{baseUrl}}/api/assignments/{{assignmentId}}/students/{{studentId}}/grade
Authorization: Bearer {{teacherToken}}
Content-Type: application/json
```

```json
{
  "value": 75
}
```

**Expected:** HTTP `200`, `data.status = "DRAFT"`,
`data.maxPoints = 100`, and `data.submissionId = {{submissionId}}`.

Teacher work view must expose the draft:

```http
GET {{baseUrl}}/api/assignments/{{assignmentId}}/students/{{studentId}}/work
Authorization: Bearer {{teacherToken}}
```

Student work view must not expose a draft grade:

```http
GET {{baseUrl}}/api/assignments/{{assignmentId}}/my-work
Authorization: Bearer {{studentToken}}
```

The `grade` field should be absent or null. This direct endpoint must also
return HTTP `404` while the grade remains a draft:

```http
GET {{baseUrl}}/api/assignments/{{assignmentId}}/my-grade
Authorization: Bearer {{studentToken}}
```

Return the grade:

```http
POST {{baseUrl}}/api/assignments/{{assignmentId}}/students/{{studentId}}/grade/return
Authorization: Bearer {{teacherToken}}
```

**Expected:** HTTP `200`, `data.status = "RETURNED"` with a non-null
`returnedAt`.

The student can now retrieve the same grade through `my-grade` and `my-work`.
Returning the grade emits a student notification email when enabled.

## 5. Publish multiple feedback comments

Create the first comment:

```http
POST {{baseUrl}}/api/assignments/{{assignmentId}}/students/{{studentId}}/feedback
Authorization: Bearer {{teacherToken}}
```

```json
{
  "body": "The input parsing is correct. Review the arithmetic operation."
}
```

**Expected:** HTTP `200`, `data.status = "PUBLISHED"`.

Save its ID:

```javascript
pm.environment.set("feedbackId", pm.response.json().data.id);
```

Create another comment:

```json
{
  "body": "Try the sample 2 3 manually before submitting again."
}
```

List feedback as the teacher or the same student:

```http
GET {{baseUrl}}/api/assignments/{{assignmentId}}/students/{{studentId}}/feedback
Authorization: Bearer {{studentToken}}
```

Both published comments should be present. Feedback is associated with the
assignment and student, not with one submission.

There is no edit endpoint. To replace the first comment, delete it:

```http
DELETE {{baseUrl}}/api/assignments/feedback/{{feedbackId}}
Authorization: Bearer {{teacherToken}}
```

**Expected:** HTTP `200`. The service performs a logical deletion. The deleted
comment remains in the list as a tombstone with `status = "DELETED"`, a
non-null `deletedAt`, and `body = null`.

## 6. Append a valid test case

Save as `test-3.in`:

```text
100 250
```

Send form-data:

| Key | Type | Value |
|---|---|---|
| `metadata` | Text (`application/json`) | JSON below |
| `testCaseInputs` | File | `test-3.in` |

```json
{
  "testSuiteUpdateMode": "APPEND",
  "sampleFlags": [false]
}
```

```http
PATCH {{baseUrl}}/api/assignments/{{assignmentId}}
Authorization: Bearer {{teacherToken}}
```

**Expected:** HTTP `202`, `data.kind = "TEST_SUITE"` and
`data.status = "VALIDATING"`.

Save `updateId`, poll its status, and expect `APPLIED`.

After activation:

- `activeTestSuiteRevisionId` changed.
- The existing two tests were copied into the new complete revision.
- The new test was appended as order 3.
- The active reference revision remains valid.
- The returned grade was cleared, but its audit history remains stored.
- The current non-withdrawn submission was queued for reevaluation.
- Active students receive an assignment-tests-updated notification.

Verify grade clearing:

```http
GET {{baseUrl}}/api/assignments/{{assignmentId}}/my-grade
Authorization: Bearer {{studentToken}}
```

**Expected:** HTTP `404`.

Teacher work view should also have no current `grade`.

### Reevaluation observability

The current API does not expose a list of executions for a submission or a
reevaluation-batch endpoint. Consequently, the new reevaluation execution ID
cannot currently be discovered using Postman alone.

Use these API-visible checks:

- Assignment update reached `APPLIED`.
- Active test revision changed.
- Grade was cleared.
- The student receives a submission-reevaluated email after processing.

For local diagnostic verification, query PostgreSQL read-only:

```sql
select id, status, trigger, test_suite_revision_id, is_outdated, created_at
from executions
where submission_id = '<submissionId>'
order by created_at desc;
```

Expected:

- One new row with `trigger = 'ASSIGNMENT_UPDATE'`
- The new active test-suite revision ID
- The earlier execution marked `is_outdated = true`
- A terminal status after the worker finishes

## 7. Reject an invalid test-suite update

Save `invalid-input.in`:

```text
not two integers
```

Append it using:

```json
{
  "testSuiteUpdateMode": "APPEND",
  "sampleFlags": [false]
}
```

The active Python reference will fail to parse this input.

**Expected:** HTTP `202` followed by update status `REJECTED`.

Verify:

- The active test-suite revision remains the one from step 6.
- No submissions are reevaluated for the rejected revision.
- No grades are cleared by the rejected update.
- `failureMessage` explains the validation failure.

## 8. Replace the complete suite

`REPLACE_ALL` does not retain old cases. Upload every test that should exist in
the new revision.

For example, upload `test-1.in` and `test-3.in` with:

```json
{
  "testSuiteUpdateMode": "REPLACE_ALL",
  "sampleFlags": [true, false]
}
```

**Expected:** validation followed by `APPLIED`. The new active revision contains
exactly the uploaded files. As with every applied test-suite change, current
submissions are reevaluated and current grades are cleared.

## 9. Combined reference and test-suite update

Upload a new compatible reference file and the desired new tests in one PATCH.
Use either `APPEND` or `REPLACE_ALL` in metadata.

The backend validates the proposed reference against the complete proposed
suite. Metadata, reference, and tests activate atomically only after success.
If reference compilation or any test execution fails, the entire update becomes
`REJECTED` and the previous active assignment remains unchanged.

## 10. Clear a grade by changing max points

Create and return another grade, then apply metadata-only:

```json
{
  "maxPoints": 150
}
```

**Expected:** HTTP `200`.

Verify:

- Assignment `maxPoints = 150`.
- The current grade is gone for both teacher and student views.
- The teacher receives a grades-cleared notification when at least one grade
  was removed.
- The grade history remains retained internally.
