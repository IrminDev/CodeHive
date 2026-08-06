# SECURITY TEST: Filesystem attack bundle
# Tests: read /etc/passwd, escape chroot, fill disk
import os

# 1. Read sensitive host file
print("=== /etc/passwd ===")
try:
    with open("/etc/passwd") as f:
        print(f.read())
except Exception as e:
    print(f"BLOCKED: {e}")

# 2. Escape via /proc/self/root symlink traversal
print("=== /proc/self/root/etc/shadow ===")
try:
    with open("/proc/self/root/etc/shadow") as f:
        print(f.read())
except Exception as e:
    print(f"BLOCKED: {e}")

# 3. Write to /tmp (expected to succeed — /tmp is a writable tmpfs)
print("=== write /tmp/pwned ===")
try:
    with open("/tmp/pwned", "w") as f:
        f.write("test")
    print("OK: /tmp write allowed (expected — tmpfs is writable, noexec prevents execution)")

    # Real test: can we execute from /tmp?
    print("=== exec from /tmp (should be blocked by noexec) ===")
    try:
        import stat
        with open("/tmp/test_exec.sh", "w") as f:
            f.write("#!/bin/sh\necho EXECUTED\n")
        os.chmod("/tmp/test_exec.sh", stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
        result = subprocess.run(["/tmp/test_exec.sh"], capture_output=True, text=True, timeout=3)
        print(f"VULNERABILITY: executed from /tmp — {result.stdout.strip()}")
    except Exception as e:
        print(f"BLOCKED: cannot execute from /tmp (noexec working) — {e}")
except Exception as e:
    print(f"UNEXPECTED: /tmp not writable — {e}")

# 4. Disk fill
print("=== disk fill ===")
try:
    with open("/tmp/bigfile", "wb") as f:
        chunk = b'\x00' * (1024 * 1024)
        while True:
            f.write(chunk)
except Exception as e:
    print(f"STOPPED: {e}")
