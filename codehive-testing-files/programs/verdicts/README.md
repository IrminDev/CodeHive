# Sandbox verdict fixtures

Small source files for checking every CodeHive execution verdict in each supported language.

| Directory | Expected verdict | Run settings |
| --- | --- | --- |
| `ac` | AC | expected output `OK` |
| `wa` | WA | expected output `OK` |
| `ce` | CE | compile/syntax failure |
| `rte` | RTE | runtime failure |
| `tle` | TLE | 1,000 ms time limit |
| `mle` | MLE | 64 MB memory limit, 15,000 ms time limit |
| `ole` | OLE | 60,000 ms time limit, 128 MB memory limit |

Each directory has `Main.java`, `main.py`, `main.c`, and `main.cpp`. Run only through
CodeHive worker sandbox. Never run TLE, MLE, or OLE fixtures directly on host.

`MLE` needs Docker OOM exit code 137. Runtime/image behavior can return `RTE` first for a
language runtime that fails before cgroup kills process; record actual status in regression test.
