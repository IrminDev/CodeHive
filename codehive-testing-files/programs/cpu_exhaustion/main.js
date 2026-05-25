// SECURITY TEST: CPU exhaustion - worker threads spin
// Expected: sandbox must enforce CPU quota (cgroup cpu.cfs_quota_us)
const { Worker, isMainThread, workerData } = require('worker_threads');
const os = require('os');

if (isMainThread) {
    const n = os.cpus().length * 4;
    console.log(`Spawning ${n} CPU worker threads`);
    for (let i = 0; i < n; i++) {
        new Worker(__filename, { workerData: { id: i } });
    }
} else {
    // spin on worker
    let x = 0n;
    while (true) x++;
}
