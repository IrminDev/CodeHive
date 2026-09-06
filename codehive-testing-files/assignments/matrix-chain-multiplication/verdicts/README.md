# Verdict programs

Each scenario contains Java, Python, C++, and C submission sources.

| Folder | Expected verdict | Behavior |
| --- | --- | --- |
| `ac` | AC | Correct `O(N^3)` interval DP |
| `wa` | WA | Always prints `0`; only smallest test passes |
| `ce` | CE | Intentional syntax/compile error |
| `rte` | RTE | Intentional uncaught runtime failure |
| `tle` | TLE | Correct answer after intentional `O(N^4)` work; performance input exceeds 10 seconds |
| `mle` | MLE | Retains 1 MiB blocks until 128 MB sandbox limit is exceeded |
| `ole` | OLE | Writes indefinitely until shared 8 MB output cap is exceeded |

Use source filename expected by CodeHive:

| Language | File |
| --- | --- |
| Java | `Main.java` |
| Python | `main.py` |
| C++ | `main.cpp` |
| C | `main.c` |

MLE caveat: runtime may terminate itself with allocation error before Docker OOM kill. If that occurs, verdict can be RTE instead of MLE; this exposes worker classification behavior worth recording.

Security warning: TLE, MLE, and OLE files are resource-exhaustion fixtures. Run only inside CodeHive sandbox.
