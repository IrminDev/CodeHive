import { useCallback, useEffect, useRef, useState } from "react";
import { writeCodeDraft, type CodeDraft } from "../utils/code-drafts";

export type DraftStatus = "idle" | "saving" | "saved" | "error";
type DraftContent = Omit<CodeDraft, "updatedAt">;

const SAVE_DELAY_MS = 400;

/**
 * Keeps the editor draft in browser storage so route changes, reloads, and tab closes
 * do not lose the student's code. Call `schedule` with the next draft after each edit.
 */
export function useCodeDraft(scope: { userId: string; assignmentId: string } | null, hasStoredDraft: boolean) {
  const [status, setStatus] = useState<DraftStatus>("idle");
  // Holds its own ids, so a late write can never land under another assignment's key.
  const pending = useRef<{ userId: string; assignmentId: string; draft: DraftContent } | null>(null);
  const timer = useRef<number | null>(null);
  const userId = scope?.userId;
  const assignmentId = scope?.assignmentId;

  const flush = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    const item = pending.current;
    if (!item) return;
    pending.current = null;
    setStatus(writeCodeDraft(item.userId, item.assignmentId, item.draft) ? "saved" : "error");
  }, []);

  const schedule = useCallback((draft: DraftContent) => {
    if (!userId || !assignmentId) return;
    pending.current = { userId, assignmentId, draft };
    setStatus("saving");
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, SAVE_DELAY_MS);
  }, [userId, assignmentId, flush]);

  useEffect(() => {
    setStatus(hasStoredDraft ? "saved" : "idle");
    return flush;
  }, [userId, assignmentId, hasStoredDraft, flush]);

  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [flush]);

  return { status, schedule };
}
