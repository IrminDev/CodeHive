import { AlertCircle, ArrowUpRight, ChevronDown, History, MessageCircle, PanelRightClose, RefreshCw, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { personalUsageMetrics, usePersonalUsage } from "~/features/assistant-usage/PersonalUsageBrief";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/shared/components/ui/Tabs";
import type { useAssignmentAssistant } from "../hooks/useAssignmentAssistant";
import type { Language } from "../types/assignment.types";
import type { AiAssistanceLevel, AssistantInteraction, AssistantStatus } from "../types/assistant.types";
import { AI_SHARING_NOTICE, AssistantComposer, useAssistantConsent } from "./AssistantComposer";
import { AssistantChatBubble, AssistantMessage, AssistantThinking, StudentChatBubble } from "./AssistantMessage";

type Assistant = ReturnType<typeof useAssignmentAssistant>;
type View = "chat" | "history" | "usage" | "about";

const LEVELS: Record<AiAssistanceLevel, { label: string; detail: string; suggestions: string[] }> = {
  CONCEPTUAL_ONLY: {
    label: "Concepts only",
    detail: "Explains concepts and terminology. No assignment-specific steps, pseudocode, or code.",
    suggestions: ["Which concepts does this problem involve?", "Explain time complexity with an example"],
  },
  EXPLANATIONS_AND_GUIDING: {
    label: "Explanations and guidance",
    detail: "Explains and guides with hints and questions. No pseudocode or code.",
    suggestions: ["Give me a hint to get started", "How should I think about edge cases here?"],
  },
  EXPLANATIONS_GUIDING_AND_SNIPPETS: {
    label: "Guidance with short snippets",
    detail: "Explains, guides, and may show up to two short snippets. Never a complete solution.",
    suggestions: ["Give me a hint to get started", "Show a short example of reading the input"],
  },
};

const OUTCOMES: Record<AssistantStatus, { label: string; dot: string }> = {
  COMPLETED: { label: "Answered", dot: "bg-green-500" },
  REDIRECTED: { label: "Redirected", dot: "bg-azure dark:bg-yellow" },
  PENDING: { label: "Checking", dot: "bg-yellow motion-safe:animate-pulse" },
  BLOCKED: { label: "Blocked", dot: "bg-gray-400" },
  FAILED: { label: "No answer", dot: "bg-gray-400" },
  CANCELLED: { label: "Cancelled", dot: "bg-gray-400" },
};

const tabClass = "h-full rounded-none border-b-2 border-transparent px-2.5 py-0 text-xs font-medium text-gray-500 shadow-none transition-colors hover:text-gray-900 focus-visible:ring-azure focus-visible:ring-offset-0 data-[state=active]:border-azure data-[state=active]:bg-transparent data-[state=active]:text-azure data-[state=active]:shadow-none dark:text-gray-400 dark:hover:text-gray-100 dark:focus-visible:ring-yellow dark:data-[state=active]:border-yellow dark:data-[state=active]:text-yellow";
const quietButtonClass = "inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-800 dark:focus-visible:ring-yellow";
const sectionTitleClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400";

function unavailableText(reason: string | null): string | null {
  switch (reason) {
    case "GLOBAL_DISABLED": return "AI assistance is not available yet.";
    case "ASSISTANT_DISABLED": return "Your professor turned off AI assistance for this assignment.";
    case "QUOTA_EXHAUSTED": return "You have used every answer for this assignment.";
    case "ASSISTANCE_UNAVAILABLE": return "New questions are closed because the assignment, group, or enrollment is no longer eligible.";
    default: return null;
  }
}

export function AssistantPanel({ assistant, assignmentId, groupId, userId, language, code, focusSignal, onCollapse }: {
  assistant: Assistant; assignmentId: string; groupId: string; userId: string; language: Language; code: string;
  focusSignal: number; onCollapse?: () => void;
}) {
  const [view, setView] = useState<View>("chat");
  const consent = useAssistantConsent(userId);

  return <aside aria-label="AI educational assistant" className="flex h-full min-h-0 flex-col bg-white text-gray-900 dark:bg-dark-card dark:text-gray-100">
    <Tabs value={view} onValueChange={(value) => setView(value as View)} className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-10 shrink-0 items-stretch justify-between gap-2 border-b border-gray-200 bg-gray-50 pl-1.5 pr-1 dark:border-gray-800/60 dark:bg-dark-surface">
        <TabsList aria-label="Assistant views" className="h-full justify-start gap-0.5 rounded-none bg-transparent p-0">
          <TabsTrigger value="chat" className={tabClass}><Sparkles size={13} aria-hidden="true" className="mr-1.5" />Chat</TabsTrigger>
          <TabsTrigger value="history" className={tabClass}>History</TabsTrigger>
          <TabsTrigger value="usage" className={tabClass}>Usage</TabsTrigger>
          <TabsTrigger value="about" className={tabClass}>About</TabsTrigger>
        </TabsList>
        {onCollapse && <button type="button" onClick={onCollapse} aria-label="Collapse assistant panel" title="Collapse assistant panel"
          className="my-auto hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 lg:inline-flex transition-colors hover:bg-gray-200 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 dark:focus-visible:ring-yellow"><PanelRightClose size={16} aria-hidden="true" /></button>}
      </header>
      <TabsContent value="chat" forceMount className="mt-0 flex min-h-0 flex-1 flex-col focus-visible:ring-0 data-[state=inactive]:hidden">
        <ChatView assistant={assistant} consent={consent} language={language} code={code} focusSignal={focusSignal} />
      </TabsContent>
      <TabsContent value="history" className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain focus-visible:ring-0">
        <HistoryView assistant={assistant} assignmentId={assignmentId} />
      </TabsContent>
      <TabsContent value="usage" className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain focus-visible:ring-0">
        <UsageView assistant={assistant} groupId={groupId} />
      </TabsContent>
      <TabsContent value="about" className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain focus-visible:ring-0">
        <AboutView assistant={assistant} accepted={consent.accepted} />
      </TabsContent>
    </Tabs>
  </aside>;
}

function ChatView({ assistant, consent, language, code, focusSignal }: {
  assistant: Assistant; consent: ReturnType<typeof useAssistantConsent>; language: Language; code: string; focusSignal: number;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const availability = assistant.availability;
  const level = availability?.assistanceLevel ? LEVELS[availability.assistanceLevel] : null;
  const unavailable = unavailableText(availability?.reason ?? null);
  const empty = !assistant.loading && !assistant.pendingQuestion && assistant.interactions.length === 0;

  useEffect(() => {
    const element = viewport.current;
    if (element && followLatest.current) element.scrollTop = element.scrollHeight;
  }, [assistant.interactions, assistant.sending, assistant.pendingQuestion, assistant.error]);

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

  return <>
    <div ref={viewport} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4" aria-label="Conversation" aria-busy={assistant.loading}
      onScroll={() => { const element = viewport.current; if (element) followLatest.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80; }}>
      <div ref={content} className="space-y-6">
        {assistant.loading && <div role="status" className="space-y-3">
          <span className="sr-only">Loading conversation…</span>
          <div aria-hidden="true" className="space-y-3 motion-safe:animate-pulse">
            <div className="ml-auto h-10 w-2/3 rounded-2xl bg-gray-100 dark:bg-gray-800" />
            <div className="h-20 w-5/6 rounded-xl bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>}
        {!assistant.loading && assistant.nextPage !== null && <div className="flex justify-center"><button type="button" onClick={() => void loadOlder()} className={quietButtonClass}><History size={13} aria-hidden="true" />Load older questions</button></div>}
        {empty && !assistant.error && <div className="mx-auto max-w-xs pt-6 text-center">
          <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow"><MessageCircle size={20} aria-hidden="true" /></span>
          <h3 className="text-sm font-semibold">{unavailable ? "No questions here yet" : "Ask about this assignment"}</h3>
          {!unavailable && level && <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{level.detail}</p>}
          {!unavailable && level && consent.accepted && availability?.available && <div className="mt-4 flex flex-col gap-2">
            {level.suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => assistant.setDraft(suggestion)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:border-azure hover:text-azure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:border-gray-700 dark:text-gray-300 dark:hover:border-yellow dark:hover:text-yellow dark:focus-visible:ring-yellow">{suggestion}</button>)}
          </div>}
        </div>}
        {assistant.interactions.map((interaction) => <AssistantMessage key={interaction.id} interaction={interaction} animate={interaction.id === assistant.revealInteractionId} />)}
        {assistant.pendingQuestion && <StudentChatBubble message={assistant.pendingQuestion} />}
        {assistant.sending && !assistant.interactions.some((interaction) => interaction.status === "PENDING") && <AssistantChatBubble><AssistantThinking /></AssistantChatBubble>}
        {(assistant.lastResult?.executionUnavailable || assistant.lastResult?.historyTruncated) && <ul className="space-y-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {assistant.lastResult.executionUnavailable && <li>No finished run was available to include with your last question.</li>}
          {assistant.lastResult.historyTruncated && <li>Older conversation was left out of the last answer’s context.</li>}
        </ul>}
        {assistant.error && <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/5 p-3 text-xs text-red-700 dark:text-red-300">
          <p className="flex items-start gap-2 leading-relaxed"><AlertCircle size={15} aria-hidden="true" className="mt-px shrink-0" /><span className="min-w-0 break-words">{assistant.error}</span></p>
          <button type="button" onClick={() => void assistant.retry()} className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-red-500/25 px-2.5 font-medium transition-colors hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"><RotateCcw size={13} aria-hidden="true" />{assistant.hasRetry ? "Retry same request" : "Refresh conversation"}</button>
        </div>}
      </div>
    </div>
    {unavailable
      ? <p role="status" className="shrink-0 border-t border-gray-200 bg-gray-50 px-3 py-3 text-xs leading-relaxed text-gray-600 dark:border-gray-800/60 dark:bg-dark-surface dark:text-gray-300">{unavailable}{assistant.interactions.length > 0 && " Earlier answers stay readable."}</p>
      : <AssistantComposer accepted={consent.accepted} onAccept={consent.accept}
        disabled={assistant.loading || !availability?.available || assistant.sending} sending={assistant.sending}
        language={language} code={code} message={assistant.draft} onMessageChange={assistant.setDraft} focusSignal={focusSignal}
        quotaLabel={availability?.reason === "REQUEST_PENDING" ? "One answer is being checked. You can ask again when it finishes." : quotaLabel(assistant)}
        onSend={async (...args) => { followLatest.current = true; await assistant.submit(...args); }} />}
  </>;
}

function quotaLabel(assistant: Assistant): string | null {
  const availability = assistant.availability;
  if (!availability || availability.maximum === 0) return null;
  return `${availability.remaining} of ${availability.maximum} answers left`;
}

function HistoryView({ assistant, assignmentId }: { assistant: Assistant; assignmentId: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const items = assistant.interactions.slice().reverse();

  return <div className="px-3 py-4">
    <div className="flex items-center justify-between gap-3">
      <h3 className={sectionTitleClass}>Your questions</h3>
      <Link to={`/assignment/${assignmentId}/assistant-history`} className="inline-flex items-center gap-1 rounded text-xs font-medium text-azure underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:text-yellow dark:focus-visible:ring-yellow">Full page<ArrowUpRight size={12} aria-hidden="true" /></Link>
    </div>
    {assistant.loading ? <p role="status" className="mt-4 text-xs text-gray-500 dark:text-gray-400">Loading history…</p>
      : items.length === 0 ? <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">No questions yet. Everything you ask in this assignment is listed here.</p>
      : <ul className="mt-3 divide-y divide-gray-200 border-y border-gray-200 dark:divide-gray-800/60 dark:border-gray-800/60">
        {items.map((item) => <HistoryItem key={item.id} item={item} open={openId === item.id} onToggle={() => setOpenId(openId === item.id ? null : item.id)} />)}
      </ul>}
    {!assistant.loading && assistant.nextPage !== null && <button type="button" onClick={() => void assistant.loadOlder()} className={`${quietButtonClass} mt-3 w-full`}>Load older questions</button>}
  </div>;
}

function HistoryItem({ item, open, onToggle }: { item: AssistantInteraction; open: boolean; onToggle: () => void }) {
  const outcome = OUTCOMES[item.status];
  return <li>
    <button type="button" aria-expanded={open} onClick={onToggle}
      className="flex w-full items-start gap-2.5 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-azure dark:focus-visible:ring-yellow">
      <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${outcome.dot}`} />
      <span className="min-w-0 flex-1">
        <span className={`block text-sm leading-snug ${open ? "" : "line-clamp-2"}`}>{item.contentErased || !item.studentMessage ? "Question text erased" : item.studentMessage}</span>
        <span className="mt-1 block text-[11px] text-gray-500 dark:text-gray-400">{outcome.label}{item.quotaCharged && " · 1 answer used"} · {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
      </span>
      <ChevronDown size={15} aria-hidden="true" className={`mt-0.5 shrink-0 text-gray-400 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div className="pb-4 pl-[18px]"><AssistantMessage interaction={item} hideQuestion /></div>}
  </li>;
}

function UsageView({ assistant, groupId }: { assistant: Assistant; groupId: string }) {
  const personal = usePersonalUsage(groupId);
  const availability = assistant.availability;
  const used = availability?.used ?? 0;
  const percent = availability && availability.maximum > 0 ? Math.min(100, used / availability.maximum * 100) : 0;

  return <div className="space-y-6 px-3 py-4">
    <section aria-labelledby="assistant-usage-assignment">
      <h3 id="assistant-usage-assignment" className={sectionTitleClass}>This assignment</h3>
      {!availability ? <p role="status" className="mt-3 text-xs text-gray-500 dark:text-gray-400">Loading answer limit…</p>
        : availability.maximum === 0 ? <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">AI assistance is off for this assignment, so there is no answer limit to track.</p>
        : <>
          <p className="mt-3 flex items-baseline gap-2"><span className="text-2xl font-semibold">{used}</span><span className="text-xs text-gray-500 dark:text-gray-400">of {availability.maximum} answers used{availability.reserved > 0 && ` · ${availability.reserved} being checked`}</span></p>
          <div role="progressbar" aria-label="Answers used in this assignment" aria-valuemin={0} aria-valuemax={availability.maximum} aria-valuenow={used} aria-valuetext={`${used} of ${availability.maximum} answers used`}
            className="mt-2 h-2 overflow-hidden rounded-full bg-azure/15 dark:bg-yellow/15"><div className={`h-full rounded-full ${availability.remaining === 0 ? "bg-orange-500" : "bg-azure dark:bg-yellow"}`} style={{ width: `${percent}%` }} /></div>
          <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">Only delivered answers and educational redirections use an answer. The limit lasts for the whole assignment and does not reset.</p>
        </>}
    </section>
    <section aria-labelledby="assistant-usage-class" aria-busy={personal.loading}>
      <div className="flex items-center justify-between gap-3">
        <h3 id="assistant-usage-class" className={sectionTitleClass}>This class · last 30 days</h3>
        <button type="button" onClick={personal.refresh} disabled={personal.loading} aria-label="Refresh class usage" title="Refresh class usage"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 dark:focus-visible:ring-yellow"><RefreshCw size={13} aria-hidden="true" /></button>
      </div>
      {personal.loading ? <div role="status" className="mt-3"><span className="sr-only">Loading class usage…</span><div aria-hidden="true" className="grid grid-cols-2 gap-2 motion-safe:animate-pulse">{[0, 1, 2, 3].map((item) => <div key={item} className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800" />)}</div></div>
        : personal.error ? <div role="alert" className="mt-3 text-xs text-red-700 dark:text-red-300"><p>Class usage is unavailable: {personal.error}</p><button type="button" onClick={personal.refresh} className={`${quietButtonClass} mt-2`}>Retry</button></div>
        : personal.usage && <>
          <dl className="mt-3 grid grid-cols-2 gap-2">
            {personalUsageMetrics(personal.usage).map((metric) => <div key={metric.label} className="rounded-lg border border-gray-200 px-3 py-2.5 dark:border-gray-800/60">
              <dt className="text-xs text-gray-500 dark:text-gray-400">{metric.label}</dt>
              <dd className="mt-0.5 text-xl font-semibold">{metric.value.toLocaleString()}</dd>
            </div>)}
          </dl>
          {personal.usage.requests === 0 && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">No AI questions in this class in the last 30 days.</p>}
        </>}
      <Link to={`/groups/${encodeURIComponent(groupId)}/metrics#ai-usage`} className="mt-3 inline-flex items-center gap-1 rounded text-xs font-medium text-azure underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:text-yellow dark:focus-visible:ring-yellow">Open class progress<ArrowUpRight size={12} aria-hidden="true" /></Link>
    </section>
  </div>;
}

function AboutView({ assistant, accepted }: { assistant: Assistant; accepted: boolean }) {
  const availability = assistant.availability;
  const level = availability?.assistanceLevel ? LEVELS[availability.assistanceLevel] : null;
  return <dl className="space-y-5 px-3 py-4 text-xs leading-relaxed">
    <div>
      <dt className={sectionTitleClass}>What it can help with</dt>
      <dd className="mt-1.5 text-gray-700 dark:text-gray-300">{level ? <><span className="font-medium text-gray-900 dark:text-gray-100">{level.label}.</span> {level.detail}</> : "Your professor chooses the level of help for each assignment."}</dd>
    </div>
    <div>
      <dt className={sectionTitleClass}>Answer limit</dt>
      <dd className="mt-1.5 text-gray-700 dark:text-gray-300">{availability && availability.maximum > 0 ? `You can receive up to ${availability.maximum} answers in this assignment. ` : ""}Only delivered answers and educational redirections use an answer. Blocked, failed, or cancelled questions are not counted, and the limit does not reset.</dd>
    </div>
    <div>
      <dt className={sectionTitleClass}>What is shared with the AI</dt>
      <dd className="mt-1.5 text-gray-700 dark:text-gray-300">{AI_SHARING_NOTICE} Code and Last run apply to one question and turn off after sending.{accepted && <span className="mt-1.5 block text-gray-500 dark:text-gray-400">You accepted this notice in this browser.</span>}</dd>
    </div>
    <div>
      <dt className={sectionTitleClass}>How answers are checked</dt>
      <dd className="mt-1.5 text-gray-700 dark:text-gray-300">Every answer is reviewed against your professor’s rules before you see it, and it is never inserted into your editor.</dd>
    </div>
  </dl>;
}
