import { Fragment, useEffect, useState, type ReactNode } from "react";
import Prism, { type TokenStream } from "prismjs";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-python";
import "prismjs/components/prism-typescript";
import type { AssistantInteraction } from "../types/assistant.types";

const LANGUAGE_ALIASES: Record<string, string> = {
  "c++": "cpp", cxx: "cpp", py: "python", js: "javascript", ts: "typescript",
  html: "markup", xml: "markup",
};

const TOKEN_COLORS: Record<string, string> = {
  comment: "text-gray-500 dark:text-gray-400",
  keyword: "text-purple-700 dark:text-purple-300",
  string: "text-green-700 dark:text-green-300",
  char: "text-green-700 dark:text-green-300",
  number: "text-orange-700 dark:text-orange-300",
  boolean: "text-orange-700 dark:text-orange-300",
  function: "text-blue-700 dark:text-blue-300",
  "class-name": "text-teal-700 dark:text-teal-300",
  builtin: "text-teal-700 dark:text-teal-300",
  operator: "text-pink-700 dark:text-pink-300",
};

function renderTokens(stream: TokenStream): ReactNode {
  if (typeof stream === "string") return stream;
  if (Array.isArray(stream)) return stream.map((token, index) => <Fragment key={index}>{renderTokens(token)}</Fragment>);
  return <span className={TOKEN_COLORS[stream.type]}>{renderTokens(stream.content)}</span>;
}

function HighlightedCode({ code, language }: { code: string; language: string }) {
  const name = language.trim().toLowerCase();
  const grammar = Prism.languages[LANGUAGE_ALIASES[name] ?? name];
  return <pre className="overflow-x-auto rounded-lg bg-gray-100 p-3 text-xs dark:bg-gray-900"><code>{grammar ? renderTokens(Prism.tokenize(code, grammar)) : code}</code></pre>;
}

interface StructuredAnswer {
  explanation: string;
  snippets: Array<{ language: string; code: string }>;
  followUpQuestion: string;
}

function parseAnswer(text: string): StructuredAnswer | null {
  try {
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== "object") return null;
    const answer = value as Record<string, unknown>;
    if (typeof answer.explanation !== "string" || !Array.isArray(answer.snippets)
      || typeof answer.followUpQuestion !== "string"
      || !answer.snippets.every((snippet: unknown) => snippet !== null && typeof snippet === "object"
        && typeof (snippet as Record<string, unknown>).language === "string"
        && typeof (snippet as Record<string, unknown>).code === "string")) return null;
    return answer as unknown as StructuredAnswer;
  } catch { return null; }
}

function SafeAnswer({ text, limit = Infinity }: { text: string; limit?: number }) {
  const answer = parseAnswer(text);
  let remaining = limit;
  function reveal(value: string) {
    const visible = value.slice(0, Math.max(0, remaining));
    remaining -= value.length;
    return visible;
  }
  if (answer) return <div className="space-y-3 text-sm break-words">
    <p className="whitespace-pre-wrap">{reveal(answer.explanation)}</p>
    {answer.snippets.map((snippet, index) => {
      const code = reveal(snippet.code);
      return code && <div key={index}>
      <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">{snippet.language}</p>
      <HighlightedCode code={code} language={snippet.language} />
    </div>; })}
    {remaining > 0 && answer.followUpQuestion && <p className="whitespace-pre-wrap border-l-2 border-violet-300 pl-3 font-medium text-violet-700 dark:border-violet-500 dark:text-violet-300">{reveal(answer.followUpQuestion)}</p>}
  </div>;
  return <div className="space-y-2 text-sm whitespace-pre-wrap break-words">
    {text.split(/(```[\s\S]*?```)/g).filter(Boolean).map((part, index) => {
      if (!part.startsWith("```") || !part.endsWith("```")) return <p key={index}>{reveal(part)}</p>;
      const fenced = part.slice(3, -3);
      const firstLine = fenced.indexOf("\n");
      const code = reveal(firstLine < 0 ? fenced : fenced.slice(firstLine + 1));
      return code && <HighlightedCode key={index} language={firstLine < 0 ? "" : fenced.slice(0, firstLine)} code={code} />;
    })}
  </div>;
}

