// SECURITY TEST: Infinite loop - CPU spin
// Expected: sandbox must enforce wall-clock / CPU time limit
public class Main {
    public static void main(String[] args) {
        long x = 0;
        while (true) {
            x++;
        }
    }
}
