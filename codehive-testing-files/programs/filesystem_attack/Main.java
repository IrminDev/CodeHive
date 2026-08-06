// SECURITY TEST: Filesystem attack bundle
// Tests: read /etc/passwd, write outside sandbox, fill disk
import java.io.*;
import java.nio.file.*;
import java.io.File;

public class Main {
    public static void main(String[] args) throws Exception {
        // 1. Read sensitive host file
        System.out.println("=== /etc/passwd ===");
        try {
            Files.lines(Path.of("/etc/passwd")).forEach(System.out::println);
        } catch (Exception e) {
            System.out.println("BLOCKED: " + e.getMessage());
        }

        // 2. Write to /tmp (expected to succeed — /tmp is a writable tmpfs)
        System.out.println("=== write /tmp/pwned ===");
        try {
            Files.writeString(Path.of("/tmp/pwned"), "test");
            System.out.println("OK: /tmp write allowed (expected — tmpfs is writable, noexec prevents execution)");

            // Real test: can we execute from /tmp?
            System.out.println("=== exec from /tmp (should be blocked by noexec) ===");
            try {
                Files.writeString(Path.of("/tmp/test_exec.sh"), "#!/bin/sh\necho EXECUTED\n");
                new File("/tmp/test_exec.sh").setExecutable(true);
                Process p = new ProcessBuilder("/tmp/test_exec.sh").start();
                String out = new String(p.getInputStream().readAllBytes());
                System.out.println("VULNERABILITY: executed from /tmp — " + out.trim());
            } catch (Exception e) {
                System.out.println("BLOCKED: cannot execute from /tmp (noexec working) — " + e.getMessage());
            }
        } catch (Exception e) {
            System.out.println("UNEXPECTED: /tmp not writable — " + e.getMessage());
        }

        // 3. Disk exhaustion
        System.out.println("=== disk fill ===");
        try (FileOutputStream fos = new FileOutputStream("/tmp/bigfile")) {
            byte[] chunk = new byte[1024 * 1024];
            while (true) {
                fos.write(chunk);
            }
        } catch (Exception e) {
            System.out.println("STOPPED: " + e.getMessage());
        }
    }
}
