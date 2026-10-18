# Sandbox manual edge-case test report — template

Template revision: 18 October 2026.

Use this document to report manual tests using
[`codehive-testing-files/programs`](../../codehive-testing-files/programs/).
Copy it into a dated report and replace placeholders with observed evidence. All results
start as `NOT_RUN`; this template does not assert that any program was executed or passed.

## 1. Scope and authorization

Run these programs only through an authorized CodeHive worker sandbox in an isolated test
environment. **Never execute resource-exhaustion or attack fixtures directly on the host.**
Use synthetic accounts/data and a disposable environment without production credentials.
Review network/reverse-connection targets before testing; use only authorized controlled
targets in any adapted fixture and record the exact modifications and source hash.

| Field | Recorded value |
| --- | --- |
| Report ID / date / timezone | `<report-id>; <YYYY-MM-DD>; <timezone>` |
| Tester / reviewer | `<names or internal identifiers>` |
| Authorized deployment and scope | `<environment; approval/reference; permitted targets>` |
| Backend / worker / frontend commit | `<commit hashes>` |
| Fixture repository commit / modifications | `<commit; unchanged or diff reference>` |
| Host OS / kernel / architecture | `<values>` |
| Docker version / cgroup version | `<values; v1 or v2>` |
| Compiler / runtime image tags and immutable digests | `<per language; do not rely on latest tag alone>` |
| Seccomp profile hash and loaded state | `<hash; verified configuration; evidence reference>` |
| Worker concurrency / infrastructure versions | `<worker concurrency; queue/database/object-store versions>` |
| Test group / assignment / synthetic student | `<IDs or pseudonyms>` |
| Modes and repetitions planned | `<PRACTICE / DEFINITIVE; repeats per case/language/mode>` |
| Monitoring and stop conditions | `<host limits; queue/worker health; authorized abort procedure>` |
| Evidence location and access | `<restricted folder; redaction rules>` |

Purpose: `<verdict classification / resource containment / filesystem isolation / network isolation / regression verification>`.
Out of scope: `<unavailable runtimes, untested controls, deployment-specific exclusions>`.

## 2. Establish a valid baseline

1. Verify backend, worker, database, queue, object storage, and required runtime images are
   available. A worker outage or missing image is not a successful sandbox-blocking result.
2. Use a writable test group, active enrollment, and a published, READY, non-closed assignment.
   Allow the selected submission language. Preserve the assignment's ID and test-suite revision.
3. For `verdicts/*` and containment probes, use a harmless reference from
   [`verdicts/ac`](../../codehive-testing-files/programs/verdicts/ac/) that prints `OK`.
   Use a small input and expected output `OK\n`, with the configured comparator recorded.
   Upload hazardous fixtures as **student code**, not as the assignment's reference solution.
4. For [`programs/1/Main.java`](../../codehive-testing-files/programs/1/Main.java), use the
   sliding-window assignment instead: [sample input](../../codehive-testing-files/testcases/1/tc1.in)
   has expected [output `9`](../../codehive-testing-files/testcases/1/tc1.out). This program is
   not an `OK`-printing fixture and cannot use that oracle.
5. Start with one test case and one execution at a time. Run the AC control before and after
   each disruptive case. Increase concurrency or test count only as a separately documented
   authorized stress scenario with a defined stop threshold.
6. Test PRACTICE and DEFINITIVE separately when in scope. Practice runs the reference against
   supplied input; definitive uses stored expected output. Withdraw an existing definitive
   submission, or use a fresh synthetic student/assignment, when required before resubmitting.
7. Record the execution ID from submission, then poll until its verdict leaves `PENDING`.
   Save status and report evidence before artifact expiry. Record queue/compile time separately
   from reported per-test execution time; elapsed request time is not the execution budget.

Supported worker languages are `JAVA`, `PYTHON`, `C`, and `CPP`. The six `main.js` files
in the attack families are **unsupported fixtures**, not successful security tests. Mark
them `N/A — unsupported runtime`; do not relabel them as another language. C++ variants
exist under `verdicts/*`, but the attack-family directories do not contain C++ sources.

## 3. Record requested and effective limits

The following values reflect the inspected worker source, not measurements from a deployment.
Verify the actual running container and source revision. Older README examples/comments may
differ from enforced settings; record discrepancies rather than silently using their values.

