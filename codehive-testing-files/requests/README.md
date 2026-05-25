# CodeHive — Testing Files

End-to-end testing materials for the **Maximum Sum of Sliding Window** demo assignment. Covers assignment creation, practice runs, definitive submissions, and the full verdict range (AC, TLE, WA).

---

## Problem Statement

**Maximum Sum of Sliding Window**

Given an array of `N` integers and a window size `K`, find the maximum sum of any contiguous subarray of length exactly `K`.

**Input format**
```
N
a[0] a[1] ... a[N-1]
K
```

**Output format**
```
<maximum sum>
```

**Constraints**
- `1 ≤ N ≤ 200 000`
- `1 ≤ K ≤ N`
- `-10^4 ≤ a[i] ≤ 10^4`

**Assignment limits:** time 1 000 ms · memory 256 MB

---

## Directory Layout

```
requests/
├── README.md                     ← this file
├── solutions/
│   ├── reference_solution.c      ← O(n) sliding window (reference, C)
│   ├── solution.cpp              ← same algorithm in C++
│   ├── solution.py               ← same algorithm in Python
│   ├── Main.java                 ← same algorithm in Java (class Main)
│   ├── tle_solution.c            ← O(n*k) brute-force — triggers TLE
│   └── wa_solution.c             ← max_sum=0 bug — fails all-negative input
├── test_cases/
│   ├── input1.txt                ← sample (visible to students)
│   ├── input2.txt                ← hidden
│   ├── input3.txt                ← hidden — all-negative array
│   ├── input4.txt                ← hidden — single element
│   ├── input5.txt                ← hidden — mixed values
│   └── generate_large_input.py  ← generates N=200000, K=100000 stress input
└── http/
    ├── 01_login.http             ← obtain JWT token
    ├── 02_create_assignment.sh   ← curl multipart upload (teacher)
    ├── 03_practice_ac.http       ← PRACTICE mode, Python AC
    ├── 04_definitive_ac.http     ← DEFINITIVE mode, Java AC
    ├── 05_poll_execution.http    ← poll any execution by ID
    ├── 06_tle_execution.http     ← DEFINITIVE mode, C brute-force TLE
    └── 07_wa_execution.http      ← PRACTICE mode, Python WA (all-negative)
```

---

## Solutions

| File | Language | Algorithm | Expected verdict |
|------|----------|-----------|-----------------|
| `reference_solution.c` | C | O(n) sliding window | AC — used as reference |
| `solution.cpp` | C++ | O(n) sliding window | AC |
| `solution.py` | Python | O(n) sliding window | AC |
| `Main.java` | Java | O(n) sliding window | AC |
| `tle_solution.c` | C | O(n·k) brute-force | TLE on large input |
| `wa_solution.c` | C | Buggy (`maxSum = 0`) | WA on all-negative input |

### Why `tle_solution.c` is slow

The brute-force solution recomputes the sum of each window by iterating over all `k` elements every step. With `N=200 000` and `K=100 000` this is ≈ 10^10 operations — roughly 10 000× over the 1 000 ms budget. The O(n) solution maintains a running sum with a single add and subtract per step.

### Why `wa_solution.c` is wrong

The variable `maxSum` is initialised to `0` rather than to the value of the first window. Any input whose maximum window sum is negative produces output `0` instead of the correct negative value. The all-negative test case (`input3.txt`) exposes this bug:

```
Input:  6 elements  [-1, -2, -3, -4, -5, -6],  k=2
Correct output: -3   (window [-1, -2])
Buggy output:    0
```

---

## Test Cases

| File | N | Array | K | Expected answer | Notes |
|------|---|-------|---|-----------------|-------|
| `input1.txt` | 5 | 1 2 3 4 5 | 2 | **9** | sample — visible to students |
| `input2.txt` | 8 | 2 1 5 1 3 2 6 2 | 3 | **11** | window [3, 2, 6] |
| `input3.txt` | 6 | -1 -2 -3 -4 -5 -6 | 2 | **-3** | all-negative — catches WA bug |
| `input4.txt` | 1 | 7 | 1 | **7** | single-element edge case |
| `input5.txt` | 10 | 3 1 4 1 5 9 2 6 5 3 | 4 | **22** | window [5, 9, 2, 6] |

