import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AssistantMessage } from "./AssistantMessage";
import type { AssistantInteraction } from "../types/assistant.types";

const answer = {
  explanation: "Start by considering what changes on each iteration. ".repeat(4),
  snippets: [{ language: "html", code: "<img src=x onerror=alert(1)>" }],
  followUpQuestion: "Which value controls when the loop stops?",
};
const interaction: AssistantInteraction = {
  id: "00000000-0000-0000-0000-000000000001", sequence: 1, status: "COMPLETED",
  studentMessage: "Can you help with this loop?", assistantResponse: JSON.stringify(answer),
  contentErased: false, quotaCharged: true, failureCode: null,
  createdAt: "2026-01-01T00:00:00Z", completedAt: "2026-01-01T00:00:01Z",
};

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("AssistantMessage chat", () => {
  it("reveals validated content in order without exposing JSON or executing code", () => {
    vi.useFakeTimers();
    render(<AssistantMessage interaction={interaction} animate />);
    expect(screen.getByText(interaction.studentMessage!)).toBeInTheDocument();
    expect(screen.queryByText(answer.followUpQuestion)).toBeNull();
    expect(screen.getByTestId("assistant-interaction-1").querySelector("code")).toBeNull();
    act(() => vi.advanceTimersByTime(64));
    const bubble = screen.getByTestId("assistant-interaction-1");
    expect(bubble.textContent).toContain("Start by");
    expect(bubble.textContent).not.toContain('"explanation"');
    expect(screen.queryByText(answer.followUpQuestion)).toBeNull();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText(answer.followUpQuestion)).toBeInTheDocument();
    expect(bubble.querySelector("code")?.textContent).toBe(answer.snippets[0].code);
    expect(bubble.querySelector("img")).toBeNull();
    expect(screen.queryByRole("button", { name: "Show full answer" })).toBeNull();
  });

  it("lets students skip the reveal and does not restart it on rerender", () => {
    vi.useFakeTimers();
    const { rerender } = render(<AssistantMessage interaction={interaction} animate />);
    fireEvent.click(screen.getByRole("button", { name: "Show full answer" }));
    expect(screen.getByText(answer.followUpQuestion)).toBeInTheDocument();
    rerender(<AssistantMessage interaction={{ ...interaction }} animate />);
    expect(screen.queryByRole("button", { name: "Show full answer" })).toBeNull();
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByText(answer.followUpQuestion)).toBeInTheDocument();
  });

  it("renders older history immediately without internal outcome labels", () => {
    render(<AssistantMessage interaction={{ ...interaction, status: "REDIRECTED" }} />);
    expect(screen.getByText(answer.followUpQuestion)).toBeInTheDocument();
    expect(screen.queryByText(/Educational redirection|completed|redirected/i)).toBeNull();
    expect(screen.queryByRole("button", { name: "Show full answer" })).toBeNull();
  });

  it("respects reduced motion", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    render(<AssistantMessage interaction={interaction} animate />);
    expect(screen.getByText(answer.followUpQuestion)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show full answer" })).toBeNull();
  });

  it("shows thinking for pending messages and friendly text for failures", () => {
    const { rerender } = render(<AssistantMessage interaction={{ ...interaction, status: "PENDING", assistantResponse: null }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Thinking…");
    rerender(<AssistantMessage interaction={{ ...interaction, status: "FAILED", assistantResponse: null, failureCode: "OUTPUT_REJECTED" }} />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText(/No answer was charged/)).toBeInTheDocument();
    expect(screen.queryByText(/OUTPUT_REJECTED|failed/i)).toBeNull();
  });
});
