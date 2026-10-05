# Topological Sort Verdict Fixture

`wa/main.cpp` is intentionally incorrect. It uses a FIFO queue, so it can
produce a valid topological ordering without producing the required
lexicographically smallest ordering.

Run it only as a CodeHive submission through the worker. Expected failure is
`04-priority-choice.in` with output `1 2 4 3 5` instead of `1 2 3 4 5`.
