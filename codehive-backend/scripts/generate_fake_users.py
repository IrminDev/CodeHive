#!/usr/bin/env python3
"""
Generates a CSV file with fake user data for CodeHive bulk registration.
CSV format: role, name, father_last_name, mother_last_name, enrollment_number, email
"""

import csv
import random
import string
import sys
from datetime import datetime

FIRST_NAMES = [
    "Carlos", "Maria", "Jose", "Ana", "Luis", "Laura", "Miguel", "Sofia",
    "Jorge", "Elena", "Ricardo", "Valeria", "Fernando", "Gabriela", "Andres",
    "Patricia", "Diego", "Monica", "Roberto", "Alejandra", "Eduardo", "Claudia",
    "Sergio", "Natalia", "Pablo", "Daniela", "Ivan", "Karla", "Oscar", "Veronica",
]

LAST_NAMES = [
    "Garcia", "Martinez", "Lopez", "Hernandez", "Gonzalez", "Perez", "Rodriguez",
    "Sanchez", "Ramirez", "Torres", "Flores", "Rivera", "Gomez", "Diaz", "Cruz",
    "Morales", "Reyes", "Gutierrez", "Ortiz", "Chavez", "Romero", "Jimenez",
    "Vargas", "Mendoza", "Ruiz", "Aguilar", "Medina", "Castillo", "Herrera", "Silva",
]

EMAIL_DOMAINS = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "ittepic.edu.mx"]

CURRENT_YEAR = datetime.now().year


def random_name():
    return random.choice(FIRST_NAMES)


def random_last_name():
    return random.choice(LAST_NAMES)


def generate_enrollment_number(used: set) -> str:
    while True:
        year = random.randint(1994, CURRENT_YEAR)
        suffix = random.randint(0, 999)
        number = f"{year}630{suffix:03d}"
        if number not in used:
            used.add(number)
            return number


def generate_email(name: str, father_last: str, used: set) -> str:
    base = f"{name.lower()}.{father_last.lower()}"
    domain = random.choice(EMAIL_DOMAINS)
    candidate = f"{base}@{domain}"
    if candidate not in used:
        used.add(candidate)
        return candidate
    # Append random digits to avoid collision
    while True:
        candidate = f"{base}{random.randint(1, 9999)}@{domain}"
        if candidate not in used:
            used.add(candidate)
            return candidate


def generate_users(n_admins: int, n_teachers: int, n_students: int) -> list[dict]:
    used_enrollments: set = set()
    used_emails: set = set()
    users = []

    roles = (
        [("ADMIN", n_admins), ("TEACHER", n_teachers), ("STUDENT", n_students)]
    )

    for role, count in roles:
        for _ in range(count):
            name = random_name()
            father_last = random_last_name()
            mother_last = random_last_name()
            enrollment = generate_enrollment_number(used_enrollments)
            email = generate_email(name, father_last, used_emails)
            users.append({
                "role": role,
                "name": name,
                "father_last_name": father_last,
                "mother_last_name": mother_last,
                "enrollment_number": enrollment,
                "email": email,
            })

    random.shuffle(users)
    return users


def main():
    print("CodeHive fake user CSV generator")
    print("-" * 35)

    try:
        n_admins = int(input("Number of admins (n1): ").strip())
        n_teachers = int(input("Number of teachers (n2): ").strip())
        n_students = int(input("Number of students (n3): ").strip())
    except ValueError:
        print("Error: all inputs must be integers.", file=sys.stderr)
        sys.exit(1)

    if any(v < 0 for v in (n_admins, n_teachers, n_students)):
        print("Error: counts must be non-negative.", file=sys.stderr)
        sys.exit(1)

    total = n_admins + n_teachers + n_students
    if total == 0:
        print("Nothing to generate.")
        sys.exit(0)

    output_file = "fake_users.csv"
    users = generate_users(n_admins, n_teachers, n_students)

    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        for u in users:
            writer.writerow([
                u["role"],
                u["name"],
                u["father_last_name"],
                u["mother_last_name"],
                u["enrollment_number"],
                u["email"],
            ])

    print(f"\nGenerated {total} users ({n_admins} admins, {n_teachers} teachers, {n_students} students)")
    print(f"Saved to: {output_file}")


if __name__ == "__main__":
    main()
