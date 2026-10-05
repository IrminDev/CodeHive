import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TeacherGroup } from "../types/group.types";
import { GradebookToolbar } from "./TeacherGradebook";

afterEach(cleanup);

function group(id: string, name: string, archived: boolean): TeacherGroup {
  return { id, name, ownerId: "me", ownerName: "Ana Ruiz", archived, isActive: true, createdAt: "", updatedAt: "" };
}

const groups = [group("active", "Algorithms A", false), group("archived", "Algorithms 2025", true)];
const NOTICE = /Students see this group as read-only/;

function renderToolbar(groupId: string, onGroup = vi.fn()) {
  render(<GradebookToolbar groups={groups} groupId={groupId} query="" filter="all" onGroup={onGroup} onQuery={vi.fn()} onFilter={vi.fn()} />);
  return onGroup;
}

describe("GradebookToolbar", () => {
  it("explains that an archived group stays gradable", () => {
    renderToolbar("archived");
    const notice = screen.getByText(NOTICE);
    expect(within(notice).getByText("archived")).toBeInTheDocument();
  });

  it("marks the selector when the chosen group is archived", () => {
    renderToolbar("archived");
    expect(screen.getByRole("combobox").className).toContain("border-orange-500/40");
  });

  it("keeps the notice out of active groups", () => {
    renderToolbar("active");
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });

  it("offers archived groups in the selector and reports the choice", async () => {
    const onGroup = renderToolbar("active");

    fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
    const archived = await screen.findByRole("option", { name: /Algorithms 2025/ });
    expect(within(archived).getByText("archived")).toBeInTheDocument();
    expect(within(screen.getByRole("option", { name: /Algorithms A/ })).queryByText("archived")).not.toBeInTheDocument();
    fireEvent.click(archived);

    expect(onGroup).toHaveBeenCalledWith("archived");
  });
});