| Control | Source baseline / evidence to record | Effective value / evidence |
| --- | --- | --- |
| Per-test time | Worker clamps requested time to 100–10,000 ms. Record original and effective values. | `<requested; effective; timeout evidence>` |
| Runtime memory | Worker clamps requested memory to 16–1,000 units of 1,048,576 bytes. | `<requested; bytes; MiB>` |
| Runtime CPU | `CpuQuota=50000`; record actual `CpuPeriod` and/or cgroup `cpu.max`. Do not infer “one core” from a comment. | `<quota; period; observed throttling>` |
| Process/thread ceiling | Current executors: Java/Python 16 PIDs; C/C++ 8 PIDs. Include runtime/helper threads in interpretation. | `<PidsLimit; peak/current PIDs; rejection evidence>` |
| Output capture | Combined stdout + stderr cap: 8,388,608 bytes. Displayed output may include a truncation notice. | `<captured bytes; truncation; verdict>` |
| Root and workspace | Root filesystem read-only; runtime `/workspace` bind read-only. Compilation workspace is writable. | `<ReadonlyRootfs; relevant bind modes>` |
| Temporary storage | Runtime `/tmp`: 32 MiB; `/run`: 8 MiB; both `noexec,nosuid`. | `<mount options; capacity; failure evidence>` |
| File size / open descriptors | Runtime file-size limit 32 MiB; open-descriptor limit 256. | `<effective ulimits>` |
| Network | Container network mode `none`. | `<NetworkMode; independent connectivity evidence>` |
| Privilege | User `nobody`, all capabilities dropped, `no-new-privileges`, loaded seccomp profile. | `<user/UID; capabilities; security options>` |
| Compilation isolation | Separate container: 512 MiB memory, isolated network/root, bounded diagnostics. | `<compile image/settings/result>` |
| Cases per job | Worker cap: 50. A one-case probe does not verify this cap. | `<tested count or NOT_TESTED>` |

The fixture [verdict README](../../codehive-testing-files/programs/verdicts/README.md)
suggests 15,000 ms for MLE and 60,000 ms for OLE. The current worker clamps both to
10,000 ms, and the API may reject unsupported values before dispatch. Use accepted settings
and record the effective budget. If a slow fixture hits TLE before memory/output exhaustion,
the intended MLE/OLE path is **inconclusive**, not proven safe by the timeout alone.

Source traceability:
[limits](../../codehive-worker/src/main/java/com/github/codehive/worker/sandbox/SandboxConstants.java),
[container execution/classification](../../codehive-worker/src/main/java/com/github/codehive/worker/sandbox/AbstractLanguageExecutor.java),
[memory telemetry](../../codehive-worker/src/main/java/com/github/codehive/worker/sandbox/ContainerMemoryTracker.java),
[language registry](../../codehive-worker/src/main/java/com/github/codehive/worker/model/enums/Language.java),
[seccomp profile](../../codehive-worker/src/main/resources/seccomp/sandbox-profile.json).

## 4. Fixture catalog and expected observations

Directory links identify the exact source variants. Use `Main.java`, `main.py`, `main.c`,
and, only where present, `main.cpp`. Create one result row for each language/mode/repetition.
The expected verdict and the expected containment property are separate acceptance criteria.

