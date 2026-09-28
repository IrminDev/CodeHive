import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { AssistantHistoryPage } from "./AssistantHistoryPage";

vi.mock("../api/assistant.api", () => ({
  getAssistantAvailability: vi.fn(), listAssistantHistory: vi.fn(),
}));
import { getAssistantAvailability, listAssistantHistory } from "../api/assistant.api";

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("AssistantHistoryPage", () => {
  it("loads conversation without assignment details and renders erased metadata", async () => {
    vi.mocked(getAssistantAvailability).mockResolvedValue({ available: false, reason: "ASSISTANCE_UNAVAILABLE",
      maximum: 2, used: 1, reserved: 0, remaining: 1, assistanceLevel: "CONCEPTUAL_ONLY",
      policyVersion: 1, pendingInteractionId: null });
    vi.mocked(listAssistantHistory).mockResolvedValue({ content: [{
      id: "interaction-1", sequence: 1, status: "COMPLETED", studentMessage: null,
      assistantResponse: null, contentErased: true, quotaCharged: true, failureCode: null,
      createdAt: "2026-01-01T00:00:00Z", completedAt: "2026-01-01T00:00:01Z",
    }], page: 0, size: 20, totalElements: 1, totalPages: 1, last: true });
    render(<MemoryRouter initialEntries={["/assignment/old-assignment/assistant-history"]}><Routes>
      <Route path="/assignment/:id/assistant-history" element={<AssistantHistoryPage />} />
    </Routes></MemoryRouter>);
    expect(await screen.findByText(/Conversation text permanently erased/)).toBeInTheDocument();
    expect(getAssistantAvailability).toHaveBeenCalledWith("old-assignment");
    expect(listAssistantHistory).toHaveBeenCalledWith("old-assignment");
    expect(screen.getByText("1 of 2")).toBeInTheDocument();
  });
});
