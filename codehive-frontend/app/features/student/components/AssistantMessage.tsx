import { Fragment, useEffect, useState, type ReactNode } from "react";
import { CircleSlash, Sparkles } from "lucide-react";
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
  return <figure className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700/60">
    {name && <figcaption className="border-b border-gray-200 bg-gray-50 px-3 py-1 font-mono text-[11px] text-gray-500 dark:border-gray-700/60 dark:bg-dark-surface dark:text-gray-400">{language.trim()}</figcaption>}
    <pre className="overflow-x-auto bg-gray-50 p-3 font-mono text-xs leading-relaxed dark:bg-dark-bg"><code>{grammar ? renderTokens(Prism.tokenize(code, grammar)) : code}</code></pre>
  </figure>;
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
  if (answer) return <div className="space-y-3 break-words text-sm leading-relaxed">
    <p className="whitespace-pre-wrap">{reveal(answer.explanation)}</p>
    {answer.snippets.map((snippet, index) => {
      const code = reveal(snippet.code);
      return code && <HighlightedCode key={index} code={code} language={snippet.language} />;
    })}
    {remaining > 0 && answer.followUpQuestion && <p className="whitespace-pre-wrap border-l-2 border-azure/60 pl-3 font-medium text-gray-900 dark:border-yellow/60 dark:text-gray-100">{reveal(answer.followUpQuestion)}</p>}
  </div>;
  return <div className="space-y-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
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
    {revealing && <button type="button" onClick={() => setLimit(Infinity)} className="mt-2 rounded text-xs font-medium text-azure underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:text-yellow dark:focus-visible:ring-yellow">Show full answer</button>}
  </>;
}

function formatMoment(value: string): string {
  const date = new Date(value);
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return date.toDateString() === new Date().toDateString()
    ? time
    : `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time}`;
}

function Moment({ value }: { value: string }) {
  return <time dateTime={value} title={new Date(value).toLocaleString("en-US")} className="font-normal text-gray-400 dark:text-gray-500">{formatMoment(value)}</time>;
}

export function AssistantThinking() {
  return <div role="status" className="flex items-center gap-2 py-1 text-sm text-gray-500 dark:text-gray-400">
    <span aria-hidden="true" className="flex gap-1">
      {[0, 1, 2].map((dot) => <span key={dot} className="h-1.5 w-1.5 rounded-full bg-azure motion-safe:animate-bounce dark:bg-yellow" style={{ animationDelay: `${dot * 150}ms` }} />)}
    </span>
    Checking an answer…
  </div>;
}

export function StudentChatBubble({ message, time }: { message: string; time?: string }) {
  return <div className="flex flex-col items-end">
    <p className="mb-1 flex gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">You{time && <Moment value={time} />}</p>
    <div className="max-w-[88%] rounded-2xl rounded-br-md bg-azure px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words text-white">{message}</div>
  </div>;
}

export function AssistantChatBubble({ children, time }: { children: ReactNode; time?: string }) {
  return <div className="min-w-0">
    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
      <Sparkles size={12} aria-hidden="true" className="text-azure dark:text-yellow" />Assistant{time && <Moment value={time} />}
    </p>
    <div className="text-gray-800 dark:text-gray-200">{children}</div>
  </div>;
}

const OUTCOME_NOTICE: Partial<Record<AssistantInteraction["status"], string>> = {
  BLOCKED: "I couldn’t help with that request. Try asking about a concept or a step you’re stuck on. No answer was charged.",
  FAILED: "I couldn’t provide an answer this time. Please try again. No answer was charged.",
  CANCELLED: "This request stopped because access or assignment settings changed. No answer was charged.",
};

export function AssistantMessage({ interaction, animate = false, hideQuestion = false }: {
  interaction: AssistantInteraction; animate?: boolean; hideQuestion?: boolean;
}) {
  const notice = OUTCOME_NOTICE[interaction.status];
  return <article className="space-y-4" data-testid={`assistant-interaction-${interaction.sequence}`}>
    {interaction.contentErased ? <p className="text-sm italic text-gray-500 dark:text-gray-400">Conversation text permanently erased when group was archived or deleted.</p> : <>
      {!hideQuestion && interaction.studentMessage && <StudentChatBubble message={interaction.studentMessage} time={interaction.createdAt} />}
      <AssistantChatBubble time={interaction.completedAt ?? undefined}>
        {interaction.assistantResponse && <RevealedAnswer text={interaction.assistantResponse} animate={animate} />}
        {interaction.status === "PENDING" && <AssistantThinking />}
        {notice && <p className="flex items-start gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs leading-relaxed text-gray-600 dark:bg-dark-surface dark:text-gray-300"><CircleSlash size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-gray-400" />{notice}</p>}
      </AssistantChatBubble>
    </>}
  </article>;
}