function RevealedAnswer({ text, animate }: { text: string; animate: boolean }) {
  const [limit, setLimit] = useState(animate ? 0 : Infinity);
  useEffect(() => {
    if (!animate) { setLimit(Infinity); return; }
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (preference?.matches) { setLimit(Infinity); return; }
    setLimit(0);
    const step = Math.max(4, Math.ceil(text.length / 80));
    const timer = window.setInterval(() => setLimit((current) => {
      const next = current + step;
      if (next >= text.length) { window.clearInterval(timer); return Infinity; }
      return next;
    }), 32);
    const reduceMotion = () => {
      if (preference?.matches) { window.clearInterval(timer); setLimit(Infinity); }
    };
    preference?.addEventListener("change", reduceMotion);
    return () => { window.clearInterval(timer); preference?.removeEventListener("change", reduceMotion); };
  }, [text, animate]);
  const revealing = limit < text.length;
  return <>
    <div aria-live={animate ? "polite" : "off"} aria-atomic="true" aria-busy={revealing}><SafeAnswer text={text} limit={limit} /></div>
    {revealing && <button type="button" onClick={() => setLimit(Infinity)} className="mt-2 text-xs text-gray-500 underline dark:text-gray-400">Show full answer</button>}
  </>;
}

export function AssistantThinking() {
  return <div role="status" className="flex items-center gap-2 py-1 text-sm text-gray-500 dark:text-gray-400">
    <span aria-hidden="true" className="flex gap-1">
      {[0, 1, 2].map((dot) => <span key={dot} className="h-1.5 w-1.5 rounded-full bg-violet-500 motion-safe:animate-bounce" style={{ animationDelay: `${dot * 150}ms` }} />)}
    </span>
    Thinking…
  </div>;
}

export function StudentChatBubble({ message }: { message: string }) {
  return <div className="ml-auto max-w-[88%] space-y-1">
    <p className="text-right text-[11px] font-medium text-gray-500 dark:text-gray-400">You</p>
    <div className="rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3 text-sm whitespace-pre-wrap break-words text-white">{message}</div>
  </div>;
}

export function AssistantChatBubble({ children }: { children: ReactNode }) {
  return <div className="mr-auto min-w-0 max-w-[94%] space-y-1">
    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">CodeHive assistant</p>
    <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 text-gray-800 dark:bg-gray-800 dark:text-gray-200">{children}</div>
  </div>;
}

export function AssistantMessage({ interaction, animate = false }: { interaction: AssistantInteraction; animate?: boolean }) {
  return <article className="space-y-4" data-testid={`assistant-interaction-${interaction.sequence}`}>
    {interaction.contentErased ? <p className="text-sm italic text-gray-500">Conversation text permanently erased when group was archived or deleted.</p> : <>
      {interaction.studentMessage && <StudentChatBubble message={interaction.studentMessage} />}
      <AssistantChatBubble>
        {interaction.assistantResponse && <RevealedAnswer text={interaction.assistantResponse} animate={animate} />}
        {interaction.status === "PENDING" && <AssistantThinking />}
        {interaction.status === "BLOCKED" && <p className="text-sm">I couldn’t help with that request. Try asking about a concept or a step you’re stuck on. No answer was charged.</p>}
        {interaction.status === "FAILED" && <p className="text-sm">I couldn’t provide an answer this time. Please try again. No answer was charged.</p>}
        {interaction.status === "CANCELLED" && <p className="text-sm">This request stopped because access or assignment settings changed. No answer was charged.</p>}
      </AssistantChatBubble>
    </>}
    <p className="text-center text-[10px] text-gray-400 dark:text-gray-500"><time dateTime={interaction.createdAt}>{new Date(interaction.createdAt).toLocaleString()}</time></p>
  </article>;
}
