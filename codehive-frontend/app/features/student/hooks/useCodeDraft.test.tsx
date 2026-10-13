import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readCodeDraft } from "../utils/code-drafts";
import { useCodeDraft } from "./useCodeDraft";

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

type Scope = { userId: string; assignmentId: string } | null;
const scopeA = { userId: "u1", assignmentId: "a1" };

describe("useCodeDraft", () => {
  it("saves after the debounce and reports the state", () => {
    const { result } = renderHook(() => useCodeDraft(scopeA, false));
    expect(result.current.status).toBe("idle");
    act(() => result.current.schedule({ language: "PYTHON", code: { PYTHON: "x = 1" } }));
    expect(result.current.status).toBe("saving");
    expect(readCodeDraft("u1", "a1")).toBeNull();
    act(() => { vi.advanceTimersByTime(500); });
    expect(result.current.status).toBe("saved");
    expect(readCodeDraft("u1", "a1")?.code.PYTHON).toBe("x = 1");
  });
  it("flushes a pending draft when the editor unmounts", () => {
    const { result, unmount } = renderHook(() => useCodeDraft(scopeA, false));
    act(() => result.current.schedule({ language: "C", code: { C: "int main;" } }));
    unmount();
    expect(readCodeDraft("u1", "a1")?.code.C).toBe("int main;");
  });
  it("writes a pending draft under its own assignment when the scope changes", () => {
    const { result, rerender } = renderHook(({ scope }: { scope: Scope }) => useCodeDraft(scope, false), { initialProps: { scope: scopeA as Scope } });
    act(() => result.current.schedule({ language: "C", code: { C: "from a1" } }));
    rerender({ scope: { userId: "u1", assignmentId: "a2" } });
    expect(readCodeDraft("u1", "a1")?.code.C).toBe("from a1");
    expect(readCodeDraft("u1", "a2")).toBeNull();
  });
});
