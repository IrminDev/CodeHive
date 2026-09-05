#include <stdint.h>
#include <stdio.h>

static uint32_t board_mask;

static int64_t count_placements(uint32_t columns, uint32_t diagonals_down,
                                uint32_t diagonals_up) {
    if (columns == board_mask) {
        return 1;
    }

    uint32_t available = board_mask & ~(columns | diagonals_down | diagonals_up);
    int64_t total = 0;
    while (available != 0) {
        uint32_t position = available & (0U - available);
        available -= position;
        total += count_placements(
            columns | position,
            ((diagonals_down | position) << 1) & board_mask,
            (diagonals_up | position) >> 1
        );
    }
    return total;
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) {
        return 1;
    }

    board_mask = (1U << n) - 1U;
    printf("%lld\n", (long long)count_placements(0, 0, 0));
    return 0;
}
