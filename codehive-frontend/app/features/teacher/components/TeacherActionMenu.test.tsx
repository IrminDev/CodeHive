import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActionMenu } from "./TeacherActionMenu";

afterEach(cleanup);

function renderMenu(onPick = vi.fn()) {
  render(
    // The clipping panel the menu has to escape.
    <section className="relative overflow-hidden">
      <ActionMenu label="More actions">
        {(close) => <button type="button" role="menuitem" onClick={() => { close(); onPick(); }}>Delete assignment</button>}
      </ActionMenu>
    </section>,
  );
  return onPick;
}

describe("ActionMenu", () => {
  it("renders its items outside the panel that would clip them", () => {
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));

    const menu = screen.getByRole("menu", { name: "More actions" });
    expect(menu.closest("section")).toBeNull();
    expect(menu.parentElement).toBe(document.body);
    expect(menu).toHaveClass("fixed");
  });

  it("reports the chosen action and closes", () => {
    const onPick = renderMenu();
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete assignment" }));

    expect(onPick).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on escape and on a click elsewhere", () => {
    renderMenu();
    const trigger = screen.getByRole("button", { name: "More actions" });

    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("marks the trigger state for assistive technology", () => {
    renderMenu();
    const trigger = screen.getByRole("button", { name: "More actions" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});
