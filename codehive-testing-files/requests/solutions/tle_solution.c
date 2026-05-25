/*
 * TLE SOLUTION — intentional O(n * k) brute force
 *
 * Instead of maintaining a running sum, this solution recomputes
 * each window from scratch — O(k) per window, O(n*k) total.
 *
 * For N=200000 and K=100000:
 *   iterations ≈ 100000 × 100000 = 10^10  →  far exceeds 1000 ms limit
 *
 * Expected verdict: TLE on test case 5 (large input).
 * Will produce correct output on small test cases (1–4).
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

    long long maxSum = 0;
    int initialized = 0;

    for (int i = 0; i <= n - k; i++) {
        long long sum = 0;
        /* Recompute the full window every time — no sliding */
        for (int j = i; j < i + k; j++) {
            sum += nums[j];
        }
        if (!initialized || sum > maxSum) {
            maxSum = sum;
            initialized = 1;
        }
    }

    printf("%lld\n", maxSum);
    return 0;
}
