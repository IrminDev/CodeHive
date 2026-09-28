import { Role, Scope, type User } from "~/shared/types/model/User";
import type { AdminUserSummary } from "../types/admin.types";

export function hasEffectiveScope(user: User | null | undefined, scope: Scope): boolean {
  const scopes = user?.scopes ?? [];
  return scopes.includes(Scope.SUPER_ADMIN) || scopes.includes(scope);
}

export function hasAnyEffectiveScope(user: User | null | undefined, scopes: Scope[]): boolean {
  return scopes.some((scope) => hasEffectiveScope(user, scope));
}

function canManageTarget(actor: User | null | undefined, target: AdminUserSummary): boolean {
  if (!actor || actor.id === target.id) return false;
  return !target.scopes.includes(Scope.SUPER_ADMIN) || hasEffectiveScope(actor, Scope.SUPER_ADMIN);
}

export function canEditProfile(actor: User | null | undefined, target: AdminUserSummary): boolean {
  return canManageTarget(actor, target) && hasEffectiveScope(actor, target.role === Role.ADMIN ? Scope.UPDATE_ADMINS : Scope.UPDATE_USERS);
}

export function canChangeStatus(actor: User | null | undefined, target: AdminUserSummary): boolean {
  return canManageTarget(actor, target) && hasEffectiveScope(actor, target.role === Role.ADMIN ? Scope.MANAGE_ADMIN_STATUS : Scope.MANAGE_USER_STATUS);
}

export function canChangeScopes(actor: User | null | undefined, target: AdminUserSummary): boolean {
  return target.role !== Role.TEACHER
    && canManageTarget(actor, target)
    && hasEffectiveScope(actor, Scope.MANAGE_SCOPES);
}

export function availableRoleChanges(actor: User | null | undefined, target: AdminUserSummary): Role[] {
  if (!canManageTarget(actor, target)) return [];
  if (target.role === Role.ADMIN) return hasEffectiveScope(actor, Scope.UPDATE_ADMINS) ? [Role.STUDENT, Role.TEACHER] : [];
  const roles: Role[] = [];
  if (hasEffectiveScope(actor, Scope.UPDATE_USERS)) {
    if (target.role !== Role.STUDENT) roles.push(Role.STUDENT);
    if (target.role !== Role.TEACHER) roles.push(Role.TEACHER);
  }
  if (hasEffectiveScope(actor, Scope.CREATE_ADMINS)) roles.push(Role.ADMIN);
  return roles;
}

export function editableScopes(actor: User | null | undefined, target: AdminUserSummary): Scope[] {
  if (!canChangeScopes(actor, target)) return [];
  if (target.role === Role.TEACHER) return [];
  if (target.role === Role.STUDENT) return [Scope.CREATE_GROUP];
  const candidates = target.role === Role.ADMIN
    ? Object.values(Scope).filter((scope) => scope !== Scope.MANAGE_GROUPS && scope !== Scope.CREATE_GROUP)
    : [];
  if (hasEffectiveScope(actor, Scope.SUPER_ADMIN)) return candidates;
  const explicit = new Set(actor?.scopes ?? []);
  return candidates.filter((scope) => explicit.has(scope));
}
