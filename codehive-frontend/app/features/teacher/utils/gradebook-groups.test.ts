import { describe, expect, it } from "vitest";

import type { TeacherGroup } from "../types/group.types";
import { gradableGroups } from "./gradebook-groups";

function group(id: string, archived: boolean, isActive = true): TeacherGroup {
  return { id, name: id, ownerId: "me", ownerName: "Ana Ruiz", archived, isActive, createdAt: "", updatedAt: "" };
}

describe("gradableGroups", () => {
  it("keeps archived groups, because their owner still closes the evaluation", () => {
    const result = gradableGroups([group("archived", true), group("active", false)]);
    expect(result.map((item) => item.id)).toEqual(["active", "archived"]);
  });

  it("drops deleted groups and preserves the incoming order inside each state", () => {
    const result = gradableGroups([
      group("deleted", false, false), group("active-1", false), group("archived-1", true),
      group("active-2", false), group("archived-2", true),
    ]);
    expect(result.map((item) => item.id)).toEqual(["active-1", "active-2", "archived-1", "archived-2"]);
  });
});
