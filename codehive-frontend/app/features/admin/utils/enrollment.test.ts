import { describe, expect, it } from "vitest";

import { Role } from "~/shared/types/model/User";
import { enrollmentForRole, isValidEnrollment } from "./enrollment";

describe("enrollment rules", () => {
  it("accepts the student format and rejects staff codes for students", () => {
    expect(isValidEnrollment(Role.STUDENT, "2024630001")).toBe(true);
    expect(isValidEnrollment(Role.STUDENT, "1993630001")).toBe(false);
    expect(isValidEnrollment(Role.STUDENT, "PROF-001")).toBe(false);
  });

  it("accepts short staff codes for teachers and admins", () => {
    expect(isValidEnrollment(Role.TEACHER, "PROF-001")).toBe(true);
    expect(isValidEnrollment(Role.ADMIN, "ADMIN-0001X")).toBe(false);
  });

  it("clears an enrollment the new role would reject and keeps a valid one", () => {
    expect(enrollmentForRole(Role.STUDENT, "PROF-001")).toBe("");
    expect(enrollmentForRole(Role.TEACHER, "PROF-001")).toBe("PROF-001");
    expect(enrollmentForRole(Role.TEACHER, "2024630001")).toBe("2024630001");
  });
});
