# SECURITY TEST: Stack overflow via infinite recursion
# Expected: RecursionError; sandbox must not crash interpreter host
import sys
sys.setrecursionlimit(10**9)  # attempt to raise limit before blowing stack

def recurse(depth):
    return recurse(depth + 1)

recurse(0)
