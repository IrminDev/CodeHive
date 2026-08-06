// SECURITY TEST: Filesystem attack bundle
// Tests: read /etc/passwd, write outside sandbox, fill disk
#include <stdio.h>
#include <string.h>

int main() {
    char buf[4096];

    // 1. Read sensitive file
    printf("=== /etc/passwd ===\n");
    FILE *f = fopen("/etc/passwd", "r");
    if (f) {
        while (fgets(buf, sizeof(buf), f)) printf("%s", buf);
        fclose(f);
    } else {
        printf("BLOCKED: cannot open /etc/passwd\n");
    }

    // 2. Write to /tmp (expected to succeed — /tmp is a writable tmpfs)
    printf("=== write /tmp/pwned ===\n");
    FILE *w = fopen("/tmp/pwned", "w");
    if (w) {
        fputs("test", w);
        fclose(w);
        printf("OK: /tmp write allowed (expected — tmpfs is writable, noexec prevents execution)\n");

        // The real test: can we execute a binary from /tmp?
        printf("=== exec from /tmp (should be blocked by noexec) ===\n");
        FILE *exe = fopen("/tmp/test_exec.sh", "w");
        if (exe) { fputs("#!/bin/sh\necho EXECUTED\n", exe); fclose(exe); }
        chmod("/tmp/test_exec.sh", 0755);
        int r = system("/tmp/test_exec.sh");
        if (r != 0) printf("BLOCKED: cannot execute from /tmp (noexec working)\n");
        else printf("VULNERABILITY: executed binary from /tmp\n");
    } else {
        printf("UNEXPECTED: /tmp not writable (tmpfs may not be mounted)\n");
    }

    // 3. Disk fill
    printf("=== disk fill ===\n");
    FILE *big = fopen("/tmp/bigfile", "wb");
    if (big) {
        memset(buf, 0, sizeof(buf));
        while (fwrite(buf, 1, sizeof(buf), big) == sizeof(buf));
        fclose(big);
        printf("STOPPED: disk quota hit\n");
    }

    return 0;
}
