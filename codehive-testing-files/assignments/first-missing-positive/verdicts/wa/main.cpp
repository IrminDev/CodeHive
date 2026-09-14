#include <iostream>

int main() {
    int n;
    if (!(std::cin >> n)) return 1;

    long long missing = 1;
    for (int i = 0; i < n; ++i) {
        long long value;
        std::cin >> value;
        if (value == i + 1) ++missing;
        else if (value > i + 1) break;
    }

    std::cout << missing << '\n';
    return 0;
}
