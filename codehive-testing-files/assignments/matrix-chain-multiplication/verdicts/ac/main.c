#include <limits.h>
#include <stdio.h>
#include <stdlib.h>

#define DP(table, size, row, column) table[(size_t)(row) * (size) + (column)]

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) return 0;

    long long *dimensions = malloc((size_t)(n + 1) * sizeof(*dimensions));
    long long *dp = calloc((size_t)n * n, sizeof(*dp));
    if (dimensions == NULL || dp == NULL) return 2;
    for (int i = 0; i <= n; ++i) scanf("%lld", &dimensions[i]);

    for (int length = 2; length <= n; ++length) {
        for (int left = 0; left + length <= n; ++left) {
            int right = left + length - 1;
            DP(dp, n, left, right) = LLONG_MAX;
            for (int split = left; split < right; ++split) {
                long long cost = DP(dp, n, left, split) + DP(dp, n, split + 1, right)
                    + dimensions[left] * dimensions[split + 1] * dimensions[right + 1];
                if (cost < DP(dp, n, left, right)) DP(dp, n, left, right) = cost;
            }
        }
    }

    printf("%lld\n", n <= 1 ? 0 : DP(dp, n, 0, n - 1));
    free(dp);
    free(dimensions);
    return 0;
}
