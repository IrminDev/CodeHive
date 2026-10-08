import { useEffect, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { useAuth } from "~/core/providers/AuthProvider";
import { usageQuery, usageRequest } from "~/features/assistant-usage/api";
import type { Breakdown, Summary, UsageRow } from "~/features/assistant-usage/types";
import { compactButtonClass, panelClass } from "./TeacherUI";

type GroupUsage = { scope: string; summary?: Summary; error?: string };
type AssignmentUsage = { scope: string; rows?: Map<string, UsageRow>; error?: string };

export function useTeacherAiUsage(groupId: string, refreshVersion: number) {
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupUsage>();
  const [assignments, setAssignments] = useState<AssignmentUsage>();
  const [revision, setRevision] = useState(0);
  const scope = JSON.stringify([user?.id, groupId, refreshVersion, revision]);

  useEffect(() => {
    if (!groupId || !user?.id) return;
    const controller = new AbortController();
    setGroup(undefined);
    setAssignments(undefined);
    const to = new Date();
    const dates = { from: new Date(to.getTime() - 30 * 86400000).toISOString(), to: to.toISOString() };
    const base = `/api/groups/${encodeURIComponent(groupId)}/assistant-usage`;
    void usageRequest<Summary>("owner", base + usageQuery(dates), controller.signal)
      .then(summary => { if (!controller.signal.aborted) setGroup({ scope, summary }); })
      .catch(cause => { if (!controller.signal.aborted) setGroup({ scope, error: message(cause) }); });
    // Read group pages once; avoid one HTTP request for each academic assignment.
    void (async () => {
      const rows = new Map<string, UsageRow>();
      let page = 0;
      while (!controller.signal.aborted) {
        const result = await usageRequest<Breakdown>("owner", base + "/assignments" + usageQuery({ ...dates, size: 100, page }), controller.signal);
        if (controller.signal.aborted) return;
        result.rows.content.forEach(row => rows.set(row.id, row));
        if (result.rows.last) {
          setAssignments({ scope, rows });
          return;
        }
        page += 1;
      }
    })().catch(cause => { if (!controller.signal.aborted) setAssignments({ scope, error: message(cause) }); });
    return () => controller.abort();
  }, [groupId, user?.id, scope]);

  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener("assistant-usage-changed", refresh);
    return () => window.removeEventListener("assistant-usage-changed", refresh);
  }, []);

  return {
    summary: group?.scope === scope ? group.summary : undefined,
    error: group?.scope === scope ? group.error : undefined,
    assignments: assignments?.scope === scope ? assignments.rows : undefined,
    assignmentsError: assignments?.scope === scope ? assignments.error : undefined,
    refresh: () => setRevision(value => value + 1),
  };
}

function message(cause: unknown) {
  return cause instanceof Error && cause.message ? cause.message : "Could not load AI usage.";
}

export function TeacherGroupAiUsage({ usage }: { usage: ReturnType<typeof useTeacherAiUsage> }) {
  const e = usage.summary?.educational;
  const counts = e ? [
    ["Questions asked", e.requests], ["Answers used", e.responses],
    ["Without an answer", e.blocked + e.failed + e.cancelled],
    ["In progress", e.pending], ["Students with activity", e.activeUsers],
  ] as const : [];
  const loading = !e && !usage.error;
  return <section id="ai-usage" aria-labelledby="group-ai-usage-title" aria-busy={loading} className={`${panelClass} my-5 p-5 scroll-mt-6`}>
    <div className="flex items-start justify-between gap-4">
      <div><h2 id="group-ai-usage-title" className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} className="text-azure dark:text-yellow" /> Group AI usage</h2><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Questions started in the last 30 days, including historical participants.</p></div>
      <button type="button" onClick={usage.refresh} disabled={loading} className={compactButtonClass} aria-label="Refresh AI usage"><RefreshCw size={13} /></button>
    </div>
    {loading ? <div role="status" className="mt-4"><span className="sr-only">Loading group AI usage…</span><div aria-hidden="true" className="grid grid-cols-2 lg:grid-cols-5 gap-3 animate-pulse">{[0, 1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-dark-card" />)}</div></div>
      : usage.error ? <div role="alert" className="mt-4 text-sm"><p>AI usage unavailable: {usage.error}</p><button type="button" onClick={usage.refresh} className={`${compactButtonClass} mt-3`}>Retry AI usage</button></div>
      : <><dl className="mt-4 grid grid-cols-2 lg:grid-cols-5 gap-3">{counts.map(([label, count]) => <div key={label} className="rounded-xl bg-gray-50 dark:bg-dark-card p-4"><dt className="text-[10px] text-gray-500 dark:text-gray-400">{label}</dt><dd className="mt-1 text-2xl font-semibold font-mono">{count.toLocaleString()}</dd></div>)}</dl>{e?.requests === 0 && <p className="mt-3 text-xs text-gray-500">No AI questions in this group in the last 30 days.</p>}<p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Only delivered answers consume quota, including educational redirections. Limits belong to each assignment and last for its lifetime.</p></>}
  </section>;
}

export function AssignmentAiUsage({ row, loading, unavailable, onRetry }: { row?: UsageRow; loading: boolean; unavailable: boolean; onRetry?: () => void }) {
  const counts = row ? [["Questions asked", row.requests], ["Answers used", row.responses], ["Without an answer", row.unanswered]] as const : [];
  return <section aria-label="Assignment AI usage" aria-busy={loading} className={`${panelClass} p-5`}>
    <h3 className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} className="text-azure dark:text-yellow" /> AI usage</h3>
    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Questions started in this assignment over the last 30 days, including historical participants.</p>
    {loading ? <p role="status" className="mt-5 text-sm text-gray-500">Loading AI usage…</p>
      : unavailable || !row ? <div role="alert" className="mt-5"><p className="text-sm text-gray-500">AI usage unavailable</p>{onRetry && <button type="button" onClick={onRetry} className={`${compactButtonClass} mt-3`}>Retry assignment AI usage</button>}</div>
      : <><dl className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">{counts.map(([label, count]) => <div key={label} className="rounded-xl bg-gray-50 dark:bg-dark-card p-4"><dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt><dd className="mt-2 text-2xl font-semibold font-mono">{count.toLocaleString()}</dd></div>)}</dl>
        {row.requests === 0 && <p className="mt-4 text-sm text-gray-500">No AI questions in this assignment in the last 30 days.</p>}
        <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">Only delivered answers consume quota, including educational redirections. Questions blocked, failed, or cancelled do not consume quota. Each student's answer limit lasts for the assignment's lifetime.</p></>}
  </section>;
}
