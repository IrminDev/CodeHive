#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    int n;
    if (!(std::cin >> n)) return 1;

    std::vector<long long> values(n);
    for (long long& value : values) std::cin >> value;
    std::sort(values.begin(), values.end());

    long long missing = 1;
    for (long long value : values) {
        if (value == missing) ++missing;
        else if (value > missing) break;
    }

    std::cout << missing << '\n';
    return 0;
}
