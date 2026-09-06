import java.io.BufferedInputStream;
import java.io.IOException;
import java.util.Arrays;

public class Main {
    public static void main(String[] args) throws Exception {
        FastScanner input = new FastScanner();
        int n = input.nextInt();
        long[] dimensions = new long[n + 1];
        for (int i = 0; i <= n; i++) dimensions[i] = input.nextLong();

        long[][] dp = new long[n][n];
        for (int length = 2; length <= n; length++) {
            for (int left = 0; left + length <= n; left++) {
                int right = left + length - 1;
                dp[left][right] = Long.MAX_VALUE;
                for (int split = left; split < right; split++) {
                    long cost = dp[left][split] + dp[split + 1][right]
                        + dimensions[left] * dimensions[split + 1] * dimensions[right + 1];
                    dp[left][right] = Math.min(dp[left][right], cost);
                }
            }
        }
        System.out.println(n <= 1 ? 0 : dp[0][n - 1]);
    }

    private static final class FastScanner {
        private final BufferedInputStream input = new BufferedInputStream(System.in);
        private final byte[] buffer = new byte[1 << 16];
        private int index;
        private int size;

        private int read() throws IOException {
            if (index >= size) {
                size = input.read(buffer);
                index = 0;
                if (size < 0) return -1;
            }
            return buffer[index++];
        }

        private long nextLong() throws IOException {
            int value;
            do value = read(); while (value <= ' ' && value >= 0);
            long result = 0;
            while (value > ' ') {
                result = result * 10 + value - '0';
                value = read();
            }
            return result;
        }

        private int nextInt() throws IOException {
            return (int) nextLong();
        }
    }
}
