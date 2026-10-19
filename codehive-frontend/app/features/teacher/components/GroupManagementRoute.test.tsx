import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Role, Scope, type User } from "~/shared/types/model/User";
import { GroupManagementRoute } from "./GroupManagementRoute";

const auth = vi.hoisted(() => ({ user: null as User | null }));

vi.mock("~/core/providers/AuthProvider", () => ({
  useAuth: () => ({ user: auth.user, isLoading: false, isAuthenticated: auth.user != null }),
}));

afterEach(cleanup);

function user(role: Role, scopes: Scope[] = []): User {
  return { id: "u1", email: "u@example.com", name: "Ana", lastName: "Ruiz", enrollmentNumber: "2026630001", role, scopes, createdAt: "", isActive: true };
}

function renderAt(current: User) {
  auth.user = current;
  render(
    <MemoryRouter initialEntries={["/teacher/groups"]}>
      <Routes>
        <Route path="/teacher/groups" element={<GroupManagementRoute><p>Management workspace</p></GroupManagementRoute>} />
        <Route path="/dashboard" element={<p>Student dashboard</p>} />
        <Route path="/admin" element={<p>Admin dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GroupManagementRoute", () => {
  it("lets teachers into the management workspace", () => {
    renderAt(user(Role.TEACHER, [Scope.CREATE_GROUP]));
    expect(screen.getByText("Management workspace")).toBeInTheDocument();
  });

  it("lets students with CREATE_GROUP into the management workspace", () => {
    renderAt(user(Role.STUDENT, [Scope.CREATE_GROUP]));
    expect(screen.getByText("Management workspace")).toBeInTheDocument();
  });

  it("sends students without CREATE_GROUP back to their dashboard", async () => {
    renderAt(user(Role.STUDENT));
    expect(await screen.findByText("Student dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Management workspace")).not.toBeInTheDocument();
  });

  it("sends administrators back to the admin area", async () => {
    renderAt(user(Role.ADMIN, [Scope.SUPER_ADMIN]));
    expect(await screen.findByText("Admin dashboard")).toBeInTheDocument();
  });
});
