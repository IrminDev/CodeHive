import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AssistantPanel } from "./AssistantPanel";
import type { AssistantAvailability, AssistantInteraction, AssistantMessageResult } from "../types/assistant.types";

vi.mock("../api/assistant.api", () => ({
  getAssistantAvailability: vi.fn(), listAssistantHistory: vi.fn(),
  getAssistantInteraction: vi.fn(), sendAssistantMessage: vi.fn(),
}));

import { getAssistantAvailability, listAssistantHistory, sendAssistantMessage } from "../api/assistant.api";

const availability: AssistantAvailability = {
  available: true, reason: null, maximum: 3, used: 0, reserved: 0, remaining: 3,
  assistanceLevel: "EXPLANATIONS_AND_GUIDING", policyVersion: 1, pendingInteractionId: null,
};

const interaction: AssistantInteraction = {
  id: "00000000-0000-0000-0000-000000000001", sequence: 1, status: "COMPLETED",
  studentMessage: "Why does this loop stop?", assistantResponse: "Check the boundary.",
  contentErased: false, quotaCharged: true, failureCode: null,
  createdAt: "2026-01-01T00:00:00Z", completedAt: "2026-01-01T00:00:01Z",
};

function setup(history: AssistantInteraction[] = [], state = availability, userId = "student-1") {
  vi.mocked(getAssistantAvailability).mockResolvedValue(state);
  vi.mocked(listAssistantHistory).mockResolvedValue({
    content: history, page: 0, size: 20, totalElements: history.length, totalPages: 1, last: true,
  });
  render(<MemoryRouter><AssistantPanel assignmentId="assignment-1" userId={userId} language="PYTHON" code="print(42)" onClose={() => {}} /></MemoryRouter>);
}

function acceptDisclaimer() {
  fireEvent.click(screen.getByRole("button", { name: "Review AI data sharing before asking" }));
  fireEvent.click(screen.getByRole("button", { name: "I understand and accept" }));
}

afterEach(() => { cleanup(); window.localStorage.clear(); vi.clearAllMocks(); });

describe("AssistantPanel", () => {
  it("omits editor code by default and displays answer only after validated POST returns", async () => {
    setup();
    let resolve!: (value: AssistantMessageResult) => void;
    vi.mocked(sendAssistantMessage).mockReturnValue(new Promise((done) => { resolve = done; }));
    await screen.findByText("3 of 3");
    acceptDisclaimer();
    expect((screen.getByLabelText(/Share current editor code/) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText(/Share my latest finished execution/) as HTMLInputElement).checked).toBe(false);
    fireEvent.change(screen.getByLabelText("Ask for help with this assignment"), { target: { value: "Why does this loop stop?" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask assistant" }));
    await waitFor(() => expect(sendAssistantMessage).toHaveBeenCalledOnce());
    expect(screen.getByText("Why does this loop stop?")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Thinking…");
    expect(vi.mocked(sendAssistantMessage).mock.calls[0][1]).toMatchObject({
      message: "Why does this loop stop?", language: "PYTHON", includeEditorCode: false, includeExecutionContext: false,
    });
    expect(vi.mocked(sendAssistantMessage).mock.calls[0][1]).not.toHaveProperty("editorCode");
    expect(screen.queryByText("Check the boundary.")).toBeNull();
    resolve({ interaction, availability: { ...availability, used: 1, remaining: 2 },
      editorIncluded: false, executionRequested: false, executionIncluded: false,
      executionUnavailable: false, historyTruncated: false });
    expect(await screen.findByText("Check the boundary.")).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getAllByText("Why does this loop stop?")).toHaveLength(1);
  });

  it("captures both opted-in contexts at send time", async () => {
    setup();
    vi.mocked(sendAssistantMessage).mockResolvedValue({ interaction, availability,
      editorIncluded: true, executionRequested: true, executionIncluded: true,
      executionUnavailable: false, historyTruncated: false });
    await screen.findByText("3 of 3");
    acceptDisclaimer();
    fireEvent.click(screen.getByLabelText(/Share current editor code/));
    fireEvent.click(screen.getByLabelText(/Share my latest finished execution/));
    fireEvent.change(screen.getByLabelText("Ask for help with this assignment"), { target: { value: "Help me" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask assistant" }));
    await waitFor(() => expect(sendAssistantMessage).toHaveBeenCalledOnce());
    expect(vi.mocked(sendAssistantMessage).mock.calls[0][1]).toMatchObject({
      editorCode: "print(42)", includeEditorCode: true, includeExecutionContext: true,
    });
    expect(vi.mocked(sendAssistantMessage).mock.calls[0][1]).not.toHaveProperty("executionId");
  });

  it("keeps archived metadata visible and blocks new questions", async () => {
    setup([{ ...interaction, studentMessage: null, assistantResponse: null, contentErased: true }],
      { ...availability, available: false, reason: "ASSISTANCE_UNAVAILABLE" });
    expect(await screen.findByText(/Conversation text permanently erased/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask assistant" })).toBeDisabled();
    expect(screen.queryByText("Check the boundary.")).toBeNull();
  });

  it("renders fenced model code as inert text", async () => {
    setup([{ ...interaction, assistantResponse: "Example:\n```html\n<img src=x onerror=alert(1)>\n```" }]);
    const article = await screen.findByTestId("assistant-interaction-1");
    expect(article.querySelector("code")?.textContent).toBe("<img src=x onerror=alert(1)>\n");
    expect(article.querySelector("code span")).not.toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("requires disclosure acceptance once per browser user", async () => {
    setup();
    await screen.findByText("3 of 3");
    fireEvent.change(screen.getByLabelText("Ask for help with this assignment"), { target: { value: "Help me" } });
    expect(screen.getByRole("button", { name: "Ask assistant" })).toBeDisabled();
    acceptDisclaimer();
    expect(screen.queryByRole("button", { name: "Review AI data sharing before asking" })).toBeNull();
    expect(screen.getByRole("button", { name: "Ask assistant" })).toBeEnabled();
    cleanup();
    setup();
    await screen.findByText("3 of 3");
    expect(screen.queryByRole("button", { name: "Review AI data sharing before asking" })).toBeNull();
    cleanup();
    setup([], availability, "student-2");
    await screen.findByText("3 of 3");
    expect(screen.getByRole("button", { name: "Review AI data sharing before asking" })).toBeInTheDocument();
  });

  it("renders structured answers as text and inert code", async () => {
    setup([{ ...interaction, assistantResponse: JSON.stringify({
      explanation: "Split the chain at k.",
      snippets: [{ language: "cpp", code: "int result = 1;" }],
      followUpQuestion: "Which intervals repeat?",
    }) }]);
    expect(await screen.findByText("Split the chain at k.")).toBeInTheDocument();
    expect(screen.getByText("cpp")).toBeInTheDocument();
    expect(screen.getByText("Which intervals repeat?")).toBeInTheDocument();
    const code = screen.getByTestId("assistant-interaction-1").querySelector("code");
    expect(code?.textContent).toBe("int result = 1;");
    expect(code?.querySelector("span[class*='text-']")).not.toBeNull();
  });
});
