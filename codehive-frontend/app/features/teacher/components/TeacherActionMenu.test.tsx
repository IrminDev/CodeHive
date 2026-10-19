import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActionMenu } from "./TeacherActionMenu";

const MENU_HEIGHT = 40;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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

function rect(top: number, height: number): DOMRect {
  return { top, bottom: top + height, left: 900, right: 936, width: 36, height, x: 900, y: top, toJSON: () => ({}) } as DOMRect;
}

function openMenuWithTriggerAt(triggerTop: number) {
  vi.spyOn(window, "innerHeight", "get").mockReturnValue(768);
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    return this.getAttribute("role") === "menu" ? rect(0, MENU_HEIGHT) : rect(triggerTop, 36);
  });
  renderMenu();
  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  return screen.getByRole("menu", { name: "More actions" });
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

  it("opens below the trigger when there is room", () => {
    const menu = openMenuWithTriggerAt(100);

    expect(menu.style.top).toBe("140px");
  });

  it("opens above the trigger when the row sits at the bottom of the viewport", () => {
    const menu = openMenuWithTriggerAt(720);

    expect(menu.style.top).toBe(`${720 - 4 - MENU_HEIGHT}px`);
  });
});
