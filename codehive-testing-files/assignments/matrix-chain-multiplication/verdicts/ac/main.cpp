#include <algorithm>
#include <iostream>
#include <limits>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n;
    std::cin >> n;
    std::vector<long long> dimensions(n + 1);
    for (long long& value : dimensions) std::cin >> value;
    std::vector<std::vector<long long>> dp(n, std::vector<long long>(n));

    for (int length = 2; length <= n; ++length) {
        for (int left = 0; left + length <= n; ++left) {
            int right = left + length - 1;
            dp[left][right] = std::numeric_limits<long long>::max();
            for (int split = left; split < right; ++split) {
                long long cost = dp[left][split] + dp[split + 1][right]
                    + dimensions[left] * dimensions[split + 1] * dimensions[right + 1];
                dp[left][right] = std::min(dp[left][right], cost);
            }
        }
    }
    std::cout << (n <= 1 ? 0 : dp[0][n - 1]) << '\n';
}
