/*
 * CORRECT SOLUTION — Java
 * Same sliding window logic as the C reference solution.
 * File must be named Main.java — the worker compiles with: javac Main.java
 */
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();

        int k = sc.nextInt();
        sc.close();

        if (k > n || k <= 0) {
            System.out.println(0);
            return;
        }

        long window = 0;
        for (int i = 0; i < k; i++) window += nums[i];

        long maxSum = window;
        for (int i = k; i < n; i++) {
            window += nums[i] - nums[i - k];
            if (window > maxSum) maxSum = window;
        }

        System.out.println(maxSum);
    }
}
