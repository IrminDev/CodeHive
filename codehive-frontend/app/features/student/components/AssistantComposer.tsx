import { ChevronDown, LoaderCircle, Send, ShieldCheck } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { Language } from "../types/assignment.types";

const DISCLAIMER_VERSION = "v1";

function consentKey(userId: string) {
  return `codehive:assistant-disclaimer:${DISCLAIMER_VERSION}:${userId}`;
}

export function AssistantComposer({ userId, disabled, sending, language, code, onSend }: {
  userId: string; disabled: boolean; sending: boolean; language: Language; code: string;
  onSend: (message: string, language: Language, code: string, includeCode: boolean, includeExecution: boolean) => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [includeCode, setIncludeCode] = useState(false);
  const [includeExecution, setIncludeExecution] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const id = useId();
  const codeInvalid = includeCode && (!code.trim() || code.length > 32768);
  const controlsDisabled = disabled || sending;

  useEffect(() => {
    try { setAccepted(window.localStorage.getItem(consentKey(userId)) === "accepted"); }
    catch { setAccepted(false); }
    setShowDisclaimer(false);
  }, [userId]);

  function acceptDisclaimer() {
    try { window.localStorage.setItem(consentKey(userId), "accepted"); }
    catch { /* Consent remains valid for this open session. */ }
    setAccepted(true);
    setShowDisclaimer(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (disabled || sending || !accepted || !message.trim() || codeInvalid) return;
    const snapshot = { message, language, code, includeCode, includeExecution };
    setMessage("");
    setIncludeCode(false);
    setIncludeExecution(false);
    await onSend(snapshot.message, snapshot.language, snapshot.code, snapshot.includeCode, snapshot.includeExecution);
  }

  return <form onSubmit={(event) => void submit(event)} className="max-h-[48%] shrink-0 space-y-3 overflow-y-auto border-t border-gray-200 bg-gray-50 p-4 text-gray-900 dark:border-gray-700/60 dark:bg-dark-surface dark:text-gray-100">
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={`${id}-question`} className="text-xs font-semibold">Ask for help with this assignment</label>
        <span id={`${id}-count`} className="shrink-0 text-[11px] tabular-nums text-gray-500 dark:text-gray-400">{message.length}/2,000</span>
      </div>
      <textarea id={`${id}-question`} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000}
        aria-describedby={`${id}-count`} disabled={controlsDisabled} rows={3} placeholder="What concept or step is confusing?"
        className="block w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-azure disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-dark-card dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-yellow" />
    </div>
    <fieldset disabled={controlsDisabled} aria-describedby={`${id}-context-note`}>
      <legend className="mb-2 flex items-center gap-2 text-xs font-semibold">
        Context to share <span className="font-normal text-gray-500 dark:text-gray-400">Optional</span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${controlsDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-gray-400 dark:hover:border-gray-500"} ${includeCode ? "border-azure/40 bg-azure/5 dark:border-yellow/40 dark:bg-yellow/5" : "border-gray-200 bg-white dark:border-gray-700 dark:bg-dark-card"}`}>
          <input type="checkbox" checked={includeCode} onChange={(event) => setIncludeCode(event.target.checked)}
            aria-describedby={`${id}-code-description${codeInvalid ? ` ${id}-code-error` : ""}`} aria-invalid={codeInvalid || undefined}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-[inherit] rounded accent-azure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure focus-visible:ring-offset-2 dark:accent-yellow dark:focus-visible:ring-yellow dark:focus-visible:ring-offset-dark-card" />
          <span className="min-w-0">
            <span className="block text-xs font-medium">Current editor code</span>
            <span id={`${id}-code-description`} className="mt-0.5 block text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">Share your code with AI for this question.</span>
          </span>
        </label>
        <label className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${controlsDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-gray-400 dark:hover:border-gray-500"} ${includeExecution ? "border-azure/40 bg-azure/5 dark:border-yellow/40 dark:bg-yellow/5" : "border-gray-200 bg-white dark:border-gray-700 dark:bg-dark-card"}`}>
          <input type="checkbox" checked={includeExecution} onChange={(event) => setIncludeExecution(event.target.checked)}
            aria-describedby={`${id}-execution-description`}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-[inherit] rounded accent-azure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure focus-visible:ring-offset-2 dark:accent-yellow dark:focus-visible:ring-yellow dark:focus-visible:ring-offset-dark-card" />
          <span className="min-w-0">
            <span className="block text-xs font-medium">Latest execution result</span>
            <span id={`${id}-execution-description`} className="mt-0.5 block text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">Share your latest finished run for this assignment.</span>
          </span>
        </label>
      </div>
      {codeInvalid && <p id={`${id}-code-error`} role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">Editor code must be nonempty and at most 32,768 characters.</p>}
      <p id={`${id}-context-note`} className="mt-2 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">Sharing applies only to this question. Both choices reset after sending.</p>
    </fieldset>
    {!accepted && <div className="rounded-xl border border-gray-200 bg-white text-xs dark:border-gray-700 dark:bg-dark-card">
      <button type="button" onClick={() => setShowDisclaimer((open) => !open)} aria-expanded={showDisclaimer} aria-controls={`${id}-disclaimer`}
        className="flex w-full items-center gap-2 rounded-xl p-3 text-left font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:text-gray-200 dark:hover:bg-gray-800 dark:focus-visible:ring-yellow">
        <ShieldCheck size={16} aria-hidden="true" className="shrink-0 text-azure dark:text-yellow" />
        <span className="flex-1">Review AI data sharing before asking</span>
        <ChevronDown size={14} aria-hidden="true" className={`shrink-0 transition-transform motion-reduce:transition-none ${showDisclaimer ? "rotate-180" : ""}`} />
      </button>
      {showDisclaimer && <div id={`${id}-disclaimer`} className="border-t border-gray-200 p-3 leading-relaxed text-gray-600 dark:border-gray-700 dark:text-gray-300">
        <p>Asking sends your question, public assignment details, and relevant earlier assistant messages to Google Gemini to generate help. Your current editor code and latest finished execution result are sent only if you select their sharing checkboxes above. Avoid including personal or sensitive information in your question or code.</p>
        <button type="button" onClick={acceptDisclaimer} className="mt-3 rounded-lg bg-azure px-3 py-2 font-semibold text-white transition-colors hover:bg-french focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure focus-visible:ring-offset-2 dark:focus-visible:ring-yellow dark:focus-visible:ring-offset-dark-card">I understand and accept</button>
      </div>}
    </div>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="max-w-64 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">Answers are checked before display and never inserted into your editor.</p>
      <button type="submit" disabled={controlsDisabled || !accepted || !message.trim() || codeInvalid}
        className="ml-auto inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-azure px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-french focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-yellow dark:focus-visible:ring-offset-dark-surface">
        {sending ? <LoaderCircle size={14} aria-hidden="true" className="motion-safe:animate-spin" /> : <Send size={14} aria-hidden="true" />}
        {sending ? "Thinking…" : "Ask assistant"}
      </button>
    </div>
  </form>;
}
