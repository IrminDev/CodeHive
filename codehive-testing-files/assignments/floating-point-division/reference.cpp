#include <iomanip>
#include <iostream>

int main() {
    double numerator, denominator;
    if (!(std::cin >> numerator >> denominator) || denominator == 0) return 1;
    std::cout << std::fixed << std::setprecision(15)
              << numerator / denominator << '\n';
    return 0;
}
