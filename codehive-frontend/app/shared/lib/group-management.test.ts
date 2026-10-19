import { describe, expect, it } from "vitest";

import { Role, Scope, type User } from "~/shared/types/model/User";
import { canManageGroups } from "./group-management";

function user(role: Role, scopes: Scope[] = []): User {
  return { id: "u1", email: "u@example.com", name: "Ana", lastName: "Ruiz", enrollmentNumber: "2026630001", role, scopes, createdAt: "", isActive: true };
}

describe("canManageGroups", () => {
  it("allows teachers regardless of stored scopes", () => {
    expect(canManageGroups(user(Role.TEACHER))).toBe(true);
  });

  it("allows students only when they hold CREATE_GROUP", () => {
    expect(canManageGroups(user(Role.STUDENT, [Scope.CREATE_GROUP]))).toBe(true);
    expect(canManageGroups(user(Role.STUDENT))).toBe(false);
  });

  it("denies administrators and anonymous sessions", () => {
    expect(canManageGroups(user(Role.ADMIN, [Scope.SUPER_ADMIN]))).toBe(false);
    expect(canManageGroups(null)).toBe(false);
  });
});
