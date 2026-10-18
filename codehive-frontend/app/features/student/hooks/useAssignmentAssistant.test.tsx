import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../api/client";
import * as api from "../api/assistant.api";
import type { AssistantAvailability, AssistantHistoryPage, AssistantInteraction, AssistantMessageResult } from "../types/assistant.types";
import { useAssignmentAssistant } from "./useAssignmentAssistant";

vi.mock("../api/assistant.api", () => ({
  getAssistantAvailability: vi.fn(),
  listAssistantHistory: vi.fn(),
  getAssistantInteraction: vi.fn(),
  sendAssistantMessage: vi.fn(),
}));

const ASSIGNMENT = "00000000-0000-0000-0000-000000000001";
const REQUEST = "00000000-0000-0000-0000-000000000002";
const FIRST = "00000000-0000-0000-0000-000000000003";
const SECOND = "00000000-0000-0000-0000-000000000004";
const availability: AssistantAvailability = {
  available: true, reason: null, maximum: 5, used: 0, reserved: 0, remaining: 5,
  assistanceLevel: "CONCEPTUAL_ONLY", policyVersion: 1, pendingInteractionId: null,
};

function interaction(id = FIRST, sequence = 1): AssistantInteraction {
  return { id, sequence, status: "COMPLETED", studentMessage: "Question", assistantResponse: "Reviewed hint",
    contentErased: false, quotaCharged: true, failureCode: null, createdAt: "2026-01-01T00:00:00Z",
    completedAt: "2026-01-01T00:00:01Z" };
}

function page(content: AssistantInteraction[] = [], last = true): AssistantHistoryPage {
  return { content, page: 0, size: 20, totalElements: content.length, totalPages: last ? 1 : 2, last };
}

function result(): AssistantMessageResult {
  return { interaction: interaction(), availability: { ...availability, used: 1, remaining: 4 },
    editorIncluded: false, executionRequested: false, executionIncluded: false,
    executionUnavailable: false, historyTruncated: false };
}