| Case | Fixture | Languages | Expected verdict / setup | Required containment or functional evidence |
| --- | --- | --- | --- | --- |
| SBX-00 | [1/Main.java](../../codehive-testing-files/programs/1/Main.java) | Java | AC with the sliding-window input/oracle described above. | Correct output `9`; functioning compile/run pipeline and telemetry. |
| SBX-01 | [verdicts/ac](../../codehive-testing-files/programs/verdicts/ac/) | Java/Python/C/C++ | AC; expected `OK\n`. | Correct output and normal cleanup. |
| SBX-02 | [verdicts/wa](../../codehive-testing-files/programs/verdicts/wa/) | Java/Python/C/C++ | WA against `OK\n`; program prints `WRONG`. | Normal execution distinguished from a comparison failure. |
| SBX-03 | [verdicts/ce](../../codehive-testing-files/programs/verdicts/ce/) | Java/Python/C/C++ | CE, including Python syntax failure. | Compilation/preflight diagnostics; program does not reach normal execution. |
| SBX-04 | [verdicts/rte](../../codehive-testing-files/programs/verdicts/rte/) | Java/Python/C/C++ | RTE intended; preserve actual exception/signal/exit status. | Worker remains healthy; diagnostics are bounded. C division by zero has compiler-dependent undefined behavior; document a mismatch rather than assuming a trap. |
| SBX-05 | [verdicts/tle](../../codehive-testing-files/programs/verdicts/tle/) | Java/Python/C/C++ | TLE; start with 1,000 ms per test. | Execution terminated near its effective budget; no surviving child processes. |
| SBX-06 | [verdicts/mle](../../codehive-testing-files/programs/verdicts/mle/) | Java/Python/C/C++ | MLE intended; start with 64 MiB and an accepted time budget. | Allocation/OOM evidence, bounded memory, correct classification, host recovery. If runtime cannot start or TLE occurs first, intended path is inconclusive. |
| SBX-07 | [verdicts/ole](../../codehive-testing-files/programs/verdicts/ole/) | Java/Python/C/C++ | OLE intended; start with 128 MiB and at most 10,000 ms. | Output cap/truncation observed without unbounded worker memory/log growth. TLE before reaching cap is inconclusive for OLE. |
| SBX-08 | [infinite_loop](../../codehive-testing-files/programs/infinite_loop/) | Java/Python/C | TLE intended. | Wall-time enforcement, cleanup, and post-run AC control. |
| SBX-09 | [cpu_exhaustion](../../codehive-testing-files/programs/cpu_exhaustion/) | Java/Python/C | Usually TLE, or an earlier thread/resource failure. | CPU quota/throttling and bounded PIDs; host and worker remain responsive. A PID failure alone does not verify CPU throttling. |
| SBX-10 | [memory_exhaustion](../../codehive-testing-files/programs/memory_exhaustion/) | Java/Python/C | MLE intended; classify any earlier failure separately. | Actual memory ceiling/OOM signal, not merely a nonzero exit. Native allocation failure can continue looping and end in TLE. |
| SBX-11 | [stack_overflow](../../codehive-testing-files/programs/stack_overflow/) | Java/Python/C | RTE intended; runtime/compiler can produce MLE or TLE first. | Student recursion cannot crash the worker/host; capture stack error, signal, or memory failure and cleanup. |
| SBX-12 | [fork_bomb](../../codehive-testing-files/programs/fork_bomb/) | Java/Python/C | TLE/RTE/MLE may vary; no single verdict proves containment. | Enforced PID ceiling, bounded host load, rejected child creation, and no surviving descendants. |
| SBX-13 | [network_access](../../codehive-testing-files/programs/network_access/) | Java/Python/C | May finish with WA because probes print diagnostics rather than `OK`. | No HTTP/TCP/DNS egress; corroborate with container network config and a controlled reachable target. DNS failure alone is insufficient. |
| SBX-14 | [filesystem_attack](../../codehive-testing-files/programs/filesystem_attack/) | Java/Python/C | WA/RTE/TLE can occur; first verify fixture compiles and reaches each probe. | Container-only reads, expected writable `/tmp`, blocked direct execution from noexec storage, bounded file growth, no host writes, cleanup. |
| SBX-15 | [jailbreak](../../codehive-testing-files/programs/jailbreak/) | Java/Python/C | A completed probe can legitimately return WA; inspect every sub-probe. | Non-root identity, no host secrets/Docker socket access, no unauthorized egress, no privilege or namespace escape. Child processes confined inside the container are not themselves a host escape. |

### Fixture limitations that must appear in the report

- `filesystem_attack/main.py` calls `subprocess.run` without importing `subprocess`. Its
  `NameError` is caught and printed as `BLOCKED`; that is **not proof of noexec enforcement**.
  Mark that sub-probe inconclusive, or test a clearly recorded corrected copy separately.
- `filesystem_attack/main.c` calls `chmod` and `system` without their required declarations.
  Depending on compiler settings it may fail before execution. A CE is not evidence of
  filesystem isolation. Do not silently fix the source and label it an unchanged fixture.
- Reading the container's `/etc/passwd` or using `/proc/self/root` does not by itself access
  the host. Compare evidence with container mounts/namespaces; do not assume path names prove
  escape. Successful `/tmp` writes are expected and must not be classified as vulnerabilities.
- A noexec mount prevents direct execution from that mount; it does not universally prohibit
  an already-running interpreter from reading a script. Record exactly which operation ran.
