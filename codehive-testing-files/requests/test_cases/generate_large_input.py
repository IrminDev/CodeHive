"""
Generates a large test case that triggers TLE on the O(n*k) brute-force solution.

Parameters:
  N = 200000   (elements)
  K = 100000   (window size)

The brute-force iterates O(n * k) ≈ 10^10 times — far beyond the 1000 ms limit.
The O(n) sliding-window reference solution finishes in < 50 ms.

Expected answer: 100000 (all values are 1, so every window sums to K = 100000).

Usage:
  python generate_large_input.py          # writes to input5_large.txt
  python generate_large_input.py 50000 25000   # custom N and K
"""
import sys

def generate(n: int = 200_000, k: int = 100_000, filename: str = "input5_large.txt"):
    with open(filename, "w") as f:
        f.write(f"{n}\n")
        f.write(" ".join(["1"] * n) + "\n")
        f.write(f"{k}\n")
    print(f"Written {filename}  (N={n}, K={k}, expected answer={k})")

if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 200_000
    k = int(sys.argv[2]) if len(sys.argv) > 2 else 100_000
    generate(n, k)
