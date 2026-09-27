import { X } from "lucide-react";
import { useAssignmentAssistant } from "../hooks/useAssignmentAssistant";
import type { Language } from "../types/assignment.types";
import { AssistantComposer } from "./AssistantComposer";
import { AssistantMessage } from "./AssistantMessage";
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

export function AssistantPanel({ assignmentId, language, code, onClose }: {
  assignmentId: string; language: Language; code: string; onClose: () => void;
}) {
  const assistant = useAssignmentAssistant(assignmentId);
  const reason = availabilityText(assistant.availability?.reason ?? null);

  return <aside role="dialog" aria-modal="false" aria-label="AI educational assistant"
    className="fixed inset-x-2 bottom-2 top-14 z-50 flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-dark-card sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:h-[min(720px,calc(100vh-5rem))] sm:w-[420px]">
    <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
      <div><h2 className="text-sm font-bold">AI educational assistant</h2><p className="text-[11px] text-gray-500">Guidance, not complete solutions</p></div>
      <button type="button" onClick={onClose} aria-label="Close assistant" className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={18} /></button>
    </header>
    {assistant.availability && <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-2">
      <AssistantQuota availability={assistant.availability} />
      {assistant.availability.assistanceLevel && <p className="mt-1 text-[11px] text-gray-500">Allowed help: {LEVEL_LABELS[assistant.availability.assistanceLevel]}</p>}
    </div>}
    <div className="flex-1 overflow-y-auto space-y-3 p-4" aria-live="polite">
      {assistant.loading && <p className="text-sm text-gray-500">Loading assistant history…</p>}
      {!assistant.loading && assistant.nextPage !== null && <button type="button" onClick={() => void assistant.loadOlder()} className="text-xs text-azure">Load older questions</button>}
      {!assistant.loading && assistant.interactions.length === 0 && <p className="text-sm text-gray-500">No questions yet. Ask for a concept or hint when assistance is available.</p>}
      {assistant.interactions.map((interaction) => <AssistantMessage key={interaction.id} interaction={interaction} />)}
      {assistant.sending && <p className="text-xs text-azure">Checking response and current policy before showing answer…</p>}
    </div>
    {assistant.lastResult?.executionUnavailable && <p className="px-4 text-xs text-orange-600">No finished execution result was available to include.</p>}
    {assistant.lastResult?.historyTruncated && <p className="px-4 text-xs text-gray-500">Older conversation was omitted from this answer’s context.</p>}
    {reason && <p className="mx-4 mb-2 rounded-lg bg-gray-100 dark:bg-gray-800 p-2 text-xs" role="status">{reason}</p>}
    {assistant.error && <div role="alert" className="mx-4 mb-2 rounded-lg bg-red-500/10 p-2 text-xs text-red-600 dark:text-red-400">
      {assistant.error} <button type="button" className="underline" onClick={() => void assistant.retry()}>{assistant.hasRetry ? "Retry same request" : "Refresh history"}</button>
    </div>}
    <AssistantComposer disabled={assistant.loading || !assistant.availability?.available || assistant.sending}
      sending={assistant.sending} language={language} code={code} onSend={assistant.submit} />
  </aside>;
}
