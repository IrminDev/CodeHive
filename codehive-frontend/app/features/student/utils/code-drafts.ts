import type { Language } from "../types/assignment.types";

const DRAFT_PREFIX = "codehive:draft:v1";

export interface CodeDraft {
  language: Language;
  code: Partial<Record<Language, string>>;
  updatedAt: string;
}

function draftKey(userId: string, assignmentId: string): string {
  return `${DRAFT_PREFIX}:${userId}:${assignmentId}`;
}

export function readCodeDraft(userId: string, assignmentId: string): CodeDraft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(userId, assignmentId));
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const draft = value as Partial<CodeDraft>;
    if (typeof draft.language !== "string" || !draft.code || typeof draft.code !== "object") return null;
    const code: Partial<Record<Language, string>> = {};
    for (const [language, source] of Object.entries(draft.code)) {
      if (typeof source === "string") code[language as Language] = source;
    }
    return { language: draft.language, code, updatedAt: typeof draft.updatedAt === "string" ? draft.updatedAt : "" };
  } catch {
    return null;
  }
}

/** Returns false when the browser refused the write, so the editor can say the draft is not saved. */
export function writeCodeDraft(userId: string, assignmentId: string, draft: Omit<CodeDraft, "updatedAt">): boolean {
  try {
    window.localStorage.setItem(draftKey(userId, assignmentId),
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
    return true;
  } catch {
    return false;
  }
}
