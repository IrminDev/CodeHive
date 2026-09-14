import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";

import type { ClassGroup } from "../types/group.types";
import { ManagedGroupsSection } from "./ManagedGroupsSection";

afterEach(cleanup);

function renderSection(groups: ClassGroup[]) {
  render(<MemoryRouter><ManagedGroupsSection groups={groups} /></MemoryRouter>);
}

describe("ManagedGroupsSection", () => {
  it("links each managed group to its management page and analytics", () => {
    renderSection([
      { id: "g1", name: "Algorithms A", ownerId: "me", joinCode: "ABCD2345", isActive: true, archived: false },
      { id: "g2", name: "Algorithms 2025", ownerId: "me", joinCode: "WXYZ6789", isActive: true, archived: true },
    ]);

    const active = within(screen.getByText("Algorithms A").closest("li")!);
    expect(active.getByText("Active")).toBeInTheDocument();
    expect(active.getByText("ABCD2345")).toBeInTheDocument();
    expect(active.getByRole("link", { name: /Manage/ })).toHaveAttribute("href", "/teacher/groups/g1");
    expect(active.getByRole("link", { name: /Analytics/ })).toHaveAttribute("href", "/teacher/analytics?groupId=g1");

    const archived = within(screen.getByText("Algorithms 2025").closest("li")!);
    expect(archived.getByText("Read-only")).toBeInTheDocument();
    expect(archived.queryByText("WXYZ6789")).not.toBeInTheDocument();
  });

  it("offers group creation even before the student owns a group", () => {
    renderSection([]);
    expect(screen.getByText("No managed groups yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Create group/ })).toHaveAttribute("href", "/teacher/groups/create");
  });
});
