import sys


def main():
    numerator, denominator = map(float, sys.stdin.read().split())
    value = numerator / denominator
    print(f"{value + 5e-10:.15f}")


if __name__ == "__main__":
    main()
