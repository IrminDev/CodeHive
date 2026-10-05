#include <iostream>

int main() {
    int n;
    std::cin >> n;
    volatile long long checksum = 0;
    for (int a = 0; a < n; ++a)
        for (int b = 0; b < n; ++b)
            for (int c = 0; c < n; ++c)
                for (int d = 0; d < n; ++d)
                    checksum += (a ^ b ^ c ^ d) & 1;
    std::cout << checksum << '\n';
}
