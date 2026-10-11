import { AlertCircle, ChartNoAxesColumnIncreasing, History, MessageCircle, RotateCcw, Sparkles, X } from "lucide-react";
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

const secondaryActionClass = "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:border-gray-700 dark:bg-dark-card dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-800 dark:focus-visible:ring-yellow";

export function AssistantPanel({ assignmentId, groupId, userId, language, code, onClose }: {
  assignmentId: string; groupId: string; userId: string; language: Language; code: string; onClose: () => void;
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
    className="fixed inset-x-2 bottom-2 top-2 z-50 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-2xl dark:border-gray-700/60 dark:bg-dark-card dark:text-gray-100 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:h-[min(860px,calc(100dvh-3rem))] sm:w-[min(760px,calc(100vw-3rem))]">
    <header className="shrink-0 space-y-3 border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700/60 dark:bg-dark-surface">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-azure/20 bg-azure/10 text-azure dark:border-yellow/20 dark:bg-yellow/10 dark:text-yellow"><Sparkles size={18} aria-hidden="true" /></span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">AI educational assistant</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Guidance for this assignment</p>
          </div>
        </div>
        <nav aria-label="Assistant resources" className="grid grid-cols-2 gap-2 justify-end sm:flex sm:flex-wrap">
          <Link to={`/assignment/${assignmentId}/assistant-history`} className={secondaryActionClass}><History size={14} aria-hidden="true" />Full history</Link>
          <Link to={`/groups/${encodeURIComponent(groupId)}/metrics#ai-usage`} className={secondaryActionClass}><ChartNoAxesColumnIncreasing size={14} aria-hidden="true" />My AI usage</Link>
          <button type="button" onClick={onClose} aria-label="Close assistant" title="Close assistant" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 dark:focus-visible:ring-yellow"><X size={18} aria-hidden="true" /></button>
        </nav>
      </div>

    </header>
    {assistant.availability && <div className="shrink-0 space-y-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700/60">
      <AssistantQuota availability={assistant.availability} />
      {assistant.availability.assistanceLevel && <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400"><span className="font-medium text-gray-700 dark:text-gray-300">Allowed help:</span> {LEVEL_LABELS[assistant.availability.assistanceLevel]}</p>}
    </div>}
    <div ref={viewport} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4" aria-label="Conversation" aria-busy={assistant.loading}
      onScroll={() => { const element = viewport.current; if (element) followLatest.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80; }}>
      <div ref={content} className="space-y-6">
      {assistant.loading && <div role="status" className="space-y-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">Loading assistant history…</p>
        <div aria-hidden="true" className="space-y-3 motion-safe:animate-pulse">
          <div className="ml-auto h-12 w-2/3 rounded-2xl bg-gray-100 dark:bg-gray-800" />
          <div className="h-20 w-5/6 rounded-2xl bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>}
      {!assistant.loading && assistant.nextPage !== null && <div className="flex justify-center"><button type="button" onClick={() => void loadOlder()} className={secondaryActionClass}><History size={14} aria-hidden="true" />Load older questions</button></div>}
      {!assistant.loading && !assistant.error && !assistant.pendingQuestion && assistant.interactions.length === 0 && <div className="mx-auto max-w-sm py-6 text-center">
        <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow"><MessageCircle size={22} aria-hidden="true" /></span>
        <h3 className="text-sm font-semibold">Start with a question</h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">Ask for a concept, a hint, or help understanding a result when assistance is available.</p>
      </div>}
      {assistant.interactions.map((interaction) => <AssistantMessage key={interaction.id} interaction={interaction} animate={interaction.id === assistant.revealInteractionId} />)}
      {assistant.pendingQuestion && <StudentChatBubble message={assistant.pendingQuestion} />}
      {assistant.sending && !assistant.interactions.some((interaction) => interaction.status === "PENDING") && <AssistantChatBubble><AssistantThinking /></AssistantChatBubble>}
      </div>
    </div>
    {(assistant.lastResult?.executionUnavailable || assistant.lastResult?.historyTruncated || reason || assistant.error) && <div className="max-h-[25%] shrink-0 space-y-2 overflow-y-auto px-4 pb-3">
      {assistant.lastResult?.executionUnavailable && <p className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-xs leading-relaxed text-orange-700 dark:text-orange-300">No finished execution result was available to include.</p>}
      {assistant.lastResult?.historyTruncated && <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">Older conversation was omitted from this answer’s context.</p>}
      {reason && <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-600 dark:border-gray-700 dark:bg-dark-surface dark:text-gray-300" role="status">{reason}</p>}
      {assistant.error && <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-700 dark:text-red-300">
        <div className="flex items-start gap-2"><AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" /><p className="min-w-0 break-words leading-relaxed">{assistant.error}</p></div>
        <button type="button" className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-2 font-medium transition-colors hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500" onClick={() => void assistant.retry()}><RotateCcw size={14} aria-hidden="true" />{assistant.hasRetry ? "Retry same request" : "Refresh history"}</button>
      </div>}
    </div>}
    <AssistantComposer userId={userId} disabled={assistant.loading || !assistant.availability?.available || assistant.sending}
      sending={assistant.sending} language={language} code={code} onSend={async (...args) => { followLatest.current = true; await assistant.submit(...args); }} />
  </aside>;
}
