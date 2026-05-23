// SECURITY TEST: Jailbreak via system() / execve
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main() {
    // 1. system() shell call
    printf("=== system whoami ===\n");
    int r = system("whoami");
    if (r != 0) printf("BLOCKED or failed: exit %d\n", r);

    // 2. execve direct (bypasses PATH restrictions)
    printf("=== execve /usr/bin/id ===\n");
    char *argv[] = {"/usr/bin/id", NULL};
    char *envp[] = {NULL};
    pid_t pid = fork();
    if (pid == 0) {
        execve("/usr/bin/id", argv, envp);
        perror("BLOCKED");
        _exit(1);
    }

    // 3. Read /etc/shadow via fopen
    printf("=== /etc/shadow ===\n");
    FILE *f = fopen("/etc/shadow", "r");
    if (f) {
        char buf[256];
        while (fgets(buf, sizeof(buf), f)) printf("%s", buf);
        fclose(f);
    } else {
        printf("BLOCKED: cannot open /etc/shadow\n");
    }

    return 0;
}
