// SECURITY TEST: Infinite loop - CPU spin
// Expected: sandbox must enforce wall-clock / CPU time limit (RLIMIT_CPU)
int main() {
    volatile long x = 0;
    while (1) {
        x++;
    }
    return 0;
}