- Missing shells, missing tools, unresolved fixture domains, thread-start failures, and
  caught exceptions can prevent a probe from reaching its intended boundary. Literal
  `BLOCKED`/`VULNERABILITY` strings are fixture output, not authoritative security verdicts.
- `cpu_exhaustion/main.c` uses pthreads while the configured C compile command does not
  explicitly add `-pthread`. Record toolchain behavior and any separately adapted fixture.
- Original network/jailbreak probes include external/example targets. A failed connection
  to an unavailable target is inconclusive for network isolation; do not establish a real
  reverse connection or contact an unauthorized endpoint to obtain a “passing” result.

## 5. Execution and evidence procedure

1. Record source path, source SHA-256, compiler/runtime, input, comparator, and requested
   limits. Run the matching AC baseline. Never run the source on the host to “check it first.”
2. Submit through the student UI or the documented API flow, preserving execution ID,
   assignment revision, selected language, execution mode, and timestamps. A rejected API
   request is an admission-control result, not a sandbox execution.
3. Capture effective container configuration while the relevant compile/run container
   exists. Collect only necessary Docker/cgroup fields: mounts, UID, capabilities, security
   options, network mode, memory/swap, CPU quota/period, PIDs, ulimits, and temporary storage.
   Do not dump environment secrets or publish host paths and credentials in an open report.
4. Preserve status from `GET /api/execution/check/{executionId}` and the authorized report
   from `GET /api/execution/check/{executionId}/report`. Save overall and per-case verdicts,
   exit codes, bounded stderr/compiler output, elapsed time, and memory when available.
   Definitive student views intentionally hide private expected output/stdout; use approved
   operator evidence for isolation probes instead of bypassing that visibility restriction.
5. For resource cases capture baseline/peak/post-run worker and host memory, CPU, PID count,
   temporary storage, queue backlog, and service responsiveness. Define thresholds before
   the run; record actual observations rather than inferring health from a final verdict.
6. Confirm execution/compile containers, child processes, and temporary workspaces are
   cleaned up. Run AC again and verify a healthy result. An orphaned process or worker outage
   is a failure even when the student verdict is TLE/MLE/OLE.
7. Repeat with a new execution ID and preserve every attempt, including inconsistent ones.
   Record interruption, missing artifacts, or unobserved sub-probes as inconclusive.

Time interpretation: the configured limit is per test; total latency includes queueing,
compilation, reference runs, and multiple test cases. Record any timeout grace separately.
Memory interpretation: use MiB for values divided by 1,048,576, distinguish per-test peak,
session/container peak, and host process usage, and preserve missing telemetry as `null` or
unavailable. A runtime heap limit is not the same as the total cgroup memory budget.
Exit 137 alone is not independent proof of an OOM kill; preserve cgroup/OOM and kill evidence.

## 6. Results matrix

Duplicate rows for every case/language/mode/repetition. Rows below are placeholders only.

| Run ID | Case | Source / hash | Language / mode | Repeat | Execution ID | Expected / actual verdict | Containment | Cleanup / post-AC | Overall | Evidence |
| --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| `<run-id>` | SBX-01 | `<path; sha256>` | `<JAVA/PYTHON/C/CPP; PRACTICE/DEFINITIVE>` | 1 | `<id>` | `AC / <observed>` | NOT_RUN | NOT_RUN | NOT_RUN | `<references>` |
| `<run-id>` | SBX-12 | `<path; sha256>` | `<language; mode>` | 1 | `<id>` | `<predefined / observed>` | NOT_RUN | NOT_RUN | NOT_RUN | `<references>` |

Use `PASS`, `FAIL`, `INCONCLUSIVE`, `NOT_RUN`, or `N/A` per criterion. N/A requires a
reason, such as unsupported JavaScript. A wrong verdict with proven containment is a
classification failure, not necessarily an isolation failure; a matched verdict without
containment evidence cannot establish a security pass. Overall PASS requires all mandatory
criteria for that run to pass. Any mandatory failure takes precedence over inconclusive fields.

## 7. Per-run record — duplicate this section

### Run `<run-id>` — `<case-id: title>`

