import { describe, expect, it } from "vitest";

import type { ClassGroup } from "../types/group.types";
import { splitGroupsByOwnership } from "./group-membership";

function group(id: string, ownerId: string): ClassGroup {
  return { id, name: id, ownerId, isActive: true, archived: false };
}

describe("splitGroupsByOwnership", () => {
  it("separates groups the student owns from groups they joined, keeping order", () => {
    const result = splitGroupsByOwnership([group("a", "teacher"), group("b", "me"), group("c", "teacher"), group("d", "me")], "me");
    expect(result.owned.map((item) => item.id)).toEqual(["b", "d"]);
    expect(result.enrolled.map((item) => item.id)).toEqual(["a", "c"]);
  });

  it("treats every group as enrolled while the session user is unknown", () => {
    const result = splitGroupsByOwnership([group("a", "me")], undefined);
    expect(result.owned).toEqual([]);
    expect(result.enrolled.map((item) => item.id)).toEqual(["a"]);
  });
});
