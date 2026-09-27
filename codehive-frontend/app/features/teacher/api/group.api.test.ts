import { afterEach, describe, expect, it, vi } from "vitest";

import { setAuthToken } from "~/core/storage/token.storage";
import { getActiveTeacherGroups } from "./assignment.api";
import { listTeacherGroups } from "./group.api";

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

const groups = [
  { id: "owned-active", ownerId: "me", isActive: true, archived: false },
  { id: "owned-archived", ownerId: "me", isActive: true, archived: true },
  { id: "enrolled", ownerId: "teacher", isActive: true, archived: false },
];

function mockGroups() {
  setAuthToken("owner-token");
  vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
    new Response(JSON.stringify({ data: groups }), { status: 200, headers: { "Content-Type": "application/json" } }));
}

describe("teacher group lists", () => {
  it("keep only groups owned by the signed-in user", async () => {
    mockGroups();
    const result = await listTeacherGroups("me");
    expect(result.map((group) => group.id)).toEqual(["owned-active", "owned-archived"]);
  });

  it("offer only owned, writable groups as assignment targets", async () => {
    mockGroups();
    const result = await getActiveTeacherGroups("me");
    expect(result.map((group) => group.id)).toEqual(["owned-active"]);
  });
});
