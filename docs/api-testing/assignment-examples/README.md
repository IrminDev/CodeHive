# Assignment creation examples

This directory contains four different assignments for testing the complete
assignment-creation and worker-validation flow. Each example has:

- `metadata.json`: the JSON value for the multipart `metadata` part.
- `reference.*`: the reference solution uploaded as `referenceSolution`.
- `inputs/*.in`: test inputs uploaded as repeated `testCaseInputs` parts, in
  filename order.

Before sending a request, replace the placeholder `groupId` in `metadata.json`
with the UUID of a writable group owned by the authenticated teacher.

## Examples

| Directory | Language | Exercise |
|---|---|---|
| `c-diagonal-difference` | C | Absolute difference between matrix diagonals |
| `cpp-merge-intervals` | C++ | Merge overlapping integer intervals |
| `java-balanced-brackets` | Java | Validate balanced bracket sequences |
| `python-run-length-encoding` | Python | Run-length encode a lowercase string |
| `cpp-shortest-path-discount` | C++ | Dijkstra shortest path with one discounted edge |

`cpp-shortest-path-discount/create-assignment.sh` is a complete multipart creation
request. Supply `TOKEN` and `GROUP_ID`; it uploads metadata, reference source, and
ordered test inputs.

## Postman

Create a `POST {{baseUrl}}/api/assignments` request with the teacher token.
Under **Body → form-data**, add:

| Key | Type | Value |
|---|---|---|
| `metadata` | Text (`application/json`) | Contents of the selected `metadata.json` |
| `referenceSolution` | File | The selected `reference.*` file |
| `testCaseInputs` | File | `inputs/01-sample.in` |
| `testCaseInputs` | File | Every remaining `.in` file, in numeric order |

Do not manually set the request-level `Content-Type`; Postman must generate the
multipart boundary. The order of `sampleFlags` in the metadata corresponds to
the order of the uploaded input files.

## cURL template

Run this from the selected example directory after replacing the variables:

```bash
curl --request POST '{{baseUrl}}/api/assignments' \
  --header 'Authorization: Bearer {{teacherToken}}' \
  --form 'metadata=<metadata.json;type=application/json' \
  --form 'referenceSolution=@reference.py' \
  --form 'testCaseInputs=@inputs/01-sample.in' \
  --form 'testCaseInputs=@inputs/02.in' \
  --form 'testCaseInputs=@inputs/03.in'
```

Change the reference filename to `reference.c`, `reference.cpp`, or
`Main.java` for the other examples.

Expected creation response: HTTP `202` with
`data.validationStatus = "PROCESSING"`. Poll
`GET /api/assignments/{assignmentId}` until the status becomes `READY` or
`FAILED`.
