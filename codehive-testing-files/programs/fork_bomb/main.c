// SECURITY TEST: Fork bomb
// Expected: sandbox must limit process count (RLIMIT_NPROC / PID namespace)
#include <unistd.h>

int main() {
    while (1) {
        fork();
    }
    return 0;
}
