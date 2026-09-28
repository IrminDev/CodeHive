import java.io.BufferedReader;
import java.io.InputStreamReader;

class Main {
    private static long boardMask;

    private static long countPlacements(long columns, long diagonalsDown, long diagonalsUp) {
        if (columns == boardMask) {
            return 1;
        }

        long available = boardMask & ~(columns | diagonalsDown | diagonalsUp);
        long total = 0;
        while (available != 0) {
            long position = available & -available;
            available -= position;
            total += countPlacements(
                columns | position,
                ((diagonalsDown | position) << 1) & boardMask,
                (diagonalsUp | position) >> 1
            );
        }
        return total;
    }

    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(reader.readLine().trim());
        boardMask = (1L << n) - 1;
        System.out.println(countPlacements(0, 0, 0));
    }
}
