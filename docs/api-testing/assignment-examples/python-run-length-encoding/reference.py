import sys


def encode(text: str) -> str:
    result = []
    current = text[0]
    count = 1

    for character in text[1:]:
        if character == current:
            count += 1
        else:
            result.append(f"{current}{count}")
            current = character
            count = 1

    result.append(f"{current}{count}")
    return "".join(result)


source = sys.stdin.readline().strip()
print(encode(source))
