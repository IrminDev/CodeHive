// SECURITY TEST: Stack overflow via infinite recursion
// Expected: RangeError: Maximum call stack size exceeded
function recurse(depth) {
    return recurse(depth + 1);
}

recurse(0);
