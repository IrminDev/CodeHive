import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        int n = input.nextInt();
        long checksum = 0;
        for (int a = 0; a < n; a++)
            for (int b = 0; b < n; b++)
                for (int c = 0; c < n; c++)
                    for (int d = 0; d < n; d++)
                        checksum += (a ^ b ^ c ^ d) & 1;
        System.out.println(checksum);
    }
}
