import type { AssistantInteraction } from "../types/assistant.types";

function SafeAnswer({ text }: { text: string }) {
  return <div className="space-y-2 text-sm whitespace-pre-wrap break-words">
    {text.split(/(```[\s\S]*?```)/g).filter(Boolean).map((part, index) => part.startsWith("```") && part.endsWith("```")
      ? <pre key={index} className="overflow-x-auto rounded-lg bg-gray-100 dark:bg-gray-900 p-3 text-xs"><code>{part.slice(3, -3).replace(/^[^\n]*\n/, "")}</code></pre>
      : <p key={index}>{part}</p>)}
  </div>;
}

export function AssistantMessage({ interaction }: { interaction: AssistantInteraction }) {
  return <article className="space-y-2 rounded-xl border border-gray-200 dark:border-gray-700 p-3" data-testid={`assistant-interaction-${interaction.sequence}`}>
    <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
      <span>#{interaction.sequence} · {interaction.status === "REDIRECTED" ? "Educational redirection" : interaction.status.toLowerCase()}</span>
      <span>{new Date(interaction.createdAt).toLocaleString()}</span>
    </div>
    {interaction.contentErased ? <p className="text-sm italic text-gray-500">Conversation text permanently erased when group was archived or deleted.</p> : <>
      {interaction.studentMessage && <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-2 text-sm whitespace-pre-wrap break-words"><span className="sr-only">Your question: </span>{interaction.studentMessage}</div>}
      {interaction.assistantResponse && <div className="text-gray-800 dark:text-gray-200"><span className="sr-only">Assistant answer: </span><SafeAnswer text={interaction.assistantResponse} /></div>}
      {interaction.status === "PENDING" && <p className="text-xs text-azure">Checking answer before display…</p>}
      {interaction.status === "BLOCKED" && <p className="text-xs text-orange-600 dark:text-orange-400">Prompt blocked by educational safeguards. No answer charged.</p>}
      {(interaction.status === "FAILED" || interaction.status === "CANCELLED") && <p className="text-xs text-red-600 dark:text-red-400">No answer delivered or charged ({interaction.failureCode ?? interaction.status}).</p>}
    </>}
  </article>;
}
