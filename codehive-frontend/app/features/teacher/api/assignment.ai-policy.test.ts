import { afterEach, describe, expect, it, vi } from "vitest";
import { setAuthToken } from "~/core/storage/token.storage";
import { cloneAssignment, createAssignment, updateAiPolicy } from "./assignment.api";

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

describe("assignment AI policy API", () => {
  it("sends owner policy to immediate update endpoint", async () => {
    setAuthToken("token-1");
    const policy = { aiAssistanceEnabled: true, maxAiRequests: 3,
      aiAssistanceLevel: "EXPLANATIONS_AND_GUIDING" as const };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      success: true, data: { ...policy, aiPolicyVersion: 2 },
    }), { status: 200, headers: { "Content-Type": "application/json" } }));

    await expect(updateAiPolicy("assignment-id", policy)).resolves.toMatchObject(policy);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/assignments/assignment-id/ai-policy",
      expect.objectContaining({ method: "PUT", body: JSON.stringify(policy),
        headers: expect.objectContaining({ Authorization: "Bearer token-1" }) }),
    );
  });

  it("includes AI settings in create and clone payloads", async () => {
    setAuthToken("token-1");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      success: true, data: { id: "created" },
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const policy = { aiAssistanceEnabled: true, maxAiRequests: 4,
      aiAssistanceLevel: "EXPLANATIONS_GUIDING_AND_SNIPPETS" as const };
    await createAssignment({ ...policy, groupId: "group", title: "Loops", description: "Loops",
      constraints: [], hints: [], tags: [], timeLimitMs: 1000, memoryLimitMb: 128,
      comparatorType: "EXACT_MATCH", allowedLanguages: ["JAVA"], referenceLanguage: "JAVA",
      examples: [], maxPoints: 100, sampleFlags: [false] },
      new File(["class Main {}"], "Main.java"), [new File(["1"], "input.txt")]);
    const createBody = fetchMock.mock.calls[0][1]?.body as FormData;
    const metadata = JSON.parse(await (createBody.get("metadata") as Blob).text());
    expect(metadata).toMatchObject(policy);

    await cloneAssignment("source", { ...policy, targetGroupId: "other", title: "Loops",
      description: "Loops", constraints: [], hints: [], tags: [], timeLimitMs: 1000,
      memoryLimitMb: 128, comparatorType: "EXACT_MATCH", allowedLanguages: ["JAVA"],
      referenceLanguage: "JAVA", referenceSolution: "class Main {}", examples: [],
      testCases: [{ input: "1", sample: false }], maxPoints: 100 });
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string)).toMatchObject(policy);
  });
});
