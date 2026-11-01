import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Role, Scope, type User } from "~/shared/types/model/User";
import type { AdminUserSummary, PageResponse } from "../types/admin.types";
import { AdminUsersPage } from "./AdminUsersPage";

const admin: User = { id: "00000000-0000-0000-0000-000000000001", email: "admin@example.com", name: "Super", lastName: "Admin", enrollmentNumber: "ADMIN-001", role: Role.ADMIN, scopes: [Scope.SUPER_ADMIN], createdAt: "", isActive: true };
const teacher: AdminUserSummary = { id: "00000000-0000-0000-0000-000000000002", email: "laura@example.com", name: "Laura", lastName: "Ríos", enrollmentNumber: "PROF-001", role: Role.TEACHER, scopes: [Scope.CREATE_GROUP], status: "ACTIVE", createdAt: "2026-09-01T10:00:00", blockedAt: null };
const page: PageResponse<AdminUserSummary> = { content: [teacher], page: 0, size: 20, totalElements: 1, totalPages: 1, last: true };

vi.mock("~/core/providers/AuthProvider", () => ({ useAuth: () => ({ user: admin, logout: vi.fn() }) }));
vi.mock("~/core/providers/ThemeProvider", () => ({ useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }) }));
vi.mock("../api/admin.api", () => ({ listAdminUsers: () => Promise.resolve(page) }));

afterEach(cleanup);

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/admin/users"]}>
      <Routes>
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/users/:id" element={<p>User detail</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminUsersPage", () => {
  it("opens the user detail when clicking anywhere on the row", async () => {
    renderPage();

    const table = within(await screen.findByRole("table"));
    fireEvent.click(table.getByText("PROF-001"));

    expect(await screen.findByText("User detail")).toBeInTheDocument();
  });

  it("opens the user detail in a new tab on ctrl+click", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    renderPage();

    const table = within(await screen.findByRole("table"));
    fireEvent.click(table.getByText("PROF-001"), { ctrlKey: true });

    expect(open).toHaveBeenCalledWith(`/admin/users/${teacher.id}`, "_blank");
    expect(screen.queryByText("User detail")).not.toBeInTheDocument();
    open.mockRestore();
  });
});
