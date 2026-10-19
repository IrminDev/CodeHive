import { cleanup, render, screen } from "@testing-library/react";
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
  { id: "joined", name: "Data Structures", ownerName: "Laura Ríos", isActive: true, archived: false },
  { id: "mine", name: "Study Circle", ownerName: "Ana Ruiz", joinCode: "ABCD2345", isActive: true, archived: false },
];

function renderPage(scopes: Scope[]) {
  state.user = { id: "s1", email: "ana@example.com", name: "Ana", lastName: "Ruiz", enrollmentNumber: "2026630001", role: Role.STUDENT, scopes, createdAt: "", isActive: true };
  state.groups = groups;
  render(<MemoryRouter><MyGroupsPage /></MemoryRouter>);
}

describe("MyGroupsPage", () => {
  it("hides the managed section from students without CREATE_GROUP", async () => {
    renderPage([]);

    expect(await screen.findByRole("link", { name: /Data Structures/ })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Groups you manage" })).not.toBeInTheDocument();
  });
});