async function ready() {
  const hook = renderHook(() => useAssignmentAssistant(ASSIGNMENT));
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(crypto, "randomUUID").mockReturnValue(REQUEST);
  vi.mocked(api.getAssistantAvailability).mockResolvedValue(availability);
  vi.mocked(api.listAssistantHistory).mockResolvedValue(page());
  vi.mocked(api.sendAssistantMessage).mockResolvedValue(result());
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useAssignmentAssistant", () => {
  it("defers all requests until the assistant is enabled", async () => {
    const hook = renderHook(({ enabled }) => useAssignmentAssistant(ASSIGNMENT, enabled), {
      initialProps: { enabled: false },
    });
    expect(api.getAssistantAvailability).not.toHaveBeenCalled();
    expect(api.listAssistantHistory).not.toHaveBeenCalled();
    hook.rerender({ enabled: true });
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    expect(api.getAssistantAvailability).toHaveBeenCalledWith(ASSIGNMENT);
  });

  it("orders history chronologically and deduplicates older pages", async () => {
    vi.mocked(api.listAssistantHistory).mockResolvedValueOnce(page([interaction(SECOND, 2)], false))
      .mockResolvedValueOnce(page([interaction(SECOND, 2), interaction(FIRST, 1)]));
    const hook = await ready();
    await act(() => hook.result.current.loadOlder());
    expect(hook.result.current.interactions.map(item => item.id)).toEqual([FIRST, SECOND]);
    expect(api.listAssistantHistory).toHaveBeenLastCalledWith(ASSIGNMENT, 1);
    expect(hook.result.current.nextPage).toBeNull();
  });

  it("omits editor code unless opted in and dispatches usage refresh after delivery", async () => {
    const usageChanged = vi.fn();
    window.addEventListener("assistant-usage-changed", usageChanged);
    try {
      const hook = await ready();
      await act(() => hook.result.current.submit("  Explain loops  ", "JAVA", "private editor code", false, false));
      expect(api.sendAssistantMessage).toHaveBeenCalledWith(ASSIGNMENT, {
        clientRequestId: REQUEST, message: "Explain loops", language: "JAVA",
        includeEditorCode: false, includeExecutionContext: false,
      });
      expect(hook.result.current.interactions).toEqual([interaction()]);
      expect(hook.result.current.availability?.used).toBe(1);
      expect(hook.result.current.hasRetry).toBe(false);
      expect(usageChanged).toHaveBeenCalledTimes(1);
    } finally { window.removeEventListener("assistant-usage-changed", usageChanged); }
  });

  it("includes explicitly shared code at the maximum size and execution opt-in", async () => {
    const hook = await ready();
    const code = "x".repeat(32768);
    await act(() => hook.result.current.submit("Explain", "JAVA", code, true, true));
    expect(api.sendAssistantMessage).toHaveBeenCalledWith(ASSIGNMENT, expect.objectContaining({
      editorCode: code, includeEditorCode: true, includeExecutionContext: true,
    }));
  });

  it.each([
    ["   ", "code", false], ["Explain", "", true], ["Explain", "   ", true],
    ["Explain", "x".repeat(32769), true],
  ])("rejects invalid local input before sending (case %#)", async (message, code, includeCode) => {
    const hook = await ready();
    await act(() => hook.result.current.submit(message, "JAVA", code, includeCode, false));
    expect(api.sendAssistantMessage).not.toHaveBeenCalled();
  });

  it("prevents simultaneous submissions while preserving the pending question", async () => {
    let resolve!: (response: AssistantMessageResult) => void;
    vi.mocked(api.sendAssistantMessage).mockReturnValue(new Promise(done => { resolve = done; }));
    const hook = await ready();
    let first!: Promise<void>;
    act(() => { first = hook.result.current.submit("First question", "JAVA", "", false, false); });
    expect(hook.result.current.pendingQuestion).toBe("First question");
    await act(() => hook.result.current.submit("Duplicate question", "JAVA", "", false, false));
    expect(api.sendAssistantMessage).toHaveBeenCalledTimes(1);
    await act(async () => { resolve(result()); await first; });
    expect(hook.result.current.sending).toBe(false);
    expect(hook.result.current.pendingQuestion).toBeNull();
  });

  it("retries an interrupted request with the identical id and payload", async () => {
    vi.mocked(api.sendAssistantMessage).mockRejectedValueOnce(new Error("Network interrupted"))
      .mockResolvedValueOnce(result());
    const hook = await ready();
    await act(() => hook.result.current.submit("Explain", "JAVA", "shared code", true, false));
    expect(hook.result.current.hasRetry).toBe(true);
    expect(hook.result.current.error).toContain("Connection interrupted");
    await act(() => hook.result.current.retry());
    expect(vi.mocked(api.sendAssistantMessage).mock.calls[1]).toEqual(vi.mocked(api.sendAssistantMessage).mock.calls[0]);
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1);
    expect(hook.result.current.hasRetry).toBe(false);
  });

  it.each(["POLICY_CHANGED", "REQUEST_CANCELLED", "MODEL_TIMEOUT", "OUTPUT_REJECTED"])(
    "shows safe uncharged failure messaging for %s", async code => {
      vi.mocked(api.sendAssistantMessage).mockRejectedValueOnce(new ApiError("raw details", 409, undefined, code));
      const hook = await ready();
      await act(() => hook.result.current.submit("Explain", "JAVA", "", false, false));
      expect(hook.result.current.error).toContain("No answer was charged");
      expect(hook.result.current.error).not.toContain("raw details");
      expect(hook.result.current.interactions).toEqual([]);
    },
  );

  it("polls pending work, refreshes its terminal result, and cleans up the timer", async () => {
    vi.useFakeTimers();
    vi.mocked(api.getAssistantAvailability).mockResolvedValueOnce({
      ...availability, available: false, reason: "REQUEST_PENDING", pendingInteractionId: FIRST,
    }).mockResolvedValue(availability);
    vi.mocked(api.listAssistantHistory).mockResolvedValueOnce(page([{ ...interaction(), status: "PENDING" }]))
      .mockResolvedValue(page([interaction()]));
    vi.mocked(api.getAssistantInteraction).mockResolvedValue(interaction());
    const hook = renderHook(() => useAssignmentAssistant(ASSIGNMENT));
    await act(async () => { await Promise.resolve(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(api.getAssistantInteraction).toHaveBeenCalledWith(ASSIGNMENT, FIRST);
    expect(hook.result.current.interactions).toEqual([interaction()]);
    expect(hook.result.current.revealInteractionId).toBe(FIRST);
    hook.unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(6000); });
    expect(api.getAssistantInteraction).toHaveBeenCalledTimes(1);
  });
});
