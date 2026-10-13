import { Check, FileCode2, LoaderCircle, Send, ShieldCheck, Terminal } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { Language } from "../types/assignment.types";

const DISCLAIMER_VERSION = "v1";
const MAX_MESSAGE = 2000;
const MAX_CODE = 32768;

export const AI_SHARING_NOTICE = "Asking sends your question, public assignment details, and relevant earlier assistant messages to Google Gemini to generate help. Your current editor code and latest finished execution result are sent only when you turn on Code or Last run for that question. Avoid including personal or sensitive information in your question or code.";

function consentKey(userId: string) {
  return `codehive:assistant-disclaimer:${DISCLAIMER_VERSION}:${userId}`;
}

/** Acceptance is remembered per user and notice version in this browser. */
export function useAssistantConsent(userId: string) {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    try { setAccepted(window.localStorage.getItem(consentKey(userId)) === "accepted"); }
    catch { setAccepted(false); }
  }, [userId]);

  function accept() {
    try { window.localStorage.setItem(consentKey(userId), "accepted"); }
    catch { /* Consent remains valid for this open session. */ }
    setAccepted(true);
  }

  return { accepted, accept };
}

export function AssistantComposer({ accepted, onAccept, disabled, sending, language, code, message, onMessageChange, quotaLabel, focusSignal, onSend }: {
  accepted: boolean; onAccept: () => void; disabled: boolean; sending: boolean; language: Language; code: string;
  message: string; onMessageChange: (value: string) => void; quotaLabel: string | null; focusSignal: number;
  onSend: (message: string, language: Language, code: string, includeCode: boolean, includeExecution: boolean) => Promise<void>;
}) {
  const [includeCode, setIncludeCode] = useState(false);
  const [includeExecution, setIncludeExecution] = useState(false);
  const id = useId();
  const input = useRef<HTMLTextAreaElement>(null);
  const acceptButton = useRef<HTMLButtonElement>(null);
  const codeInvalid = includeCode && (!code.trim() || code.length > MAX_CODE);
  const locked = disabled || sending;
  const canSend = !locked && message.trim().length > 0 && !codeInvalid;

  useEffect(() => {
    const element = input.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 168)}px`;
  }, [message, accepted]);

  useEffect(() => {
    if (focusSignal === 0) return;
    (accepted ? input.current : acceptButton.current)?.focus({ preventScroll: true });
  }, [focusSignal, accepted]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSend) return;
    const snapshot = { message, includeCode, includeExecution };
    onMessageChange("");
    setIncludeCode(false);
    setIncludeExecution(false);
    await onSend(snapshot.message, language, code, snapshot.includeCode, snapshot.includeExecution);
  }

  if (!accepted) return <div className="shrink-0 border-t border-gray-200 p-3 dark:border-gray-800/60">
    <section aria-labelledby={`${id}-consent`} className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700/60 dark:bg-dark-surface">
      <h3 id={`${id}-consent`} className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-gray-100"><ShieldCheck size={15} aria-hidden="true" className="shrink-0 text-azure dark:text-yellow" />Before your first question</h3>
      <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">{AI_SHARING_NOTICE}</p>
      <button ref={acceptButton} type="button" onClick={onAccept} className="mt-3 inline-flex min-h-9 items-center rounded-lg bg-azure px-3 text-xs font-semibold text-white transition-colors hover:bg-french focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure focus-visible:ring-offset-2 dark:focus-visible:ring-yellow dark:focus-visible:ring-offset-dark-surface">I understand and accept</button>
    </section>
  </div>;

  return <form onSubmit={(event) => void submit(event)} className="shrink-0 border-t border-gray-200 p-3 dark:border-gray-800/60">
    <div className={`rounded-xl border bg-white transition-shadow focus-within:ring-2 focus-within:ring-azure dark:bg-dark-surface dark:focus-within:ring-yellow ${locked ? "border-gray-200 opacity-70 dark:border-gray-800" : "border-gray-300 dark:border-gray-700"}`}>
      <label htmlFor={`${id}-question`} className="sr-only">Ask for help with this assignment</label>
      <textarea ref={input} id={`${id}-question`} value={message} rows={1} maxLength={MAX_MESSAGE} disabled={locked}
        onChange={(event) => onMessageChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
          event.preventDefault();
          event.currentTarget.form?.requestSubmit();
        }}
        placeholder="Ask about a concept or the step you’re stuck on…" aria-describedby={`${id}-meta`}
        className="block max-h-[168px] min-h-[44px] w-full resize-none bg-transparent px-3 pt-3 pb-1 text-sm leading-relaxed text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed dark:text-gray-100 dark:placeholder:text-gray-500" />
      <div className="flex flex-wrap items-center gap-1.5 p-2">
        <ContextToggle checked={includeCode} disabled={locked} onChange={setIncludeCode} invalid={codeInvalid}
          icon={<FileCode2 size={13} aria-hidden="true" />} label="Code" description="Share your current editor code with this question only." />
        <ContextToggle checked={includeExecution} disabled={locked} onChange={setIncludeExecution}
          icon={<Terminal size={13} aria-hidden="true" />} label="Last run" description="Share your latest finished run for this assignment with this question only." />
        <button type="submit" disabled={!canSend}
          className="ml-auto inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg bg-azure px-3 text-xs font-semibold text-white transition-colors hover:bg-french focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 dark:focus-visible:ring-yellow dark:focus-visible:ring-offset-dark-surface">
          {sending ? <LoaderCircle size={13} aria-hidden="true" className="motion-safe:animate-spin" /> : <Send size={13} aria-hidden="true" />}
          {sending ? "Sending" : "Ask"}
        </button>
      </div>
    </div>
    {codeInvalid && <p role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">Editor code must be nonempty and at most 32,768 characters to be shared.</p>}
    <p id={`${id}-meta`} className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-gray-500 dark:text-gray-400">
      <span>{quotaLabel ?? "Enter to send · Shift+Enter for a new line"}</span>
      <span className={`shrink-0 tabular-nums ${message.length >= MAX_MESSAGE ? "font-medium text-orange-600 dark:text-orange-400" : ""}`}>{message.length.toLocaleString()}/{MAX_MESSAGE.toLocaleString()}</span>
    </p>
  </form>;
}

function ContextToggle({ checked, disabled, invalid = false, icon, label, description, onChange }: {
  checked: boolean; disabled: boolean; invalid?: boolean; icon: ReactNode; label: string; description: string;
  onChange: (value: boolean) => void;
}) {
  return <button type="button" role="switch" aria-checked={checked} aria-invalid={invalid || undefined} disabled={disabled}
    title={description} aria-label={`${label}: ${description}`} onClick={() => onChange(!checked)}
    className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure disabled:cursor-not-allowed dark:focus-visible:ring-yellow ${checked
      ? "border-azure/40 bg-azure/10 text-azure dark:border-yellow/40 dark:bg-yellow/10 dark:text-yellow"
      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:text-gray-100"}`}>
    {checked ? <Check size={13} aria-hidden="true" /> : icon}{label}
  </button>;
}
