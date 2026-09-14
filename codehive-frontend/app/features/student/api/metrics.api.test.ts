import { afterEach, describe, expect, it, vi } from "vitest";

import { setAuthToken } from "~/core/storage/token.storage";
import { getMyGroupMetrics, listMyAssignmentMetrics } from "./metrics.api";

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

describe("student metrics API", () => {
  it("loads both authenticated group metrics endpoints", async () => {
    setAuthToken("student-token");
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { publishedAssignments: 2 } }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200, headers: { "Content-Type": "application/json" } }));

    await getMyGroupMetrics("group/id");
    await listMyAssignmentMetrics("group/id");

    expect(fetchMock).toHaveBeenNthCalledWith(1, "http://localhost:8080/api/groups/group%2Fid/metrics/me", expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer student-token" }) }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, "http://localhost:8080/api/groups/group%2Fid/metrics/me/assignments", expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer student-token" }) }));
  });
});
