/*
 * REFERENCE SOLUTION (Professor's)
 * Problem: Maximum Sum of Sliding Window of size K
 *
 * Input:
 *   Line 1: N  (number of elements)
 *   Line 2: N space-separated integers
 *   Line 3: K  (window size)
 * Output:
 *   Maximum sum of any contiguous subarray of length K
 *
 * Strategy: O(n) sliding window — add next element, remove leftmost.
 */
#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);

    int nums[200005];
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);

    int k;
    scanf("%d", &k);

    if (k > n || k <= 0) {
        printf("0\n");
        return 0;
    }

    long long window = 0;
    for (int i = 0; i < k; i++) window += nums[i];

    long long maxSum = window;
    for (int i = k; i < n; i++) {
        window += nums[i] - nums[i - k];
        if (window > maxSum) maxSum = window;
    }

    printf("%lld\n", maxSum);
    return 0;
}