### Stress / TLE test case

Generate a large input that triggers TLE in the brute-force solution:

```bash
cd test_cases
python generate_large_input.py          # → input5_large.txt  (N=200000, K=100000)
python generate_large_input.py 50000 25000  # custom N and K
```

Expected answer for the default parameters: **100 000** (all values are 1).

To use this as a hidden test case, re-run `02_create_assignment.sh` and add the generated file as an additional `-F "testCaseInputs=@..."` argument.

---

## HTTP Request Files

### Prerequisites

- Backend running at `http://localhost:8080`
- RabbitMQ and MinIO running (default Docker Compose setup)
- A teacher or admin account exists

### Step-by-step workflow

#### 1. Login (`01_login.http`)

Open in VS Code REST Client (or IntelliJ HTTP Client). Send the `POST /api/auth/login` request. Copy the `token` field from the response.

#### 2. Create assignment (`02_create_assignment.sh`)

```bash
cd codehive-testing-files/requests
TOKEN="<your-jwt>" bash http/02_create_assignment.sh
```

The script uploads `reference_solution.c` + all 5 input files in a single `multipart/form-data` request. The server responds with **HTTP 202** and a JSON body containing the assignment `id`. Copy that UUID — you will need it for steps 3–7.

After the request returns, the backend publishes a `TestGenerationJob` to RabbitMQ. The worker compiles the reference solution, runs it against each input, and writes the expected outputs to MinIO. Once all outputs are ready the assignment is activated (`isActive=true`). This normally takes a few seconds; wait for it before sending DEFINITIVE submissions.

#### 3. Practice run — AC (`03_practice_ac.http`)

Set `@token` and `@assignmentId`. Send the request. The server returns **HTTP 202** with an `executionId`. Poll with `05_poll_execution.http`. Expected: both test cases → `AC`.

#### 4. Definitive submission — AC (`04_definitive_ac.http`)

Set `@token` and `@assignmentId`. Send the request. Poll with `05_poll_execution.http`. Expected: all 5 test cases → `AC`.

#### 5. Poll execution (`05_poll_execution.http`)

Set `@token` and `@executionId` (from any previous submission response). Keep sending until `status` leaves `PENDING` / `RUNNING`. The final `COMPLETED` response contains per-test-case verdicts.

#### 6. Definitive submission — TLE (`06_tle_execution.http`)

Triggers TLE on any large hidden test case. All small test cases still pass (brute-force is correct, just slow). Expected: small inputs → `AC`, large input → `TLE`.

#### 7. Practice run — WA (`07_wa_execution.http`)

Two inline test cases are sent. The all-negative one exposes the `max_sum = 0` initialisation bug. Expected: test case 1 → `WA` (got `0`, expected `-3`), test case 2 → `AC`.

---

## Execution Modes

| Mode | `executionType` | Test cases source | Use case |
|------|----------------|-------------------|----------|
| PRACTICE | `"PRACTICE"` | Inline in request body (`testCases` list) | Student exploring the problem |
| DEFINITIVE | `"DEFINITIVE"` | Pre-generated outputs in MinIO | Official graded submission |

In PRACTICE mode the worker fetches the reference solution path from the assignment, runs it on each inline test case, and compares outputs. In DEFINITIVE mode the worker counts the pre-generated test cases and compares student output against stored expected outputs.

---

## Extending the Test Suite

1. Add more `.txt` input files to `test_cases/`.
2. Modify `02_create_assignment.sh` to upload them alongside the existing ones.
3. Adjust `"sampleFlags"` in the metadata JSON to mark which inputs are visible to students (`true`) versus hidden (`false`). The list length must match the number of uploaded test-case files.
