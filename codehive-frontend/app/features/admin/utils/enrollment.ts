import { Role } from "~/shared/types/model/User";

// Mirrors the backend EnrollmentNumberRules so the form rejects what the API would reject.
const STUDENT_PATTERN = "(199[4-9]|[2-9][0-9]{3})630[0-9]{3}";
const STAFF_PATTERN = "[A-Za-z0-9._-]{1,10}";

export function enrollmentPattern(role: Role): string {
  return role === Role.STUDENT ? STUDENT_PATTERN : STAFF_PATTERN;
}

export function enrollmentHint(role: Role): string {
  return role === Role.STUDENT
    ? "Format YYYY630XXX; year 1994 or later."
    : "Up to 10 letters, numbers, dots, underscores, or hyphens.";
}

export function isValidEnrollment(role: Role, value: string): boolean {
  return new RegExp(`^(?:${enrollmentPattern(role)})$`).test(value.trim());
}

/** Enrollment to show after picking a new role: keep it only when the new role accepts it. */
export function enrollmentForRole(role: Role, current: string): string {
  return isValidEnrollment(role, current) ? current : "";
}
