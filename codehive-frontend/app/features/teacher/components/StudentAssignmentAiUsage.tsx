import { useEffect, useState } from "react";
import { CircleAlert, Clock3, Inbox, LoaderCircle, RefreshCw, Sparkles } from "lucide-react";
import { useAuth } from "~/core/providers/AuthProvider";
import { usageQuery, usageRequest } from "~/features/assistant-usage/api";
import type { Breakdown, UsageRow } from "~/features/assistant-usage/types";
import { compactButtonClass, StatusPill } from "./TeacherUI";

export function StudentAssignmentAiUsage({ groupId, assignmentId, studentId }: {
  groupId: string; assignmentId: string; studentId: string;
}) {
  const { user } = useAuth();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ scope: string; row?: UsageRow; error?: string }>();
  const scope = JSON.stringify([user?.id, groupId, assignmentId, studentId, revision]);
  const refresh = () => setRevision(value => value + 1);

  useEffect(() => {
    if (!user?.id) return;
    const controller = new AbortController();
    const base = `/api/groups/${encodeURIComponent(groupId)}/assistant-usage/students/${encodeURIComponent(studentId)}/assignments`;
    void usageRequest<Breakdown>("owner", base + usageQuery({ assignmentId, lifetime: true, size: 1 }), controller.signal)
      .then(value => {
        if (controller.signal.aborted) return;
        const row = value.rows.content.find(item => item.id === assignmentId);
        setState({ scope, row, error: row ? undefined : "No usage record available for this student and assignment." });
      })
      .catch(cause => {
        if (!controller.signal.aborted) setState({ scope, error: cause instanceof Error ? cause.message : "Could not load AI usage." });
      });
    return () => controller.abort();
  }, [user?.id, groupId, assignmentId, studentId, scope]);

  useEffect(() => {
    const reload = () => setRevision(value => value + 1);
    window.addEventListener("assistant-usage-changed", reload);
    return () => window.removeEventListener("assistant-usage-changed", reload);
  }, []);

  const current = state?.scope === scope ? state : undefined;
  const row = current?.row;
  const quota = row?.quota;
  const counts = row ? [
    ["Questions asked", row.requests, "bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow"],
    ["Answers used", row.responses, "bg-green-500/10 text-green-600 dark:text-green-400"],
    ["Without an answer", row.unanswered, "bg-orange-500/10 text-orange-600 dark:text-orange-400"],
    ["Regenerations", row.regenerations, "bg-gray-100 text-gray-500 dark:bg-dark-card dark:text-gray-400"],
  ] as const : [];
  const usedPercent = quota && quota.maximumCurrent > 0 ? Math.max(0, Math.min(100, quota.usedLifetime / quota.maximumCurrent * 100)) : 0;
  return <section aria-label="Student assignment AI usage" aria-busy={!current}>
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4 dark:border-gray-800/60 dark:bg-dark-card">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow"><Sparkles size={15} /></span>
        <div><h3 className="text-sm font-semibold">Student AI usage</h3><p className="mt-0.5 text-[10px] text-gray-500">This student's activity over this assignment's full history.</p></div>
      </div>
      <button type="button" onClick={refresh} disabled={!current} className={compactButtonClass}><RefreshCw size={12} /> Refresh AI usage</button>
    </header>
    {!current ? <div role="status" className="p-10 text-center"><LoaderCircle size={24} className="mx-auto animate-spin text-azure dark:text-yellow" /><p className="mt-3 text-sm font-medium">Loading AI usage…</p></div>
      : current.error ? <div role="alert" className="m-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4"><div className="flex items-start gap-2"><CircleAlert size={15} className="mt-0.5 shrink-0 text-orange-500" /><p className="text-xs leading-relaxed text-orange-600 dark:text-orange-400">AI usage unavailable: {current.error}</p></div><button type="button" onClick={refresh} className={`${compactButtonClass} mt-3`}><RefreshCw size={12} /> Retry AI usage</button></div>
      : row && <div className="space-y-5 p-4 sm:p-5">
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">{counts.map(([label, count, colors]) => <div key={label} className={`rounded-xl p-3 ${colors}`}><dt className="text-[9px] font-semibold uppercase tracking-wide opacity-75">{label}</dt><dd className="mt-1 font-mono text-sm font-bold">{count.toLocaleString()}</dd></div>)}</dl>
        {row.requests === 0 && <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-3 dark:bg-dark-card"><Inbox size={15} className="shrink-0 text-gray-400" /><p className="text-xs text-gray-500">No AI questions from this student in this assignment.</p></div>}
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-dark-card"><h4 className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Lifetime answer quota</h4>{quota && <StatusPill label={!quota.enabled ? "AI disabled" : quota.remainingNow > 0 ? "Available" : "No quota remaining"} tone={!quota.enabled ? "neutral" : quota.remainingNow > 0 ? "success" : "warning"} />}</div>
          <div className="p-4">{quota ? <>
            <p className="text-xs font-mono text-gray-600 dark:text-gray-300">{quota.usedLifetime} / {quota.maximumCurrent} answers used · {quota.remainingNow} remaining</p>
            <div role="progressbar" aria-label="Lifetime answer quota used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={usedPercent} aria-valuetext={`${quota.usedLifetime} of ${quota.maximumCurrent} answers used`} className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-card"><div className="h-full rounded-full bg-azure dark:bg-yellow" style={{ width: `${usedPercent}%` }} /></div>
            <p className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-500"><Clock3 size={12} />{quota.pendingReservations} pending reservations</p>
            {!quota.enabled && <p className="mt-3 text-[10px] text-gray-500">AI is currently disabled for this assignment.</p>}
            {quota.limitReduced && <p className="mt-3 flex items-center gap-1.5 text-[10px] text-orange-500"><CircleAlert size={12} /> Current answer limit was reduced.</p>}
          </> : <p className="text-xs text-gray-500">Quota unavailable.</p>}</div>
        </div>
        <p className="text-[10px] leading-relaxed text-gray-500">Only delivered answers consume quota, including educational redirections. Blocked, failed, or cancelled questions do not consume quota. Remaining quota does not guarantee eligibility.</p>
        <p className="flex items-center gap-1.5 border-t border-gray-100 pt-3 font-mono text-[9px] text-gray-400 dark:border-gray-800/60"><Clock3 size={12} /> Last activity: {row.lastActivity ? new Date(row.lastActivity).toLocaleString() : "No activity"}</p>
      </div>}
  </section>;
}
