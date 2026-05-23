# SECURITY TEST: Network egress attempts
# Tests: outbound HTTP, raw socket, DNS resolution
import socket
import urllib.request

# 1. HTTP GET
print("=== HTTP egress ===")
try:
    res = urllib.request.urlopen("http://example.com", timeout=3)
    print(f"CONNECTED - network not blocked, status: {res.status}")
except Exception as e:
    print(f"BLOCKED: {e}")

# 2. Raw TCP
print("=== raw TCP :80 ===")
try:
    s = socket.create_connection(("1.1.1.1", 80), timeout=3)
    s.close()
    print("CONNECTED - raw TCP not blocked")
except Exception as e:
    print(f"BLOCKED: {e}")

# 3. DNS (exfil channel even without full TCP)
print("=== DNS resolution ===")
try:
    addr = socket.gethostbyname("attacker.example.com")
    print(f"RESOLVED: {addr} - DNS not blocked")
except Exception as e:
    print(f"BLOCKED: {e}")
