import sys


def count_solutions(n: int) -> int:
    board_mask = (1 << n) - 1

    def search(columns: int, diagonals_down: int, diagonals_up: int) -> int:
        if columns == board_mask:
            return 1

        available = board_mask & ~(columns | diagonals_down | diagonals_up)
        total = 0
        while available:
            position = available & -available
            available -= position
            total += search(
                columns | position,
                ((diagonals_down | position) << 1) & board_mask,
                (diagonals_up | position) >> 1,
            )
        return total

    half = n // 2
    total = 0
    for column in range(half):
        position = 1 << column
        total += search(position, (position << 1) & board_mask, position >> 1)
    total *= 2

    if n % 2:
        position = 1 << half
        total += search(position, (position << 1) & board_mask, position >> 1)

    return total


def main() -> None:
    data = sys.stdin.buffer.readline()
    if not data:
        raise SystemExit(1)
    print(count_solutions(int(data)))


if __name__ == "__main__":
    main()
