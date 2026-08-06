// SECURITY TEST: Network egress attempts
// Tests: outbound TCP, DNS resolution
#include <stdio.h>
#include <string.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <unistd.h>

int main() {
    // 1. Raw TCP to 1.1.1.1:80
    printf("=== raw TCP :80 ===\n");
    int fd = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in addr = {
        .sin_family = AF_INET,
        .sin_port = __builtin_bswap16(80),
    };
    inet_pton(AF_INET, "1.1.1.1", &addr.sin_addr);
    if (connect(fd, (struct sockaddr*)&addr, sizeof(addr)) == 0) {
        printf("CONNECTED - raw TCP not blocked\n");
    } else {
        printf("BLOCKED: cannot connect\n");
    }
    close(fd);

    // 2. DNS resolution
    printf("=== DNS resolution ===\n");
    struct hostent *h = gethostbyname("attacker.example.com");
    if (h) {
        printf("RESOLVED - DNS not blocked\n");
    } else {
        printf("BLOCKED: DNS resolution failed\n");
    }

    return 0;
}
