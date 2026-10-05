import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<byte[]> retained = new ArrayList<>();
        while (true) retained.add(new byte[1024 * 1024]);
    }
}
