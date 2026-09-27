import { useState } from "react";
import type { Language } from "../types/assignment.types";

export function AssistantComposer({ disabled, sending, language, code, onSend }: {
  disabled: boolean; sending: boolean; language: Language; code: string;
  onSend: (message: string, language: Language, code: string, includeCode: boolean, includeExecution: boolean) => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [includeCode, setIncludeCode] = useState(false);
  const [includeExecution, setIncludeExecution] = useState(false);
  const codeInvalid = includeCode && (!code.trim() || code.length > 32768);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (disabled || sending || !message.trim() || codeInvalid) return;
    const snapshot = { message, language, code, includeCode, includeExecution };
    setMessage("");
    setIncludeCode(false);
    setIncludeExecution(false);
    await onSend(snapshot.message, snapshot.language, snapshot.code, snapshot.includeCode, snapshot.includeExecution);
  }

  return <form onSubmit={(event) => void submit(event)} className="space-y-3 border-t border-gray-200 dark:border-gray-700 p-4">
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
    <button type="submit" disabled={disabled || sending || !message.trim() || codeInvalid}
      className="rounded-lg bg-azure px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{sending ? "Checking answer…" : "Ask assistant"}</button>
  </form>;
}
