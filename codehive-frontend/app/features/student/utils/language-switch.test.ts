import { describe, expect, it } from "vitest";

import type { Language } from "../types/assignment.types";
import { codeAfterLanguageSwitch } from "./language-switch";

const templates: Record<Language, string> = {
  PYTHON: "def solution():\n    pass\n",
  JAVA: "class Solution {\n\n}\n",
  CPP: "int main() {\n  return 0;\n}\n",
  C: "int main(void) {\n  return 0;\n}\n",
};

describe("codeAfterLanguageSwitch", () => {
  it("keeps the student's code when switching language", () => {
    const code = "n = int(input())\nprint(n * 2)\n";

    expect(codeAfterLanguageSwitch(code, "PYTHON", "CPP", templates)).toBe(code);
  });

  it("swaps an untouched starter template for the new language's template", () => {
    expect(codeAfterLanguageSwitch(templates.PYTHON, "PYTHON", "JAVA", templates)).toBe(templates.JAVA);
  });

  it("fills an empty editor with the new language's template", () => {
    expect(codeAfterLanguageSwitch("  \n", "PYTHON", "C", templates)).toBe(templates.C);
  });

  it("keeps code that only resembles another language's template", () => {
    expect(codeAfterLanguageSwitch(templates.JAVA, "PYTHON", "CPP", templates)).toBe(templates.JAVA);
  });
});
