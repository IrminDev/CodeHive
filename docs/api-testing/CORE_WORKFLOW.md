# Core API Workflow

This scenario starts with the default administrator and ends with a withdrawn
submission followed by a successful resubmission.

Complete the [setup guide](README.md) first.

## Scenario overview

```text
Administrator
  → creates teacher and student
Teacher
  → creates group and assignment
Student
  → joins group
Worker
  → validates assignment
Student
  → practices, submits, polls result, withdraws, resubmits
Teacher
  → can inspect the student's current work and execution
```

## 1. Log in as the administrator

**Request**

```http
POST {{baseUrl}}/api/auth/login
```

```json
{
  "identifier": "{{adminEmail}}",
  "password": "{{adminPassword}}"
}
```

**Expected:** HTTP `200`, `data.user.role = "ADMIN"`.

Save the token:

```javascript
const body = pm.response.json();
pm.environment.set("adminToken", body.data.token);
```

## 2. Create the teacher

Use the administrator bearer token.

```http
POST {{baseUrl}}/api/auth/signup
Authorization: Bearer {{adminToken}}
```

```json
{
  "role": "TEACHER",
  "name": "API Teacher",
  "fatherLastName": "Testing",
  "motherLastName": "Guide",
  "enrollmentNumber": "2026630001",
  "email": "{{teacherEmail}}"
}
```

**Expected:** HTTP `201`, `data.role = "TEACHER"` and
`data.temporaryPassword = true`.

Save `data.id` as `teacherId`. Retrieve the temporary password from the
configured teacher inbox and store it as `teacherPassword`.

## 3. Create the student

```http
POST {{baseUrl}}/api/auth/signup
Authorization: Bearer {{adminToken}}
```

```json
{
  "role": "STUDENT",
  "name": "API Student",
  "fatherLastName": "Testing",
  "motherLastName": "Guide",
  "enrollmentNumber": "2026630002",
  "email": "{{studentEmail}}"
}
```

**Expected:** HTTP `201`, `data.role = "STUDENT"`.

Save `data.id` as `studentId`. Retrieve the generated password and save it as
`studentPassword`.

The signup endpoint is limited to three requests per five minutes. Avoid
repeatedly sending the same request.

## 4. Log in as teacher and student

Teacher:

```http
POST {{baseUrl}}/api/auth/login
```

```json
{
  "identifier": "{{teacherEmail}}",
  "password": "{{teacherPassword}}"
}
```

Save `data.token` as `teacherToken` and `data.user.id` as `teacherId`.

Student:

```http
POST {{baseUrl}}/api/auth/login
```

```json
{
  "identifier": "{{studentEmail}}",
  "password": "{{studentPassword}}"
}
```

Save `data.token` as `studentToken` and `data.user.id` as `studentId`.

Verify either identity with:

```http
GET {{baseUrl}}/api/auth/me
Authorization: Bearer {{teacherToken}}
```

## 5. Create a group

Use the teacher token:

```http
POST {{baseUrl}}/api/groups
Authorization: Bearer {{teacherToken}}
```

```json
{
  "name": "API Testing 101",
  "description": "Temporary group for manual API verification"
}
```

**Expected:** HTTP `201`. The owner response includes `data.joinCode`.

```javascript
const body = pm.response.json();
pm.environment.set("groupId", body.data.id);
pm.environment.set("joinCode", body.data.joinCode);
```

## 6. Join the group as the student

```http
POST {{baseUrl}}/api/groups/join
Authorization: Bearer {{studentToken}}
```

```json
{
  "joinCode": "{{joinCode}}"
}
```

**Expected:** HTTP `200`. The student-facing group response must not expose the
join code.

Verify the teacher roster:

```http
GET {{baseUrl}}/api/groups/{{groupId}}/students
Authorization: Bearer {{teacherToken}}
```

The response should contain `studentId` with an active enrollment.

## 7. Prepare assignment files

Save this as `reference.py`:

```python
a, b = map(int, input().split())
print(a + b)
```

Save these test inputs as separate files:

`test-1.in`

```text
2 3
```

`test-2.in`

```text
-4 7
```

## 8. Create the assignment

Use `POST {{baseUrl}}/api/assignments` with the teacher token and a form-data
body:

| Key | Type | Value |
|---|---|---|
| `metadata` | Text (`application/json`) | JSON below |
| `referenceSolution` | File | `reference.py` |
| `testCaseInputs` | File | `test-1.in` |
| `testCaseInputs` | File | `test-2.in` |

Metadata:

```json
{
  "groupId": "{{groupId}}",
  "title": "Add two integers",
  "description": "Read two integers and print their sum.",
  "constraints": ["Input contains exactly two integers."],
  "hints": ["Use split() and map()."],
  "tags": ["arithmetic", "introduction"],
  "timeLimitMs": 2000,
  "memoryLimitMb": 128,
  "comparatorType": "EXACT_MATCH",
  "allowedLanguages": ["PYTHON"],
  "referenceLanguage": "PYTHON",
  "sampleFlags": [true, false],
  "maxPoints": 100,
  "examples": [
    {
      "input": "2 3",
      "output": "5",
      "explanation": "2 + 3 equals 5."
    }
  ]
}
```

