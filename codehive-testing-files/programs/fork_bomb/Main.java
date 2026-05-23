// SECURITY TEST: Fork bomb via ProcessBuilder
// Expected: sandbox must limit process count (PID namespace / ulimit -u)
import java.io.IOException;

public class Main {
    public static void main(String[] args) throws IOException, InterruptedException {
        while (true) {
            ProcessBuilder pb = new ProcessBuilder("java", "-cp", ".", "Main");
            pb.inheritIO();
            pb.start();
        }
    }
}
