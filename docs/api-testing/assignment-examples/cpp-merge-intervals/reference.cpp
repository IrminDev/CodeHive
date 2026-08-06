#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int count;
    std::cin >> count;

    std::vector<std::pair<long long, long long>> intervals(count);
    for (auto& interval : intervals) {
        std::cin >> interval.first >> interval.second;
    }
    std::sort(intervals.begin(), intervals.end());

    std::vector<std::pair<long long, long long>> merged;
    for (const auto& interval : intervals) {
        if (merged.empty() || interval.first > merged.back().second) {
            merged.push_back(interval);
        } else {
            merged.back().second = std::max(merged.back().second, interval.second);
        }
    }

    std::cout << merged.size() << '\n';
    for (const auto& interval : merged) {
        std::cout << interval.first << ' ' << interval.second << '\n';
    }
    return 0;
}
