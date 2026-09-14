import type { ClassGroup } from "../types/group.types";

export interface GroupsByOwnership {
  owned: ClassGroup[];
  enrolled: ClassGroup[];
}

export function splitGroupsByOwnership(groups: ClassGroup[], userId: string | undefined): GroupsByOwnership {
  const owned: ClassGroup[] = [];
  const enrolled: ClassGroup[] = [];
  for (const group of groups) {
    if (userId && group.ownerId === userId) owned.push(group);
    else enrolled.push(group);
  }
  return { owned, enrolled };
}
