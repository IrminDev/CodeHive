import { afterEach, describe, expect, it, vi } from "vitest";
import { setAuthToken } from "~/core/storage/token.storage";
import { AdminApiError, adminRequest, queryString } from "./client";

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

describe("admin API client", () => {
  it("omits empty query values", () => expect(queryString({ page: 0, role: undefined, search: "", size: 20 })).toBe("?page=0&size=20"));
  it("unwraps success envelopes and sends bearer token", async () => {
    setAuthToken("token-1");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ success: true, data: { value: 7 } }), { status: 200, headers: { "Content-Type": "application/json" } }));
    await expect(adminRequest<{ value: number }>("/api/admin/statistics")).resolves.toEqual({ value: 7 });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/admin/statistics", expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer token-1" }) }));
  });
  it("preserves blockers and rate-limit headers", async () => {
    setAuthToken("token-1");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ message: "Blocked", errors: ["Owns 2 groups"] }), { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "45", "X-RateLimit-Policy": "admin.statistics" } }));
    const error = await adminRequest("/api/admin/statistics").catch((cause) => cause);
    expect(error).toBeInstanceOf(AdminApiError);
    expect(error).toMatchObject({ status: 429, details: ["Owns 2 groups"], retryAfter: 45, policy: "admin.statistics" });
  });
});
