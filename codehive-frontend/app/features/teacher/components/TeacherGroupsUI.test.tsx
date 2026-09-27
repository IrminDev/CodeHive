import { describe, expect, it } from "vitest";

import type { TeacherGroup } from "../types/group.types";
import { lifecycle } from "./TeacherGroupsUI";

function group(archived: boolean): TeacherGroup {
  return { id: "g1", name: "Algorithms", ownerId: "me", ownerName: "Ana Ruiz", archived, isActive: true, createdAt: "", updatedAt: "" };
}

describe("group lifecycle", () => {
  it("classifies a group as archived or active for the teacher's tabs", () => {
    expect(lifecycle(group(true))).toBe("archived");
    expect(lifecycle(group(false))).toBe("active");
  });
});
