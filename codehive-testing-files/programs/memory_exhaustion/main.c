// SECURITY TEST: Memory exhaustion via malloc
// Expected: sandbox must enforce memory limit (RLIMIT_AS / cgroup)
#include <stdlib.h>
#include <string.h>

int main() {
    while (1) {
        void *p = malloc(1024 * 1024); // 1 MB chunks
        if (p) memset(p, 0, 1024 * 1024); // force physical page allocation
    }
    return 0;
}
