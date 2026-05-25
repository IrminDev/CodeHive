// SECURITY TEST: CPU exhaustion - multi-threaded spin (simulates cryptomining)
// Expected: sandbox must enforce CPU quota (cgroup cpu.cfs_quota_us)
public class Main {
    public static void main(String[] args) throws InterruptedException {
        int cores = Runtime.getRuntime().availableProcessors();
        System.out.println("Spawning " + cores * 4 + " CPU threads");
        for (int i = 0; i < cores * 4; i++) {
            new Thread(() -> {
                long x = 0;
                while (true) x++;
            }).start();
        }
        Thread.currentThread().join(); // block forever
    }
}
