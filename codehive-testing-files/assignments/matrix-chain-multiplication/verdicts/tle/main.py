import sys

n = int(sys.stdin.buffer.readline())
checksum = 0
for a in range(n):
    for b in range(n):
        for c in range(n):
            for d in range(n):
                checksum += (a ^ b ^ c ^ d) & 1
print(checksum)
