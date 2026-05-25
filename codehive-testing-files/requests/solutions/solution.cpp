/*
 * CORRECT SOLUTION — C++
 * Same sliding window logic as the C reference solution.
 */
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;

    vector<long long> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    int k;
    cin >> k;

    if (k > n || k <= 0) {
        cout << 0 << endl;
        return 0;
    }

    long long window = 0;
    for (int i = 0; i < k; i++) window += nums[i];

    long long maxSum = window;
    for (int i = k; i < n; i++) {
        window += nums[i] - nums[i - k];
        if (window > maxSum) maxSum = window;
    }

    cout << maxSum << endl;
    return 0;
}
