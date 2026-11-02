import { describe, expect, it } from "vitest";

import { hasUsableDraft, resolveInitialCode, type CodeDraft } from "./code-drafts";

function draft(language: CodeDraft["language"], code: CodeDraft["code"]): CodeDraft {
  return { language, code, updatedAt: "2026-10-31T00:00:00.000Z" };
}

const delivered = { language: "JAVA" as const, sourceCode: "class Main {}" };

describe("hasUsableDraft", () => {
  it("needs code in a language the assignment still allows", () => {
    expect(hasUsableDraft(null, ["PYTHON"])).toBe(false);
    expect(hasUsableDraft(draft("PYTHON", {}), ["PYTHON"])).toBe(false);
    expect(hasUsableDraft(draft("C", { C: "int main;" }), ["PYTHON"])).toBe(false);
    expect(hasUsableDraft(draft("PYTHON", { PYTHON: "print(1)" }), ["PYTHON"])).toBe(true);
  });
});

describe("resolveInitialCode", () => {
  it("restores the local draft first", () => {
    const stored = draft("PYTHON", { PYTHON: "print(1)", JAVA: "class Draft {}" });

    expect(resolveInitialCode(["PYTHON", "JAVA"], stored, delivered)).toEqual({ language: "PYTHON", code: stored.code });
  });

  it("shows the delivered code when there is no draft", () => {
    expect(resolveInitialCode(["PYTHON", "JAVA"], null, delivered)).toEqual({
      language: "JAVA",
      code: { JAVA: "class Main {}" },
    });
  });

  it("shows the delivered code when the draft only stored a language choice", () => {
    expect(resolveInitialCode(["PYTHON", "JAVA"], draft("PYTHON", {}), delivered)).toEqual({
      language: "JAVA",
      code: { JAVA: "class Main {}" },
    });
  });

  it("falls back to the first allowed language's template", () => {
    expect(resolveInitialCode(["CPP", "C"], null, null)).toEqual({ language: "CPP", code: {} });
  });

  it("skips sources in a language the assignment no longer allows", () => {
    const stored = draft("C", { C: "int main;" });

    expect(resolveInitialCode(["PYTHON", "JAVA"], stored, delivered)).toEqual({
      language: "JAVA",
      code: { C: "int main;", JAVA: "class Main {}" },
    });
    expect(resolveInitialCode(["PYTHON"], stored, delivered)).toEqual({ language: "PYTHON", code: { C: "int main;" } });
  });
});
