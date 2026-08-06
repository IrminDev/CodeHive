# SECURITY TEST: Fork bomb
# Expected: sandbox must limit process count (PID namespace / ulimit -u)
import os

while True:
    os.fork()
