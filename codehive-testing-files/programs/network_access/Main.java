// SECURITY TEST: Network egress attempts
// Tests: outbound HTTP, raw socket, DNS resolution
import java.net.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        // 1. HTTP GET to external host
        System.out.println("=== HTTP egress ===");
        try {
            URL url = new URL("http://example.com");
            HttpURLConnection con = (HttpURLConnection) url.openConnection();
            con.setConnectTimeout(3000);
            con.connect();
            System.out.println("CONNECTED - network not blocked, status: " + con.getResponseCode());
        } catch (Exception e) {
            System.out.println("BLOCKED: " + e.getMessage());
        }

        // 2. Raw TCP to known external host
        System.out.println("=== raw TCP :80 ===");
        try (Socket s = new Socket()) {
            s.connect(new InetSocketAddress("1.1.1.1", 80), 3000);
            System.out.println("CONNECTED - raw TCP not blocked");
        } catch (Exception e) {
            System.out.println("BLOCKED: " + e.getMessage());
        }

        // 3. DNS resolution (can exfiltrate via DNS even without TCP)
        System.out.println("=== DNS resolution ===");
        try {
            InetAddress addr = InetAddress.getByName("attacker.example.com");
            System.out.println("RESOLVED: " + addr.getHostAddress() + " - DNS not blocked");
        } catch (Exception e) {
            System.out.println("BLOCKED: " + e.getMessage());
        }
    }
}
