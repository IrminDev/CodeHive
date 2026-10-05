import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { UsageDashboard } from "./UsageDashboard";
import { UsageSummary } from "./UsageSummary";
import type { Breakdown, Summary, Audience } from "./types";
import { Scope } from "~/shared/types/model/User";

const auth = vi.hoisted(() => ({ user: { id: "student-1", scopes: [] as Scope[] } }));
vi.mock("~/core/providers/AuthProvider", () => ({ useAuth: () => auth }));
vi.mock("./api", async importOriginal => ({ ...await importOriginal<typeof import("./api")>(), usageRequest: vi.fn(), ownedUsageGroups: vi.fn() }));
vi.mock("recharts", () => ({ ResponsiveContainer: () => null, LineChart: () => null, Line: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, Legend: () => null }));
import { usageRequest, ownedUsageGroups } from "./api";

function summary(label = "My own usage"): Summary {
  return {
    label, generatedAt: "2026-01-03T00:00:00Z", instrumentationStartedAt: null, currentPolicy: null,
    filters: { from: "2026-01-01T00:00:00Z", to: "2026-01-03T00:00:00Z", userId: "student-1", groupId: null, assignmentId: null, provider: null, model: null },
    educational: { requests: 2, responses: 1, completed: 1, redirected: 0, blocked: 1, failed: 0, cancelled: 0, pending: 0, activeUsers: 1, respondingUsers: 1, historicalUninstrumented: 2, regenerations: 0, editorOptIns: 0, executionOptIns: 0, averageLatencyMs: null, latencySamples: 0, requestedLevels: {}, deliveredLevels: {}, lastActivity: null },
    technical: { calls: 0, succeeded: 0, failed: 0, uncertain: 0, callerTimeouts: 0, knownInputTokens: null, knownOutputTokens: null, knownTotalTokens: null, measuredCalls: 0, unknownCalls: 0, coveragePercent: null, averageLatencyMs: null, latencySamples: 0 }, trend: [],
  };
}
function breakdown(label = "Historical class", page = 0, last = true): Breakdown {
  return { generatedAt: "2026-01-03T00:00:00Z", instrumentationStartedAt: null, filters: summary().filters, rows: {
    page, size: 20, totalElements: 21, totalPages: 2, last,
    content: [{ id: "group-1", label, enrollmentNumber: null, currentParticipant: false, requests: 2, responses: 1, unanswered: 1, regenerations: 0, lastActivity: null, calls: 0, knownTotalTokens: null, quota: null, currentPolicy: null }],
  } };
}
function Location() { return <output data-testid="location">{useLocation().search}</output>; }
function setup(audience: Audience = "personal", path = "/ai-usage") {
  render(<MemoryRouter initialEntries={[path]}><UsageDashboard audience={audience} /><Location /></MemoryRouter>);
}
beforeEach(() => { auth.user = { id: "student-1", scopes: [] }; vi.mocked(ownedUsageGroups).mockResolvedValue([{ id: "group-1", label: "First", lifecycle: "deleted" }, { id: "group-2", label: "Second", lifecycle: "active" }]); });
afterEach(() => { cleanup(); vi.resetAllMocks(); });

describe("AI usage", () => {
  it("distinguishes missing tokens and historical coverage from measured zero", () => {
    const value = summary(); value.technical.knownOutputTokens = 0;
    render(<UsageSummary value={value} personal />);
    expect(screen.getByText(/2 historical questions/)).toBeTruthy();
    expect(screen.getByText(/Known input tokens: Not measured/).textContent).toContain("Known output tokens: 0");
    expect(screen.getByText(/do not use answer quota/)).toBeTruthy();
  });
  it("loads own historical groups and paginates on server with URL state", async () => {
    vi.mocked(usageRequest).mockImplementation(async (_audience, path) => path.includes("/groups?") ? breakdown(path.includes("page=1") ? "Next class" : "Historical class", path.includes("page=1") ? 1 : 0, path.includes("page=1")) : summary() as never);
    setup();
    expect(await screen.findByRole("button", { name: "Historical class" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("button", { name: "Next class" })).toBeTruthy();
    expect(screen.getByTestId("location").textContent).toContain("aiPage=1");
    expect(vi.mocked(usageRequest).mock.calls.some(call => call[1].includes("page=1"))).toBe(true);
    expect(screen.getByText("My own usage")).toBeTruthy();
  });
  it("ignores old group responses after scope changes", async () => {
    let resolveOld!: (value: Summary) => void;
    const old = new Promise<Summary>(resolve => { resolveOld = resolve; });
    vi.mocked(usageRequest).mockImplementation((_audience, path) => {
      if (path.includes("/assignments")) return Promise.resolve(breakdown()) as never;
      return (path.includes("group-1") ? old : Promise.resolve(summary("Second group usage"))) as never;
    });
    setup("owner", "/teacher/analytics?section=ai&groupId=group-1");
    await screen.findByRole("option", { name: "Second (active)" });
    fireEvent.change(screen.getByRole("combobox", { name: "Owned group" }), { target: { value: "group-2" } });
    expect(await screen.findByText("Second group usage")).toBeTruthy();
    await act(async () => { resolveOld(summary("Old group usage")); });
    expect(screen.queryByText("Old group usage")).toBeNull();
    expect(screen.getByTestId("location").textContent).toContain("groupId=group-2");
  });
  it("keeps global admin usage but never requests identities without VIEW_USERS", async () => {
    auth.user.scopes = [Scope.CHECK_ANALYTICS];
    vi.mocked(usageRequest).mockImplementation(async (_audience, path) => path.includes("/models") ? { rows: [], generatedAt: "2026-01-03", filters: summary().filters, instrumentationStartedAt: null } : summary("Global usage") as never);
    setup("admin", "/admin/ai-usage");
    expect(await screen.findByText("Global usage")).toBeTruthy();
    expect(vi.mocked(usageRequest).mock.calls.some(call => call[1].includes("/users"))).toBe(false);
    expect(screen.queryByRole("textbox", { name: "Search" })).toBeNull();
  });
  it("clears previous data on failed refresh and offers retry", async () => {
    vi.mocked(usageRequest).mockImplementation(async (_audience, path) => path.includes("/groups?") ? breakdown() : summary() as never);
    setup(); await screen.findByText("My own usage");
    vi.mocked(usageRequest).mockRejectedValue(new Error("HTTP 403"));
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await screen.findByRole("button", { name: "Retry" });
    expect(screen.queryByText("My own usage")).toBeNull();
    expect(screen.queryByText("Historical class")).toBeNull();
  });
  it("shows lifetime quota independently from filtered questions and links own history", async () => {
    const rows = breakdown("Old assignment");
    rows.rows.content[0].quota = { usedLifetime: 4, maximumCurrent: 1, pendingReservations: 0, remainingNow: 0, limitReduced: true, enabled: true };
    vi.mocked(usageRequest).mockImplementation(async (_audience, path) => path.includes("/assignments?") ? rows : summary() as never);
    setup("personal", "/ai-usage?groupId=group-1&aiFrom=2026-01-01&aiTo=2026-01-03");
    expect(await screen.findByText("Current limit reduced")).toBeTruthy();
    expect(screen.getByRole("link", { name: "My conversation history" }).getAttribute("href")).toBe("/assignment/group-1/assistant-history");
    expect(vi.mocked(usageRequest).mock.calls[0][1]).toContain("from=2026-01-01T00%3A00%3A00Z");
  });
});
