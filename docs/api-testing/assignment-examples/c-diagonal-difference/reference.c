#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int size;
    if (scanf("%d", &size) != 1) {
        return 1;
    }

    long long primary = 0;
    long long secondary = 0;
    for (int row = 0; row < size; row++) {
        for (int column = 0; column < size; column++) {
            long long value;
            scanf("%lld", &value);
            if (column == row) {
                primary += value;
            }
            if (column == size - 1 - row) {
                secondary += value;
            }
        }
    }

    printf("%lld\n", llabs(primary - secondary));
    return 0;
}
