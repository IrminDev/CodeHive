# Shortest Path with One Discount

Ready-to-upload assignment fixture. Reference solution uses C++; students may submit C++, Java, Python, or C.

## Structure

```text
cpp-shortest-path-discount/
├── metadata.json              # multipart `metadata` field
├── reference.cpp              # multipart `referenceSolution` file
├── inputs/
│   ├── 01-sample.in           # public example (`sampleFlags[0]`)
│   ├── 02.in                  # parallel edges + coupon on weight 1
│   ├── 03.in                  # unreachable destination
│   └── 04.in                  # discounted cost becomes 0
└── create-assignment.sh       # multipart request
```

## Create

Start backend, worker, RabbitMQ, and MinIO. Run from this directory:

```bash
TOKEN="<teacher-jwt>" GROUP_ID="<owned-active-group-uuid>" bash create-assignment.sh
```

Request sends multipart parts in this exact order:

| Part | Source |
| --- | --- |
| `metadata` | `metadata.json`, with placeholder group ID replaced |
| `referenceSolution` | `reference.cpp` |
| `testCaseInputs` | `inputs/01-sample.in`, `02.in`, `03.in`, `04.in` |

Response should be HTTP `202`. Poll assignment until validation status changes from `PROCESSING` to `READY`.

For Create Assignment UI: choose group, copy matching metadata fields, upload `reference.cpp`, then upload inputs in numeric order. Mark only first input as visible.
