import { Role, Scope, type User } from "~/shared/types/model/User";

export function canManageGroups(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.role === Role.TEACHER) return true;
  return user.role === Role.STUDENT && (user.scopes ?? []).includes(Scope.CREATE_GROUP);
}
