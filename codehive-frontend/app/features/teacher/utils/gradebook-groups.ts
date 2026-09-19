import type { TeacherGroup } from "../types/group.types";

export function gradableGroups(groups: TeacherGroup[]): TeacherGroup[] {
  return groups
    .filter((group) => group.isActive)
    .sort((left, right) => Number(Boolean(left.archived)) - Number(Boolean(right.archived)));
}
