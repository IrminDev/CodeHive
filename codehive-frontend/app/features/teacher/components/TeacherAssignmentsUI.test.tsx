import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TeacherAssignment } from "../types/assignment.types";
import { AssignmentList } from "./TeacherAssignmentsUI";

afterEach(cleanup);

const assignment: TeacherAssignment = {
  id: "a1", groupId: "g1", authorId: "me", title: "Topological Sort", description: "",
  constraints: [], hints: [], tags: [], timeLimitMs: 2000, memoryLimitMb: 256,
  comparatorType: "EXACT_MATCH", createdAt: "2026-09-01T10:00:00Z", updatedAt: "2026-09-01T10:00:00Z",
  allowedLanguages: ["PYTHON"], isActive: true, validationStatus: "READY", maxPoints: 100, aiPolicyVersion: 0, aiAssistanceEnabled: false, maxAiRequests: 0, aiAssistanceLevel: "CONCEPTUAL_ONLY",
};

function renderList(overrides: Partial<Parameters<typeof AssignmentList>[0]> = {}) {
  const handlers = { onPage: vi.fn(), onStatus: vi.fn(), onDelete: vi.fn() };
  render(
    <MemoryRouter>
      <AssignmentList
        assignments={[assignment]} loading={false}
        page={0} pageSize={10} totalElements={1} totalPages={1} {...handlers} {...overrides}
      />
    </MemoryRouter>,
  );
  return handlers;
}

describe("AssignmentList", () => {
  it("deletes the selected assignment from the row menu", () => {
    const handlers = renderList();

    fireEvent.click(screen.getByRole("button", { name: "More actions for Topological Sort" }));
    const remove = screen.getByRole("menuitem", { name: /Delete assignment/ });

    fireEvent.click(remove);
    expect(handlers.onDelete).toHaveBeenCalledWith(assignment);
  });

  it("opens the status drawer from the validation badge", () => {
    const handlers = renderList();
    fireEvent.click(screen.getByRole("button", { name: "View Topological Sort validation status" }));
    expect(handlers.onStatus).toHaveBeenCalledWith(assignment);
  });

  it("shows no Updating indicator when there is no in-flight update", () => {
    renderList();
    expect(screen.queryByText("updating")).not.toBeInTheDocument();
  });

  it("never offers a restore action to the teacher", () => {
    renderList();
    expect(screen.queryByRole("button", { name: /Restore/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "More actions for Topological Sort" }));
    expect(screen.queryByRole("menuitem", { name: /Restore/ })).not.toBeInTheDocument();
  });
});
