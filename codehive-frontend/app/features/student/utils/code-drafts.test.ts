import { afterEach, describe, expect, it, vi } from "vitest";
import { readCodeDraft, writeCodeDraft } from "./code-drafts";

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

describe("code drafts", () => {
  it("round-trips a draft per user and assignment", () => {
    expect(writeCodeDraft("u1", "a1", { language: "JAVA", code: { JAVA: "class A {}", PYTHON: "pass" } })).toBe(true);
    expect(readCodeDraft("u1", "a1")).toMatchObject({ language: "JAVA", code: { JAVA: "class A {}", PYTHON: "pass" } });
    expect(readCodeDraft("u2", "a1")).toBeNull();
    expect(readCodeDraft("u1", "a2")).toBeNull();
  });
  it("ignores corrupt or malformed entries", () => {
    localStorage.setItem("codehive:draft:v1:u1:a1", "{not json");
    expect(readCodeDraft("u1", "a1")).toBeNull();
    localStorage.setItem("codehive:draft:v1:u1:a1", JSON.stringify({ language: "JAVA", code: { JAVA: 7, C: "int x;" } }));
    expect(readCodeDraft("u1", "a1")?.code).toEqual({ C: "int x;" });
  });
  it("reports a refused write instead of throwing", () => {
    vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("QuotaExceededError"); });
    expect(writeCodeDraft("u1", "a1", { language: "C", code: { C: "x" } })).toBe(false);
  });
});
