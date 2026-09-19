import { describe, expect, it } from "vitest";

import type { TeacherGroup } from "../types/group.types";
import { lifecycle } from "./TeacherGroupsUI";

function group(isActive: boolean, archived: boolean): TeacherGroup {
  return { id: "g1", name: "Algorithms", ownerId: "me", ownerName: "Ana Ruiz", archived, isActive, createdAt: "", updatedAt: "" };
}

describe("group lifecycle", () => {
  it("reads deletion before archiving, because a deleted group is archived too", () => {
    expect(lifecycle(group(false, true))).toBe("deleted");
    expect(lifecycle(group(true, true))).toBe("archived");
    expect(lifecycle(group(true, false))).toBe("active");
  });
});
