import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useSearchParams } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AssignmentPage } from "../types/assignment.types";
import type { TeacherGroup } from "../types/group.types";
import { TeacherAssignmentsPage } from "./TeacherAssignmentsPage";

vi.mock("~/core/providers/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "me", name: "Ana", lastName: "Ruiz", role: "TEACHER", scopes: ["CREATE_GROUP"] }, logout: vi.fn() }),
}));
vi.mock("~/core/providers/ThemeProvider", () => ({ useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }) }));

const groups: TeacherGroup[] = [
  { id: "g1", name: "Algorithms A", ownerId: "me", ownerName: "Ana", archived: false, isActive: true, createdAt: "2026-09-01T10:00:00Z", updatedAt: "2026-09-01T10:00:00Z" },
  { id: "g2", name: "Data Structures", ownerId: "me", ownerName: "Ana", archived: false, isActive: true, createdAt: "2026-09-02T10:00:00Z", updatedAt: "2026-09-02T10:00:00Z" },
];
const emptyPage: AssignmentPage = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 20 };
const requestedGroupIds: string[] = [];

vi.mock("../api/group.api", () => ({
  listTeacherGroups: () => Promise.resolve(groups),
}));
vi.mock("../api/assignment.api", () => ({
  getTeacherAssignmentPage: (groupId: string) => { requestedGroupIds.push(groupId); return Promise.resolve(emptyPage); },
  getAssignmentManagementStatus: () => Promise.resolve(null),
  getTeacherAssignment: () => Promise.resolve(null),
  deleteAssignment: () => Promise.resolve(),
}));

function LocationProbe() {
  const [params] = useSearchParams();
  return <output data-testid="loc">{params.toString()}</output>;
}

function renderAt(initial: string) {
  render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/teacher/assignments" element={<><TeacherAssignmentsPage /><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => { requestedGroupIds.length = 0; sessionStorage.clear(); });
afterEach(cleanup);

describe("TeacherAssignmentsPage navigation context", () => {
  it("restores the last group and filters when returning without URL params", async () => {
    sessionStorage.setItem("teacher.assignments.context", JSON.stringify({ groupId: "g2", validationStatus: "READY", query: "graph" }));

    renderAt("/teacher/assignments");

    await waitFor(() => expect(screen.getByTestId("loc").textContent).toContain("groupId=g2"));
    const loc = screen.getByTestId("loc").textContent ?? "";
    expect(loc).toContain("validationStatus=READY");
    expect(loc).toContain("query=graph");
    expect(requestedGroupIds).toContain("g2");
    expect(requestedGroupIds).not.toContain("g1");
  });

  it("keeps an explicit group from the URL (e.g. the post-update status view) over the saved one", async () => {
    sessionStorage.setItem("teacher.assignments.context", JSON.stringify({ groupId: "g2" }));

    renderAt("/teacher/assignments?groupId=g1&statusId=a1");

    await waitFor(() => expect(requestedGroupIds).toContain("g1"));
    const loc = screen.getByTestId("loc").textContent ?? "";
    expect(loc).toContain("groupId=g1");
    expect(loc).toContain("statusId=a1");
  });
});
