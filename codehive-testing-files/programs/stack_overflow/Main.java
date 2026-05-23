// SECURITY TEST: Stack overflow via infinite recursion
// Expected: StackOverflowError caught or process killed; must not crash JVM host
public class Main {
    public static void recurse(long depth) {
        recurse(depth + 1);
    }

    public static void main(String[] args) {
        recurse(0);
    }
}
