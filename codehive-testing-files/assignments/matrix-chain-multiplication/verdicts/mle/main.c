#include <stdlib.h>
#include <string.h>

int main(void) {
    while (1) {
        void *block = malloc(1024 * 1024);
        if (block == NULL) abort();
        memset(block, 1, 1024 * 1024);
    }
}
