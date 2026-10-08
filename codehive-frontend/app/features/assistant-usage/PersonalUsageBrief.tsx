import { useEffect, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { useAuth } from "~/core/providers/AuthProvider";
import { usageRequest } from "./api";
import type { Summary } from "./types";

type UsageState = { scope: string; summary?: Summary; error?: string };

export function PersonalUsageBrief({ groupId, refreshKey = 0 }: { groupId: string; refreshKey?: number }) {
  const { user } = useAuth();
  const [state, setState] = useState<UsageState>();
  const [revision, setRevision] = useState(0);
  const scope = JSON.stringify([user?.id, groupId, refreshKey, revision]);

  useEffect(() => {
    if (!groupId || !user?.id) return;
    const controller = new AbortController();
    setState(undefined);
    void usageRequest<Summary>("personal", `/api/assistant-usage/me/groups/${encodeURIComponent(groupId)}`, controller.signal)
      .then(summary => {
        if (!controller.signal.aborted) setState({ scope, summary });
      })
      .catch(cause => {
        if (!controller.signal.aborted) setState({ scope, error: cause instanceof Error ? cause.message : "Could not load AI usage." });
      });
    return () => controller.abort();
  }, [groupId, user?.id, scope]);

  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener("assistant-usage-changed", refresh);
    return () => window.removeEventListener("assistant-usage-changed", refresh);
  }, []);

  if (!groupId || !user?.id) return null;
  const current = state?.scope === scope ? state : undefined;
  const usage = current?.summary?.educational;
  const metrics = usage ? [
    { label: "Questions asked", value: usage.requests, detail: "Including regenerated questions", color: "text-gray-900 dark:text-white" },
    { label: "Answers used", value: usage.responses, detail: "Includes educational redirections", color: "text-azure dark:text-yellow" },
    { label: "Without an answer", value: usage.blocked + usage.failed + usage.cancelled, detail: "Blocked, failed, or cancelled", color: "text-gray-900 dark:text-white" },
    { label: "In progress", value: usage.pending, detail: "Questions awaiting an outcome", color: "text-gray-900 dark:text-white" },
  ] : [];

  return (
    <section id="ai-usage" aria-labelledby="ai-usage-heading" aria-busy={!current} className="scroll-mt-6 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-azure/10 dark:bg-yellow/10 text-azure dark:text-yellow grid place-items-center"><Sparkles size={18} /></div>
          <div><h2 id="ai-usage-heading" className="font-semibold text-gray-900 dark:text-white">Your AI usage</h2><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Your questions in this class over the last 30 days.</p></div>
        </div>
        <button type="button" disabled={!current} onClick={() => setRevision(value => value + 1)} aria-label="Refresh AI usage" className="shrink-0 rounded-lg border border-gray-300 dark:border-gray-700 p-2 text-gray-500 dark:text-gray-400 hover:text-azure dark:hover:text-yellow disabled:opacity-40"><RefreshCw size={14} /></button>
      </div>
      {!current ? <div role="status" className="mt-5"><span className="sr-only">Loading AI usage…</span><div aria-hidden="true" className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">{[0, 1, 2, 3].map(item => <div key={item} className="h-24 rounded-xl bg-gray-100 dark:bg-dark-card" />)}</div></div>
        : current.error ? <div role="alert" className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm"><p className="font-medium">AI usage unavailable</p><p className="mt-1 text-gray-500 dark:text-gray-400">{current.error}</p><button type="button" onClick={() => setRevision(value => value + 1)} className="mt-3 text-xs font-medium text-azure dark:text-yellow underline">Retry AI usage</button></div>
        : <>
          <dl className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">{metrics.map(metric => <div key={metric.label} className="rounded-xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-dark-card/50 p-4"><dt className="text-[10px] uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">{metric.label}</dt><dd className={`mt-1 text-2xl font-bold ${metric.color}`}>{metric.value.toLocaleString()}</dd><p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">{metric.detail}</p></div>)}</dl>
          {usage?.requests === 0 && <p role="status" className="mt-4 text-sm text-gray-500 dark:text-gray-400">No AI questions in this class in the last 30 days.</p>}
          <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">Only delivered answers use quota. Each assignment has its own lifetime answer limit.</p>
        </>}
    </section>
  );
}
