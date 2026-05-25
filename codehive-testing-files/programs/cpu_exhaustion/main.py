# SECURITY TEST: CPU exhaustion - multi-threaded spin
# Expected: sandbox must enforce CPU quota (cgroup cpu.cfs_quota_us)
import threading
import os

cores = os.cpu_count() or 4

def spin():
    x = 0
    while True:
        x += 1

print(f"Spawning {cores * 4} CPU threads")
threads = [threading.Thread(target=spin, daemon=True) for _ in range(cores * 4)]
for t in threads:
    t.start()
for t in threads:
    t.join()
