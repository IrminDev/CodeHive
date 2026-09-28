import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { useAssignmentAssistant } from "../hooks/useAssignmentAssistant";
import type { Language } from "../types/assignment.types";
import { AssistantComposer } from "./AssistantComposer";
import { AssistantChatBubble, AssistantMessage, AssistantThinking, StudentChatBubble } from "./AssistantMessage";
import { AssistantQuota } from "./AssistantQuota";

function availabilityText(reason: string | null): string | null {
  switch (reason) {
    case "GLOBAL_DISABLED": return "AI assistance is not available yet. Earlier conversation remains readable.";
    case "ASSISTANT_DISABLED": return "Professor disabled AI assistance for this assignment. Earlier conversation remains readable.";
    case "QUOTA_EXHAUSTED": return "Answer quota exhausted. Earlier conversation remains readable.";
    case "ASSISTANCE_UNAVAILABLE": return "New assistance is unavailable because assignment, group, or enrollment is no longer eligible. Earlier conversation remains readable while group text is retained.";
    case "REQUEST_PENDING": return "One answer is being checked. New questions wait until it finishes.";
    default: return null;
  }
}

const LEVEL_LABELS = {
  CONCEPTUAL_ONLY: "Concepts only",
  EXPLANATIONS_AND_GUIDING: "Explanations and guidance, no code",
  EXPLANATIONS_GUIDING_AND_SNIPPETS: "Explanations, guidance, and short snippets",
} as const;

export function AssistantPanel({ assignmentId, userId, language, code, onClose }: {
  assignmentId: string; userId: string; language: Language; code: string; onClose: () => void;
}) {
  const assistant = useAssignmentAssistant(assignmentId);
  const reason = availabilityText(assistant.availability?.reason ?? null);
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);

  useEffect(() => {
    const element = viewport.current;
    if (element && followLatest.current) element.scrollTop = element.scrollHeight;
  }, [assistant.interactions, assistant.sending, assistant.pendingQuestion]);

  useEffect(() => {
    if (!content.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      const element = viewport.current;
      if (element && followLatest.current) element.scrollTop = element.scrollHeight;
    });
    observer.observe(content.current);
    return () => observer.disconnect();
  }, []);

  async function loadOlder() {
    const element = viewport.current;
    if (!element) return;
    const height = element.scrollHeight;
    const top = element.scrollTop;
    followLatest.current = false;
    await assistant.loadOlder();
    requestAnimationFrame(() => { element.scrollTop = top + element.scrollHeight - height; });
  }

  return <aside role="dialog" aria-modal="false" aria-label="AI educational assistant"
    className="fixed inset-x-2 bottom-2 top-2 z-50 flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-dark-card sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:h-[min(860px,calc(100vh-3rem))] sm:w-[min(760px,calc(100vw-3rem))]">
    <header className="flex shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
      <div><h2 className="text-sm font-bold">AI educational assistant</h2><Link to={`/assignment/${assignmentId}/assistant-history`} className="text-[11px] text-azure">Full history</Link></div>
      <button type="button" onClick={onClose} aria-label="Close assistant" className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={18} /></button>
    </header>
    {assistant.availability && <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-2">
      <AssistantQuota availability={assistant.availability} />
      {assistant.availability.assistanceLevel && <p className="mt-1 text-[11px] text-gray-500">Allowed help: {LEVEL_LABELS[assistant.availability.assistanceLevel]}</p>}
    </div>}
    <div ref={viewport} className="min-h-0 flex-1 overflow-y-auto p-4" aria-label="Conversation"
      onScroll={() => { const element = viewport.current; if (element) followLatest.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80; }}>
      <div ref={content} className="space-y-6">
      {assistant.loading && <p className="text-sm text-gray-500">Loading assistant history…</p>}
      {!assistant.loading && assistant.nextPage !== null && <button type="button" onClick={() => void loadOlder()} className="text-xs text-azure">Load older questions</button>}
      {!assistant.loading && !assistant.pendingQuestion && assistant.interactions.length === 0 && <p className="text-sm text-gray-500">No questions yet. Ask for a concept or hint when assistance is available.</p>}
      {assistant.interactions.map((interaction) => <AssistantMessage key={interaction.id} interaction={interaction} animate={interaction.id === assistant.revealInteractionId} />)}
      {assistant.pendingQuestion && <StudentChatBubble message={assistant.pendingQuestion} />}
      {assistant.sending && !assistant.interactions.some((interaction) => interaction.status === "PENDING") && <AssistantChatBubble><AssistantThinking /></AssistantChatBubble>}
      </div>
    </div>
    {assistant.lastResult?.executionUnavailable && <p className="px-4 text-xs text-orange-600">No finished execution result was available to include.</p>}
    {assistant.lastResult?.historyTruncated && <p className="px-4 text-xs text-gray-500">Older conversation was omitted from this answer’s context.</p>}
    {reason && <p className="mx-4 mb-2 rounded-lg bg-gray-100 dark:bg-gray-800 p-2 text-xs" role="status">{reason}</p>}
    {assistant.error && <div role="alert" className="mx-4 mb-2 rounded-lg bg-red-500/10 p-2 text-xs text-red-600 dark:text-red-400">
      {assistant.error} <button type="button" className="underline" onClick={() => void assistant.retry()}>{assistant.hasRetry ? "Retry same request" : "Refresh history"}</button>
    </div>}
    <AssistantComposer userId={userId} disabled={assistant.loading || !assistant.availability?.available || assistant.sending}
      sending={assistant.sending} language={language} code={code} onSend={async (...args) => { followLatest.current = true; await assistant.submit(...args); }} />
  </aside>;
}
