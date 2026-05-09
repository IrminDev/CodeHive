# CORRECT SOLUTION — Python
# Same sliding window logic as the C reference solution.

import sys

def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    nums = [int(data[i + 1]) for i in range(n)]
    k = int(data[n + 1])

    if k > n or k <= 0:
        print(0)
        return

    window = sum(nums[:k])
    max_sum = window

    for i in range(k, n):
        window += nums[i] - nums[i - k]
        if window > max_sum:
            max_sum = window

    print(max_sum)

main()
