// SECURITY TEST: Stack overflow via infinite recursion
// Expected: SIGSEGV / stack guard triggers; process killed by sandbox
void recurse(long depth) {
    recurse(depth + 1);
}

int main() {
    recurse(0);
    return 0;
}
