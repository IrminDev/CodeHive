import sys

values = list(map(int, sys.stdin.buffer.read().split()))
n = values[0]
dimensions = values[1:n + 2]
dp = [[0] * n for _ in range(n)]

for length in range(2, n + 1):
    for left in range(n - length + 1):
        right = left + length - 1
        best = 10**30
        left_dimension = dimensions[left]
        for split in range(left, right):
            cost = (
                dp[left][split]
                + dp[split + 1][right]
                + left_dimension * dimensions[split + 1] * dimensions[right + 1]
            )
            if cost < best:
                best = cost
        dp[left][right] = best

print(0 if n <= 1 else dp[0][n - 1])