| Field | Recorded value |
| --- | --- |
| Date/time and observer | `<values>` |
| Exact source / commit / SHA-256 | `<values; modified-copy diff if applicable>` |
| Language / compiler/runtime image digest | `<values>` |
| Assignment / test-suite / reference revision | `<IDs>` |
| Mode / test input / comparator / expected output | `<fixture references; no private data in a public report>` |
| Student / submission / execution ID | `<synthetic IDs; submission N/A for practice>` |
| Requested / accepted / effective limits | `<time, memory, PIDs, CPU, output, file limits>` |
| Start / finish / total wall time | `<timestamps; include timeout grace and queue delay separately>` |
| Expected verdict and rationale fixed before run | `<values>` |
| Actual overall / per-test verdicts | `<values>` |
| Exit code / signal / compiler diagnostic | `<exact evidence; unknown if not observed>` |
| Stdout / stderr / output byte count | `<bounded evidence reference; truncation state>` |
| Reported memory / independent container peak | `<MiB; measurement source; missing values>` |
| Host/worker baseline / peak / post-run resource use | `<CPU, memory, PIDs, storage, queue health>` |
| Effective isolation config | `<Docker/cgroup/mount/seccomp evidence>` |
| Boundary actually reached | `<probe-by-probe observation; compilation/runtime failures>` |
| Cleanup and post-run AC execution | `<container/process/workspace checks; follow-up execution ID>` |

Expected behavior: `<verdict criterion and independent containment criteria>`.

Observed behavior: `<precise narrative; distinguish fixture messages from independent evidence>`.

| Criterion | Verdict | Evidence and rationale |
| --- | --- | --- |
| Valid fixture reached intended test path | NOT_RUN | `<reference>` |
| Functional/verdict correctness | NOT_RUN | `<reference>` |
| Resource or isolation property under test | NOT_RUN | `<reference>` |
| Diagnostics/telemetry correctness | NOT_RUN | `<reference>` |
| Cleanup / worker and host recovery | NOT_RUN | `<reference>` |
| Overall | NOT_RUN | `<derived from required criteria>` |

Finding category: `<CLASSIFICATION / RESOURCE_ESCAPE / NETWORK_EGRESS / FILESYSTEM_ESCAPE / PRIVILEGE_ESCAPE / ORPHAN_PROCESS / TELEMETRY / FIXTURE_DEFECT / INFRASTRUCTURE / NONE>`.

Severity and impact: `<severity; affected scope; observed impact, not hypothetical success>`.
Reproducibility: `<failed runs / valid runs; related execution IDs>`.
Issue / owner / remediation: `<references or pending>`.
Retest build / date / run ID / outcome: `<values or NOT_RUN>`.

Evidence attachments:

- `<sanitized submission/status/report JSON>`
- `<screenshots and relevant bounded stdout/stderr>`
- `<container configuration and cgroup measurements>`
- `<host/worker health before, during, and after; cleanup confirmation>`
- `<source/input hashes and changes; baseline and post-run AC results>`

## 8. Consolidated assessment

| Metric | Value / method |
| --- | --- |
| Planned / executed / valid / inconclusive / not-run runs | `<counts; each language/mode/repetition counts separately>` |
| Unsupported or excluded cases | `<count and reasons; do not count as passed>` |
| Expected verdict matches / valid verdict runs | `<numerator / denominator; N/A if zero>` |
| Proven containment passes / valid containment runs | `<numerator / denominator; list unverified controls>` |
| Classification failures / isolation failures | `<separate counts and run references>` |
| Cleanup failures / infrastructure failures / fixture defects | `<separate counts and references>` |
| Largest observed time / memory / output / PID measurements | `<values, units, method, and associated runs>` |
| Positive baseline failures before or after a probe | `<count and affected runs>` |
| Open findings / remaining retests | `<issue IDs and owners>` |

Conclusion: `<what the evidence establishes for this build, runtime images, and configuration>`.
Decision: `<accepted / accepted with conditions / blocked; responsible reviewer and rationale>`.
Next checks: `<remaining cases and explicit coverage gaps>`.

These fixtures do not establish universal sandbox-escape resistance or verify every
syscall, namespace, file-descriptor, source/input-size, or test-count boundary. Record
untested properties explicitly. A successful code-verdict matrix does not prove host
isolation, and a single contained attack does not validate every runtime or deployment.

## 9. Evidence index

| Artifact ID | Run ID | Description | Timestamp / hash | Restricted location | Redactions |
| --- | --- | --- | --- | --- | --- |
| `<artifact-id>` | `<run-id>` | `<status/report/config/metrics/source/screenshot>` | `<values>` | `<path or internal link>` | `<removed credentials/private content or none>` |
