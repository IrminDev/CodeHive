import { afterEach, describe, expect, it, vi } from "vitest";
import { setAuthToken } from "~/core/storage/token.storage";
import { ApiError } from "./client";
import { listAssistantHistory, sendAssistantMessage } from "./assistant.api";

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

describe("assistant API", () => {
  it("treats missing conversation history as empty and sends authenticated JSON", async () => {
    setAuthToken("student-token");
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "Not found" }), { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { interaction: { id: "one" } } }), { status: 200 }));
    expect((await listAssistantHistory("assignment-1")).content).toEqual([]);
    await sendAssistantMessage("assignment-1", { clientRequestId: "request-1", message: "Help", language: "PYTHON",
      includeEditorCode: false, includeExecutionContext: false });
    expect(fetchMock).toHaveBeenLastCalledWith("http://localhost:8080/api/assignments/assignment-1/assistant/interactions",
      expect.objectContaining({ method: "POST", body: expect.not.stringContaining("editorCode"),
        headers: expect.objectContaining({ Authorization: "Bearer student-token" }) }));
  });

  it("preserves machine error code and Retry-After", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ message: "Assistant request unavailable", error: "QUOTA_EXHAUSTED" }),
      { status: 429, headers: { "Retry-After": "60" } }));
    await expect(sendAssistantMessage("assignment-1", { clientRequestId: "request-1", message: "Help", language: "PYTHON",
      includeEditorCode: false, includeExecutionContext: false }))
      .rejects.toMatchObject({ status: 429, code: "QUOTA_EXHAUSTED", retryAfter: "60" } satisfies Partial<ApiError>);
  });
});
