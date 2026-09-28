import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CalendarInput } from "./CalendarInput";
import { Dropdown } from "./Dropdown";

describe("design-system form controls", () => {
  it("returns selected dropdown value", async () => {
    const onChange = vi.fn();
    render(<Dropdown ariaLabel="Role" value="STUDENT" onChange={onChange} options={[{ value: "STUDENT", label: "Student" }, { value: "TEACHER", label: "Teacher" }]} />);

    fireEvent.keyDown(screen.getByRole("combobox", { name: "Role" }), { key: "ArrowDown" });
    fireEvent.click(await screen.findByRole("option", { name: "Teacher" }));

    expect(onChange).toHaveBeenCalledWith("TEACHER");
  });

  it("returns calendar changes and supports clearing optional values", () => {
    const onChange = vi.fn();
    render(<CalendarInput ariaLabel="Due date" value="2026-09-18" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Due date"), { target: { value: "2026-09-20" } });
    fireEvent.click(screen.getByRole("button", { name: "Clear date" }));

    expect(onChange).toHaveBeenNthCalledWith(1, "2026-09-20");
    expect(onChange).toHaveBeenNthCalledWith(2, "");
  });

  it("preserves datetime constraints", () => {
    render(<CalendarInput ariaLabel="Launch date" type="datetime-local" value="" min="2026-09-18T10:00" required onChange={() => undefined} />);

    expect(screen.getByLabelText("Launch date")).toHaveAttribute("type", "datetime-local");
    expect(screen.getByLabelText("Launch date")).toHaveAttribute("min", "2026-09-18T10:00");
    expect(screen.getByLabelText("Launch date")).toBeRequired();
  });
});
