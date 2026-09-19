import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TeacherGroup } from "../types/group.types";
import { TeacherGroupsPage } from "./TeacherGroupsPage";

const calls = vi.hoisted(() => ({ groupArgs: [] as unknown[][] }));

vi.mock("~/core/providers/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "me", name: "Ana", lastName: "Ruiz", role: "TEACHER", scopes: ["CREATE_GROUP"] }, logout: vi.fn() }),
}));
vi.mock("~/core/providers/ThemeProvider", () => ({ useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }) }));
vi.mock("../api/metrics.api", () => ({ getGroupMetricsOverview: () => Promise.resolve({ enrollment: { active: 4 }, assignments: { total: 2 } }) }));
vi.mock("../api/group.api", () => ({
  listTeacherGroups: (...args: unknown[]) => {
    calls.groupArgs.push(args);
    return Promise.resolve(groups);
  },
}));

function group(id: string, name: string, isActive: boolean, archived: boolean): TeacherGroup {
  return { id, name, ownerId: "me", ownerName: "Ana Ruiz", archived, isActive, createdAt: "2026-09-01T10:00:00Z", updatedAt: "2026-09-02T10:00:00Z" };
}

const groups = [group("live", "Algorithms A", true, false), group("gone", "Algorithms 2024", false, true)];

afterEach(cleanup);

describe("TeacherGroupsPage", () => {
  it("keeps deleted groups in their own tab and offers restoring them", async () => {
    render(<MemoryRouter><TeacherGroupsPage /></MemoryRouter>);

    expect(await screen.findByRole("link", { name: /Algorithms A/ })).toHaveAttribute("href", "/teacher/groups/live");
    expect(screen.queryByRole("link", { name: /Algorithms 2024/ })).not.toBeInTheDocument();
    expect(calls.groupArgs.at(-1)).toEqual(["me", true]);

    fireEvent.click(screen.getByRole("tab", { name: /Deleted/ }));

    const deleted = await screen.findByRole("link", { name: /Algorithms 2024/ });
    expect(deleted).toHaveAttribute("href", "/teacher/groups/gone");
    expect(deleted).toHaveTextContent("View and restore");
    expect(screen.queryByRole("link", { name: /Algorithms A/ })).not.toBeInTheDocument();
  });
});
