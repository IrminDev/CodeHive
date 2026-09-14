import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayDeque;
import java.util.Deque;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String sequence = reader.readLine();
        Deque<Character> stack = new ArrayDeque<>();

        for (int index = 0; index < sequence.length(); index++) {
            char bracket = sequence.charAt(index);
            if (bracket == '(' || bracket == '[' || bracket == '{') {
                stack.push(bracket);
                continue;
            }

            if (stack.isEmpty() || !matches(stack.pop(), bracket)) {
                System.out.println("NO");
                return;
            }
        }

        System.out.println(stack.isEmpty() ? "YES" : "NO");
    }

    private static boolean matches(char opening, char closing) {
        return opening == '(' && closing == ')'
                || opening == '[' && closing == ']'
                || opening == '{' && closing == '}';
    }
}
