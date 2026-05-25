// SECURITY TEST: CPU exhaustion - multi-threaded spin
// Expected: sandbox must enforce CPU quota (cgroup cpu.cfs_quota_us)
#include <stdio.h>
#include <pthread.h>
#include <unistd.h>

void *spin(void *arg) {
    volatile long x = 0;
    while (1) x++;
    return NULL;
}

int main() {
    long cores = sysconf(_SC_NPROCESSORS_ONLN);
    int n = (int)(cores * 4);
    printf("Spawning %d CPU threads\n", n);
    pthread_t *threads = __builtin_alloca(n * sizeof(pthread_t));
    for (int i = 0; i < n; i++) {
        pthread_create(&threads[i], NULL, spin, NULL);
    }
    for (int i = 0; i < n; i++) {
        pthread_join(threads[i], NULL);
    }
    return 0;
}
