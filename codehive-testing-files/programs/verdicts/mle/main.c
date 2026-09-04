#include <stdlib.h>
#include <string.h>
int main(void) { for (;;) { void *block = malloc(1024 * 1024); if (block == NULL) return 2; memset(block, 0, 1024 * 1024); } }
