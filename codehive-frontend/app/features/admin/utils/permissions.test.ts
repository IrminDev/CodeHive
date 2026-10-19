import { describe, expect, it } from "vitest";
import { Role, Scope, type User } from "~/shared/types/model/User";
import type { AdminUserSummary } from "../types/admin.types";
import { availableRoleChanges, canChangeScopes, canChangeStatus, canEditProfile, editableScopes, hasEffectiveScope } from "./permissions";

const actorId = "00000000-0000-0000-0000-000000000001";
const targetId = "00000000-0000-0000-0000-000000000002";

function actor(scopes: Scope[], id = actorId): User {
  return { id, email: "admin@example.com", name: "Admin", lastName: "User", enrollmentNumber: "ADM-1", role: Role.ADMIN, scopes, createdAt: "2026-01-01T00:00:00", isActive: true };
}
function target(role = Role.STUDENT, scopes: Scope[] = []): AdminUserSummary {
  return { id: targetId, email: "student@example.com", name: "Student", lastName: "User", enrollmentNumber: "2026630001", role, scopes, status: "ACTIVE", createdAt: "2026-01-01T00:00:00", blockedAt: null };
}

describe("admin permissions", () => {
  it("treats SUPER_ADMIN as every effective scope", () => expect(hasEffectiveScope(actor([Scope.SUPER_ADMIN]), Scope.VIEW_AUDIT_LOG)).toBe(true));
  it("prevents self-management", () => expect(canEditProfile(actor([Scope.UPDATE_ADMINS]), { ...target(Role.ADMIN), id: actorId })).toBe(false));
  it("requires superadmin to manage superadmin target", () => expect(canChangeStatus(actor([Scope.MANAGE_ADMIN_STATUS]), target(Role.ADMIN, [Scope.SUPER_ADMIN]))).toBe(false));
  it("uses target role for profile and status scopes", () => {
    expect(canEditProfile(actor([Scope.UPDATE_USERS]), target())).toBe(true);
    expect(canEditProfile(actor([Scope.UPDATE_USERS]), target(Role.ADMIN))).toBe(false);
    expect(canChangeStatus(actor([Scope.MANAGE_USER_STATUS]), target())).toBe(true);
  });
  it("requires CREATE_ADMINS before offering promotion", () => {
    expect(availableRoleChanges(actor([Scope.UPDATE_USERS]), target())).toEqual([Role.TEACHER]);
    expect(availableRoleChanges(actor([Scope.UPDATE_USERS, Scope.CREATE_ADMINS]), target())).toEqual([Role.TEACHER, Role.ADMIN]);
  });
  it("never exposes MANAGE_GROUPS and limits non-admin targets", () => {
    const superAdmin = actor([Scope.SUPER_ADMIN]);
    expect(editableScopes(superAdmin, target(Role.ADMIN))).not.toContain(Scope.MANAGE_GROUPS);
    expect(editableScopes(superAdmin, target(Role.ADMIN))).not.toContain(Scope.CREATE_GROUP);
    expect(editableScopes(superAdmin, target())).toEqual([Scope.CREATE_GROUP]);
    expect(editableScopes(superAdmin, target(Role.TEACHER, [Scope.CREATE_GROUP]))).toEqual([]);
    expect(canChangeScopes(superAdmin, target(Role.TEACHER, [Scope.CREATE_GROUP]))).toBe(false);
    expect(canChangeScopes(superAdmin, target())).toBe(true);
  });
});
