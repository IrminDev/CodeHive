# Floating-point division

Self-contained assignment fixture for manually checking `FLOATING_POINT` evaluation.
It separates numeric accuracy from output formatting and includes intentional AC/WA
submissions. Reference solution uses C++; student fixtures use Python.

## Assignment fields

| Field | Value |
| --- | --- |
| Title | Floating-point division |
| Description | Read two integers A and B and print A / B as a floating-point number. Print only the result. |
| Constraints | `-1000000000 <= A <= 1000000000`; `1 <= B <= 10000000000` |
| Reference language | C++ |
| Allowed languages | C++, Python, Java, C |
| Time limit | `1000 ms` |
| Memory limit | `128 MB` |
| Comparator | **Floating point (`FLOATING_POINT`)** |

Input is one line containing `A B`. Output is one numeric token on one line.
For example, input `1 3` produces `0.333333333333333`.

The implemented comparator accepts numeric tokens when
`abs(expected - actual) <= 1e-9`. This is an **absolute**, not relative, tolerance.
Scientific notation is accepted. Nonempty line counts and token counts must match;
extra labels such as `Result:` cause WA. Blank lines and surrounding whitespace are
ignored. Non-numeric tokens must match exactly.

## Files and upload steps

- `reference.cpp`: teacher reference solution; prints 15 digits after the decimal point.
- `inputs/*.in`: six inputs, numbered in upload order.
- `expected/*.out`: reference-generated outputs for inspection; **do not upload these**.
- `verdicts/*/main.py`: student submissions with different output strategies.

1. Create an assignment in an owned, writable group using the fields above.
2. Select C++ as reference language and upload `reference.cpp`.
3. Upload all six input files in numeric order. Mark only `01-sample.in` as sample.
4. Select Floating point comparison and wait until validation is READY.
5. As a student, submit each Python variant against all six definitive tests.
   A practice run covers only whichever inputs you include in that run.

Sample flags: `[true, false, false, false, false, false]`.

| Input | Reference output | Coverage |
| --- | --- | --- |
| `01-sample.in` | `0.333333333333333` | Repeating fraction |
| `02-exact-fraction.in` | `0.125000000000000` | Exactly representable fraction |
| `03-negative.in` | `-0.666666666666667` | Negative result |
| `04-zero.in` | `0.000000000000000` | Zero numerator |
| `05-near-zero.in` | `0.000000000100000` | Small result; zero is within absolute tolerance |
| `06-large-magnitude.in` | `333333333.333333313465118` | Large result; tolerance does not scale with magnitude |

The final reference output exposes binary `double` rounding. Comparison uses parsed
double values, not exact rational arithmetic or decimal-string equality.

## Student variants and expected results

| Submission | Behavior | Overall verdict |
| --- | --- | --- |
| `verdicts/ac-format/main.py` | Scientific notation with 17 decimal places; numerically equivalent to reference | AC, 6/6 |
| `verdicts/ac-within-tolerance/main.py` | Adds `5e-10` and prints 15 decimal places | AC, 6/6 |
| `verdicts/wa-outside-tolerance/main.py` | Adds `1e-6`, exceeding absolute tolerance | WA, 0/6 |
| `verdicts/wa-low-precision/main.py` | Rounds to six decimal places | WA, 3/6 |

At large magnitude the `5e-10` adjustment can round away in binary floating point;
other cases exercise a nonzero permitted difference. These fixtures deliberately
avoid relying on an exactly `1e-9` difference, whose decimal representation can
round just inside or outside the boundary.

Expected per-test verdicts:

| Test | Scientific format | Within tolerance | Outside tolerance | Six decimal places |
| --- | --- | --- | --- | --- |
| 1: repeating fraction | AC | AC | WA | WA |
| 2: exact fraction | AC | AC | WA | AC |
| 3: negative | AC | AC | WA | WA |
| 4: zero | AC | AC | WA | AC |
| 5: near zero | AC | AC | WA | AC |
| 6: large magnitude | AC | AC | WA | WA |

## Exact-match control

Clone this assignment into a second one with **Exact match** comparison. Keep the
same reference and inputs, and submit `verdicts/ac-format/main.py` again. Expect
**WA on all six tests** because scientific and fixed decimal strings differ. This
control confirms that selecting Floating point changes comparison behavior.

## Fixture verification

Reference and all four student variants were executed locally for every input.
The resulting outputs were checked with the real worker `OutputComparatorService`:
24 floating-point comparisons plus six exact-match controls passed their expected
outcomes. This verifies fixture contents; complete browser/queue/sandbox workflow
still requires the manual steps above.
