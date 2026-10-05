import type { Language } from "../types/assignment.types";

/** Editor work in progress, kept in the browser per student and assignment. */
export interface CodeDraft {
  user: string;
  assignment: string;
  language: Language;
  code: string;
  updatedAt: string;
}

const LANGUAGES: readonly Language[] = ["PYTHON", "JAVA", "CPP", "C"];

function draftKey(userId: string, assignmentId: string): string {
  return `codehive:draft:${userId}:${assignmentId}`;
}

export function loadCodeDraft(userId: string, assignmentId: string): CodeDraft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(userId, assignmentId));
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<CodeDraft>;
    const valid =
      draft.user === userId &&
      draft.assignment === assignmentId &&
      typeof draft.code === "string" &&
      LANGUAGES.includes(draft.language as Language);
    return valid ? (draft as CodeDraft) : null;
  } catch {
    return null;
  }
}

export function saveCodeDraft(userId: string, assignmentId: string, language: Language, code: string): void {
  const draft: CodeDraft = { user: userId, assignment: assignmentId, language, code, updatedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(draftKey(userId, assignmentId), JSON.stringify(draft));
  } catch {
    // Storage can be full or blocked (private mode); the editor keeps working without a draft.
  }
}

export function clearCodeDraft(userId: string, assignmentId: string): void {
  try {
    window.localStorage.removeItem(draftKey(userId, assignmentId));
  } catch {
    // Nothing to clean when storage is unavailable.
  }
}

export interface InitialCodeSources {
  allowedLanguages: readonly Language[];
  templates: Record<Language, string>;
  draft: CodeDraft | null;
  submitted: { language: Language; code: string } | null;
}

/** Editor content on entry: the local draft wins, then the delivered code, then the starter template. */
export function resolveInitialCode({ allowedLanguages, templates, draft, submitted }: InitialCodeSources): {
  language: Language;
  code: string;
} {
  if (draft && allowedLanguages.includes(draft.language)) return { language: draft.language, code: draft.code };
  if (submitted && allowedLanguages.includes(submitted.language)) return submitted;
  const language = allowedLanguages[0] ?? "PYTHON";
  return { language, code: templates[language] ?? "" };
}
