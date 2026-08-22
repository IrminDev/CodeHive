#include <algorithm>
#include <iostream>
#include <limits>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int matrixCount;
    if (!(std::cin >> matrixCount)) return 0;

    std::vector<long long> dimensions(matrixCount + 1);
    for (long long& dimension : dimensions) std::cin >> dimension;

    std::vector<std::vector<long long>> dp(
        matrixCount,
        std::vector<long long>(matrixCount, 0)
    );

    for (int length = 2; length <= matrixCount; ++length) {
        for (int left = 0; left + length <= matrixCount; ++left) {
            int right = left + length - 1;
            dp[left][right] = std::numeric_limits<long long>::max();
            for (int split = left; split < right; ++split) {
                long long cost = dp[left][split]
                    + dp[split + 1][right]
                    + dimensions[left] * dimensions[split + 1] * dimensions[right + 1];
                dp[left][right] = std::min(dp[left][right], cost);
            }
        }
    }

    std::cout << (matrixCount <= 1 ? 0 : dp[0][matrixCount - 1]) << '\n';
    return 0;
}
