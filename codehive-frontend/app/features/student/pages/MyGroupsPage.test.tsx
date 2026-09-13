import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Role, Scope, type User } from "~/shared/types/model/User";
import type { ClassGroup } from "../types/group.types";
import { MyGroupsPage } from "./MyGroupsPage";

const state = vi.hoisted(() => ({ user: null as User | null, groups: [] as ClassGroup[] }));

vi.mock("~/core/providers/AuthProvider", () => ({ useAuth: () => ({ user: state.user, logout: vi.fn() }) }));
vi.mock("~/core/providers/ThemeProvider", () => ({ useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }) }));
vi.mock("../api/group.api", () => ({ listMyGroups: () => Promise.resolve(state.groups) }));

afterEach(cleanup);

const groups: ClassGroup[] = [
  { id: "joined", name: "Data Structures", ownerId: "teacher", ownerName: "Laura Ríos", isActive: true, archived: false },
  { id: "mine", name: "Study Circle", ownerId: "s1", ownerName: "Ana Ruiz", joinCode: "ABCD2345", isActive: true, archived: false },
];

function renderPage(scopes: Scope[]) {
  state.user = { id: "s1", email: "ana@example.com", name: "Ana", lastName: "Ruiz", enrollmentNumber: "2026630001", role: Role.STUDENT, scopes, createdAt: "", isActive: true };
  state.groups = groups;
  render(<MemoryRouter><MyGroupsPage /></MemoryRouter>);
}

describe("MyGroupsPage", () => {
  it("lists owned groups under Groups you manage instead of the enrolled grid", async () => {
    renderPage([Scope.CREATE_GROUP]);

    expect(await screen.findByRole("link", { name: /Data Structures/ })).toHaveAttribute("href", "/groups/joined");
    const managed = within(screen.getByRole("region", { name: "Groups you manage" }));
    expect(managed.getByText("Study Circle")).toBeInTheDocument();
    expect(managed.getByRole("link", { name: /Manage/ })).toHaveAttribute("href", "/teacher/groups/mine");
    expect(screen.queryByRole("link", { name: /Study Circle/ })).not.toBeInTheDocument();
  });

  it("hides the managed section from students without CREATE_GROUP", async () => {
    renderPage([]);

    expect(await screen.findByRole("link", { name: /Data Structures/ })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Groups you manage" })).not.toBeInTheDocument();
  });
});
