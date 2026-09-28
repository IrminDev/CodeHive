import { useEffect, useState } from "react";
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
  const codeInvalid = includeCode && (!code.trim() || code.length > 32768);

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

  return <form onSubmit={(event) => void submit(event)} className="max-h-[48%] shrink-0 space-y-3 overflow-y-auto border-t border-gray-200 dark:border-gray-700 p-4">
    <label htmlFor="assistant-question" className="block text-xs font-semibold">Ask for help with this assignment</label>
    <textarea id="assistant-question" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000}
      disabled={disabled || sending} rows={3} placeholder="What concept or step is confusing?"
      className="w-full resize-y rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-surface p-2 text-sm" />
    <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={includeCode} onChange={(event) => setIncludeCode(event.target.checked)} disabled={disabled || sending} />
      Share current editor code with AI for this question</label>
    <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={includeExecution} onChange={(event) => setIncludeExecution(event.target.checked)} disabled={disabled || sending} />
      Share my latest finished execution result for this assignment</label>
    {codeInvalid && <p role="alert" className="text-xs text-red-600">Editor code must be nonempty and at most 32,768 characters.</p>}
    <p className="text-[11px] text-gray-500">Both sharing choices apply only to this question and reset after sending. Answers are checked before display and never inserted into editor.</p>
    {!accepted && <div className="text-xs">
      <button type="button" onClick={() => setShowDisclaimer((open) => !open)} aria-expanded={showDisclaimer}
        className="font-medium text-azure underline">Review AI data sharing before asking</button>
      {showDisclaimer && <div className="mt-2 rounded-lg border border-azure/30 bg-azure/5 p-3 text-gray-700 dark:text-gray-200">
        <p>Asking sends your question, public assignment details, and relevant earlier assistant messages to Google Gemini to generate help. Your current editor code and latest finished execution result are sent only if you select their sharing checkboxes above. Avoid including personal or sensitive information in your question or code.</p>
        <button type="button" onClick={acceptDisclaimer} className="mt-3 rounded-lg bg-azure px-3 py-2 font-semibold text-white">I understand and accept</button>
      </div>}
    </div>}
    <button type="submit" disabled={disabled || sending || !accepted || !message.trim() || codeInvalid}
      className="rounded-lg bg-azure px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{sending ? "Thinking…" : "Ask assistant"}</button>
  </form>;
}