**Expected:** HTTP `202` and `data.validationStatus = "PROCESSING"`.

Save:

```javascript
const body = pm.response.json();
pm.environment.set("assignmentId", body.data.id);
```

## 9. Wait for assignment validation

Poll as the teacher:

```http
GET {{baseUrl}}/api/assignments/{{assignmentId}}
Authorization: Bearer {{teacherToken}}
```

Stop when:

- `READY`: continue.
- `FAILED`: inspect the worker logs; do not continue.

When ready, save the active revisions:

```javascript
const body = pm.response.json();
pm.environment.set(
  "activeTestSuiteRevisionId",
  body.data.activeTestSuiteRevisionId
);
pm.environment.set(
  "activeReferenceRevisionId",
  body.data.activeReferenceSolutionRevisionId
);
```

The response should contain one public sample test case. Private cases and
expected outputs must not be exposed.

## 10. Verify student visibility

```http
GET {{baseUrl}}/api/assignments?groupId={{groupId}}&page=0&size=10
Authorization: Bearer {{studentToken}}
```

**Expected:** HTTP `200`; the page contains the ready assignment.

## 11. Run a practice execution

```http
POST {{baseUrl}}/api/execution/check
Authorization: Bearer {{studentToken}}
```

```json
{
  "code": "a, b = map(int, input().split())\nprint(a + b)",
  "language": "PYTHON",
  "assignmentId": "{{assignmentId}}",
  "testCases": ["10 20", "-5 2"],
  "executionType": "PRACTICE"
}
```

**Expected:** HTTP `202`, `data.executionType = "PRACTICE"` and
`data.status = "PENDING"`.

Save `data.id` as `practiceExecutionId`, poll:

```http
GET {{baseUrl}}/api/execution/check/{{practiceExecutionId}}
Authorization: Bearer {{studentToken}}
```

After the status becomes terminal, retrieve:

```http
GET {{baseUrl}}/api/execution/check/{{practiceExecutionId}}/report
Authorization: Bearer {{studentToken}}
```

Both cases should pass. Practice execution does not create a submission.

The group owner can run the same practice request using `teacherToken`, but
cannot send a definitive submission.

## 12. Create a definitive submission

```http
POST {{baseUrl}}/api/execution/check
Authorization: Bearer {{studentToken}}
```

```json
{
  "code": "a, b = map(int, input().split())\nprint(a + b)",
  "language": "PYTHON",
  "assignmentId": "{{assignmentId}}",
  "executionType": "DEFINITIVE"
}
```

**Expected:** HTTP `202`, with a non-null `data.submissionId`.

```javascript
const body = pm.response.json();
pm.environment.set("executionId", body.data.id);
pm.environment.set("submissionId", body.data.submissionId);
```

The backend derives the student from the JWT. A client-supplied `requesterId`
is ignored.

## 13. Poll and inspect the definitive result

Poll:

```http
GET {{baseUrl}}/api/execution/check/{{executionId}}
Authorization: Bearer {{studentToken}}
```

For the correct solution, expect `data.status = "AC"`.

Then retrieve:

```http
GET {{baseUrl}}/api/execution/check/{{executionId}}/report
Authorization: Bearer {{studentToken}}
```

Expected report properties:

- Overall status `AC`
- Two ordered test results
- Each result contains its test-case UUID
- No private expected-output object key is exposed

The teacher may retrieve the same definitive execution and report with
`teacherToken`.

## 14. Inspect student work

Student:

```http
GET {{baseUrl}}/api/assignments/{{assignmentId}}/my-work
Authorization: Bearer {{studentToken}}
```

Teacher:

```http
GET {{baseUrl}}/api/assignments/{{assignmentId}}/students/{{studentId}}/work
Authorization: Bearer {{teacherToken}}
```

Expected state:

- `status = "SUBMITTED"`
- `currentSubmissionId = {{submissionId}}`
- The submission history contains the current `SUBMITTED` submission

## 15. Verify explicit withdrawal is required

Repeat the definitive request before withdrawing.

**Expected:** HTTP `400`; the response should instruct the student to withdraw
the current submission. No new submission or execution should be created.

## 16. Withdraw the current submission

```http
POST {{baseUrl}}/api/submissions/{{submissionId}}/withdraw
Authorization: Bearer {{studentToken}}
```

**Expected:** HTTP `200`.

Repeat `GET /api/assignments/{{assignmentId}}/my-work`. The old submission
should remain in history with:

- `status = "WITHDRAWN"`
- A non-null `withdrawnAt`
- No current submitted delivery

## 17. Submit a replacement

Send another definitive execution with this intentionally wrong solution:

```json
{
  "code": "a, b = map(int, input().split())\nprint(a - b)",
  "language": "PYTHON",
  "assignmentId": "{{assignmentId}}",
  "executionType": "DEFINITIVE"
}
```

Save the new `executionId` and `submissionId`. Poll until terminal.

**Expected:**

- The request is accepted because the previous submission was withdrawn.
- The new execution becomes `WA`.
- Student work points at the replacement submission.
- Submission history contains both the withdrawn and current submissions.

Continue with [assignment updates and evaluation](ASSIGNMENT_UPDATES_AND_EVALUATION.md).

