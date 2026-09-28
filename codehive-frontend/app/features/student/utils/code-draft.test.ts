import { afterEach, describe, expect, it, vi } from "vitest";

import type { Language } from "../types/assignment.types";
import { clearCodeDraft, loadCodeDraft, resolveInitialCode, saveCodeDraft } from "./code-draft";

const USER = "00000000-0000-0000-0000-000000000001";
const ASSIGNMENT = "00000000-0000-0000-0000-000000000002";
const OTHER_USER = "00000000-0000-0000-0000-000000000003";

const templates: Record<Language, string> = {
  PYTHON: "def solution():\n    pass\n",
  JAVA: "class Solution {\n\n}\n",
  CPP: "int main() {\n  return 0;\n}\n",
  C: "int main(void) {\n  return 0;\n}\n",
};

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("code drafts", () => {
  it("stores user, assignment, language, and code and reads them back", () => {
    saveCodeDraft(USER, ASSIGNMENT, "CPP", "int main() { return 42; }\n");

    expect(loadCodeDraft(USER, ASSIGNMENT)).toMatchObject({
      user: USER,
      assignment: ASSIGNMENT,
      language: "CPP",
      code: "int main() { return 42; }\n",
    });
  });

  it("keeps each student's draft separate on a shared browser", () => {
    saveCodeDraft(USER, ASSIGNMENT, "PYTHON", "print(1)\n");

    expect(loadCodeDraft(OTHER_USER, ASSIGNMENT)).toBeNull();
  });

  it("ignores corrupted or foreign entries", () => {
    window.localStorage.setItem(`codehive:draft:${USER}:${ASSIGNMENT}`, "{not json");
    expect(loadCodeDraft(USER, ASSIGNMENT)).toBeNull();

    window.localStorage.setItem(
      `codehive:draft:${USER}:${ASSIGNMENT}`,
      JSON.stringify({ user: USER, assignment: ASSIGNMENT, language: "RUST", code: "fn main() {}" }),
    );
    expect(loadCodeDraft(USER, ASSIGNMENT)).toBeNull();
  });

  it("removes a draft", () => {
    saveCodeDraft(USER, ASSIGNMENT, "PYTHON", "print(1)\n");
    clearCodeDraft(USER, ASSIGNMENT);

    expect(loadCodeDraft(USER, ASSIGNMENT)).toBeNull();
  });

  it("keeps the editor usable when storage is unavailable", () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    expect(() => saveCodeDraft(USER, ASSIGNMENT, "PYTHON", "print(1)\n")).not.toThrow();
    expect(loadCodeDraft(USER, ASSIGNMENT)).toBeNull();
  });
});

describe("resolveInitialCode", () => {
  const allowed: Language[] = ["PYTHON", "CPP"];
  const draft = { user: USER, assignment: ASSIGNMENT, language: "CPP" as Language, code: "// wip\n", updatedAt: "" };
  const submitted = { language: "PYTHON" as Language, code: "print(92)\n" };

  it("restores the local draft first", () => {
    expect(resolveInitialCode({ allowedLanguages: allowed, templates, draft, submitted })).toEqual({ language: "CPP", code: "// wip\n" });
  });

  it("shows the delivered code when there is no draft", () => {
    expect(resolveInitialCode({ allowedLanguages: allowed, templates, draft: null, submitted })).toEqual(submitted);
  });

  it("falls back to the first allowed language's template", () => {
    expect(resolveInitialCode({ allowedLanguages: allowed, templates, draft: null, submitted: null })).toEqual({
      language: "PYTHON",
      code: templates.PYTHON,
    });
  });

  it("skips sources in a language the assignment no longer allows", () => {
    const javaDraft = { ...draft, language: "JAVA" as Language };
    const cSubmission = { language: "C" as Language, code: "int main(void) { return 0; }\n" };

    expect(resolveInitialCode({ allowedLanguages: allowed, templates, draft: javaDraft, submitted: cSubmission })).toEqual({
      language: "PYTHON",
      code: templates.PYTHON,
    });
  });
});
