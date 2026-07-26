# CodeHive Manual API Testing

This directory contains a Postman-compatible, end-to-end testing guide for the
CodeHive backend. It is intended for development before the frontend workflows
are available.

## Guides

1. [Core workflow](CORE_WORKFLOW.md) — users, authentication, groups,
   assignments, executions, withdrawal, and resubmission.
2. [Assignment updates and evaluation](ASSIGNMENT_UPDATES_AND_EVALUATION.md) —
   staged updates, reevaluation, feedback, and grades.
3. [Negative scenarios](NEGATIVE_SCENARIOS.md) — authorization, validation,
   lifecycle, and state-preservation checks.

Follow the guides in order when testing against an empty development database.

## 1. Required services

The complete execution flow needs all of the following:

- PostgreSQL
- RabbitMQ
- MinIO
- `codehive-backend`
- `codehive-worker`

From `codehive-backend`, start the infrastructure using the project's configured
environment:

```bash
docker compose up -d
./gradlew bootRun
```

In another terminal:

```bash
cd ../codehive-worker
./gradlew bootRun
```

The default API URL is `http://localhost:8080`. OpenAPI documentation is
available at:

```text
http://localhost:8080/swagger-ui.html
```

Assignment validation and code execution are asynchronous. If the worker is not
running, assignments and executions will remain in `PROCESSING` or `PENDING`.

## 2. Email requirement

Administrator-created accounts receive a generated temporary password by
email. For this guide, configure `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`,
`MAIL_PASSWORD`, `MAIL_SMTP_AUTH`, and `MAIL_STARTTLS_ENABLE` so that the
teacher and student inboxes are accessible.

The default administrator is created at backend startup unless an account with
the configured email already exists:

| Setting | Default |
|---|---|
| Email | `admin@codehive.com` |
| Password | `Admin@12345` |
| Enrollment | `ADMIN-001` |

Environment variables `ADMIN_EMAIL` and `ADMIN_PASSWORD` override these
defaults.

Do not use the default password outside a local development environment.

## 3. Postman environment

Create a Postman environment with these variables:

| Variable | Initial value |
|---|---|
| `baseUrl` | `http://localhost:8080` |
| `adminEmail` | `admin@codehive.com` |
| `adminPassword` | `Admin@12345` |
| `teacherEmail` | an inbox you control |
| `teacherPassword` | leave empty until the email arrives |
| `studentEmail` | another inbox you control |
| `studentPassword` | leave empty until the email arrives |
| `adminToken` | empty |
| `teacherToken` | empty |
| `studentToken` | empty |
| `teacherId` | empty |
| `studentId` | empty |
| `groupId` | empty |
| `joinCode` | empty |
| `assignmentId` | empty |
| `activeTestSuiteRevisionId` | empty |
| `activeReferenceRevisionId` | empty |
| `practiceExecutionId` | empty |
| `executionId` | empty |
| `submissionId` | empty |
| `updateId` | empty |
| `feedbackId` | empty |

Use `Authorization` → `Bearer Token` with the appropriate variable:

```text
{{adminToken}}
{{teacherToken}}
{{studentToken}}
```

Unless a step explicitly says otherwise, JSON requests use:

```http
Content-Type: application/json
```

## 4. Response envelope

Successful responses use:

```json
{
  "success": true,
  "message": "Operation-specific message",
  "data": {}
}
```

Validation and domain errors use:

```json
{
  "success": false,
  "message": "Error summary",
  "timestamp": "2026-07-26T12:00:00",
  "error": "Optional single error",
  "errors": ["Optional", "validation errors"]
}
```

Resource IDs are normally under `data.id`. Login tokens are under
`data.token`, and the authenticated user is under `data.user`.

## 5. Reusable Postman scripts

### Save a login

Add this to the request's **Tests** tab and change the token variable name when
needed:

```javascript
pm.test("Login succeeded", () => {
  pm.response.to.have.status(200);
  const body = pm.response.json();
  pm.expect(body.success).to.eql(true);
  pm.expect(body.data.token).to.be.a("string");
});

const body = pm.response.json();
pm.environment.set("teacherToken", body.data.token);
pm.environment.set("teacherId", body.data.user.id);
```

### Save a normal resource ID

```javascript
const body = pm.response.json();
pm.expect(body.success).to.eql(true);
pm.environment.set("assignmentId", body.data.id);
```

### Verify a standard error

```javascript
pm.test("Request was rejected", () => {
  pm.expect(pm.response.code).to.be.oneOf([400, 401, 403, 404, 409]);
  const body = pm.response.json();
  pm.expect(body.success).to.eql(false);
});
```

## 6. Multipart requests

Assignment creation and updates use `multipart/form-data`. In Postman:

1. Choose **Body** → **form-data**.
2. Add `metadata` as a **Text** field.
3. Set that part's content type to `application/json`.
4. Add `referenceSolution` as a **File** field when required.
5. Add one `testCaseInputs` **File** row for every test input. Reuse the exact
   same key for all files.
6. Do not manually set the request-level `Content-Type`; Postman must generate
   the multipart boundary.

If the metadata part is sent as plain text instead of `application/json`,
Spring may respond with HTTP `415`.

## 7. Polling asynchronous operations

Use a two-second interval during local testing. Suggested limits:

- Assignment creation: poll `GET /api/assignments/{{assignmentId}}` until
  `data.validationStatus` is `READY` or `FAILED`.
- Assignment update: poll
  `GET /api/assignments/updates/{{updateId}}` until `data.status` is `APPLIED`
  or `REJECTED`.
- Execution: poll `GET /api/execution/check/{{executionId}}` until
  `data.status` is not `PENDING`.

Example Postman assertion:

```javascript
const body = pm.response.json();
pm.expect(body.data.status).to.be.oneOf([
  "PENDING", "AC", "WA", "CE", "RTE", "TLE", "MLE", "OLE"
]);
```

If an operation does not leave its pending state, check:

- Backend and worker logs
- RabbitMQ queues at `http://localhost:15672`
- MinIO availability at `http://localhost:9001`
- Queue names and credentials in both applications

## 8. Test data and repeatability

Ready-to-upload assignment fixtures for C, C++, Java, and Python are available
in [`assignment-examples`](assignment-examples/README.md). Each fixture includes
metadata, a reference solution, and ordered test input files.

The examples use Python because the source and test fixtures are compact.
Create unique user emails and enrollment numbers on every clean run.

Student enrollment numbers must match:

```text
year (1994 or later) + 630 + three digits
```

Examples:

```text
2026630002
```

Teacher and administrator enrollment numbers may contain up to 10 letters,
digits, hyphens, periods, or underscores, for example `TEA-001` or
`ADMIN_01`.

When repeating only assignment scenarios, create a new group or use unique
assignment titles. The APIs use UUIDs, so names do not identify resources.
