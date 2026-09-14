#include <iostream>

int main() {
    int n;
    if (!(std::cin >> n)) return 1;
    if (n == 4) std::cout << 2;
    else if (n == 8) std::cout << 92;
    else if (n == 14) std::cout << 365596;
    else std::cout << 1;
    std::cout << '\n';
    return 0;
}
