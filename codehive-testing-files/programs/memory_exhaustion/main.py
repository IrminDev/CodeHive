# SECURITY TEST: Memory exhaustion
# Expected: sandbox must enforce memory limit (cgroup / ulimit -v)
sink = []
while True:
    sink.append(b'\x00' * (1024 * 1024))  # 1 MB chunks
