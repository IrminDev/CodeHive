/*
 * WA SOLUTION — incorrect initialisation of maxSum
 *
 * Bug: maxSum is initialised to 0 instead of the first window sum.
 * When every possible window has a strictly negative sum, this
 * solution outputs 0 instead of the actual maximum (which is also
 * negative).
 *
 * Affected test cases:
 *   - input3.txt: [-1,-2,-3,-4,-5,-6], K=2 → outputs 0, expected -3
 *
 * All other test cases (positive windows) still pass.
 * Expected verdict: WA.
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

    long long maxSum = 0; /* BUG: should be `window`, not 0 */
    if (window > maxSum) maxSum = window;

    for (int i = k; i < n; i++) {
        window += nums[i] - nums[i - k];
        if (window > maxSum) maxSum = window;
    }

    printf("%lld\n", maxSum);
    return 0;
}
