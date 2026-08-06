// SECURITY TEST: Memory exhaustion
// Expected: sandbox must enforce memory limit (--max-old-space-size / cgroup)
const chunks = [];
while (true) {
    chunks.push(Buffer.alloc(1024 * 1024)); // 1 MB chunks
}
