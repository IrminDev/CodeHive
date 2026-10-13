import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, Link, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { BackLink } from "./BackLink";

function renderAt(initialEntries: string[]) {
  const router = createMemoryRouter([
    { path: "/assignment/a1", element: <Link to="/assignment/a1/assistant-history">History</Link> },
    { path: "/assignment/a1/assistant-history", element: <BackLink fallback="/assignments" fallbackLabel="My assignments" /> },
    { path: "/assignments", element: <p>Assignments list</p> },
  ], { initialEntries });
  render(<RouterProvider router={router} />);
  return router;
}

describe("BackLink", () => {
  it("returns to the page the user came from", async () => {
    const router = renderAt(["/assignment/a1"]);
    fireEvent.click(screen.getByText("History"));
    fireEvent.click(await screen.findByRole("link", { name: "Back" }));
    await screen.findByText("History");
    expect(router.state.location.pathname).toBe("/assignment/a1");
  });
  it("names and uses the fallback when opened directly", async () => {
    const router = renderAt(["/assignment/a1/assistant-history"]);
    fireEvent.click(screen.getByRole("link", { name: "My assignments" }));
    await screen.findByText("Assignments list");
    expect(router.state.location.pathname).toBe("/assignments");
  });
});
