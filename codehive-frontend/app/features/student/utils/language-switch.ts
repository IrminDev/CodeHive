import type { Language } from "../types/assignment.types";

/**
 * Code to show after the student switches editor language. Work in progress is kept as-is;
 * only an untouched starter template (or an empty editor) is swapped for the new language's.
 */
export function codeAfterLanguageSwitch(
  currentCode: string,
  from: Language,
  to: Language,
  templates: Record<Language, string>,
): string {
  const untouched = currentCode.trim() === "" || currentCode === templates[from];
  return untouched ? templates[to] ?? "" : currentCode;
}
