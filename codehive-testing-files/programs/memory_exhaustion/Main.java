// SECURITY TEST: Memory exhaustion
// Expected: sandbox must enforce memory limit (cgroup memory.limit_in_bytes / -Xmx)
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<byte[]> sink = new ArrayList<>();
        while (true) {
            sink.add(new byte[1024 * 1024]); // 1 MB chunks
        }
    }
}
