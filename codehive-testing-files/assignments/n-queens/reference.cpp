#include <cstdint>
#include <iostream>

long long countPlacements(int n, unsigned int columns, unsigned int diagonalsDown,
                          unsigned int diagonalsUp, unsigned int boardMask) {
    if (columns == boardMask) return 1;

    unsigned int available = boardMask & ~(columns | diagonalsDown | diagonalsUp);
    long long total = 0;
    while (available != 0) {
        unsigned int position = available & (~available + 1);
        available -= position;
        total += countPlacements(
            n,
            columns | position,
            ((diagonalsDown | position) << 1) & boardMask,
            (diagonalsUp | position) >> 1,
            boardMask
        );
    }
    return total;
}

int main() {
    int n;
    if (!(std::cin >> n)) return 1;

    const unsigned int boardMask = (1U << n) - 1U;
    std::cout << countPlacements(n, 0, 0, 0, boardMask) << '\n';
    return 0;
}
