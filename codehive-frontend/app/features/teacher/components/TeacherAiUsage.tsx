import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "~/core/providers/AuthProvider";
import { useTheme } from "~/core/providers/ThemeProvider";
import { usageQuery, usageRequest } from "~/features/assistant-usage/api";
import type { Breakdown, Daily, Summary, UsageRow } from "~/features/assistant-usage/types";
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

// Two-series palette checked with the dataviz validator against each theme's chart surface.
const TREND_COLORS = {
  light: { questions: "#00509D", answers: "#eb6834", grid: "#e5e7eb", text: "#6b7280", surface: "#ffffff" },
  dark: { questions: "#3987e5", answers: "#c98500", grid: "#1f2937", text: "#9ca3af", surface: "#0d1525" },
};

const headClass = "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400";
const QUOTA_NOTE = "Only delivered answers use a student’s limit, including educational redirections. Limits belong to each assignment and last for its lifetime.";

/** Group-level AI usage: headline counts, the daily trend, and a per-assignment comparison. */
export function TeacherGroupAiUsage({ usage, onOpenAssignment }: {
  usage: ReturnType<typeof useTeacherAiUsage>;
  onOpenAssignment: (assignmentId: string) => void;
}) {
  const e = usage.summary?.educational;
  const counts = e ? [
    ["Questions asked", e.requests], ["Answers used", e.responses],
    ["Without an answer", e.blocked + e.failed + e.cancelled],
    ["In progress", e.pending], ["Students with activity", e.activeUsers],
  ] as const : [];
  const loading = !e && !usage.error;
  const rows = usage.assignments ? [...usage.assignments.values()].sort((left, right) => right.requests - left.requests || left.label.localeCompare(right.label)) : undefined;

  return <section id="ai-usage" aria-labelledby="group-ai-usage-title" aria-busy={loading} className={`${panelClass} scroll-mt-6 overflow-hidden`}>
    <header className="flex items-start justify-between gap-4 p-4 sm:p-5">
      <div><h2 id="group-ai-usage-title" className="text-sm font-semibold text-gray-900 dark:text-white">AI assistant usage</h2><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Questions started in the last 30 days, including historical participants.</p></div>
      <button type="button" onClick={usage.refresh} disabled={loading} className={compactButtonClass} aria-label="Refresh AI usage" title="Refresh AI usage"><RefreshCw size={13} aria-hidden="true" /></button>
    </header>
    {loading ? <div role="status" className="px-4 pb-5 sm:px-5"><span className="sr-only">Loading group AI usage…</span><div aria-hidden="true" className="grid grid-cols-2 gap-3 motion-safe:animate-pulse lg:grid-cols-5">{[0, 1, 2, 3, 4].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-dark-card" />)}</div></div>
      : usage.error ? <div role="alert" className="px-4 pb-5 text-sm sm:px-5"><p>AI usage unavailable: {usage.error}</p><button type="button" onClick={usage.refresh} className={`${compactButtonClass} mt-3`}>Retry AI usage</button></div>
      : <>
        <dl className="grid grid-cols-2 gap-px border-y border-gray-200 bg-gray-200 dark:border-gray-800/60 dark:bg-gray-800/60 sm:grid-cols-3 lg:grid-cols-5">
          {counts.map(([label, count]) => <div key={label} className="bg-white px-4 py-3.5 dark:bg-dark-surface sm:px-5"><dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt><dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{count.toLocaleString()}</dd></div>)}
        </dl>
        <div className="p-4 sm:p-5">
          {e?.requests === 0
            ? <p className="text-sm text-gray-500 dark:text-gray-400">No AI questions in this group in the last 30 days.</p>
            : <UsageTrend trend={usage.summary?.trend ?? []} />}
        </div>
      </>}
    <div className="border-t border-gray-200 dark:border-gray-800/60">
      <h3 className="px-4 pt-4 text-sm font-semibold text-gray-900 dark:text-white sm:px-5">By assignment</h3>
      {usage.assignmentsError ? <div role="alert" className="p-4 text-sm sm:p-5"><p>Assignment AI usage unavailable: {usage.assignmentsError}</p><button type="button" onClick={usage.refresh} className={`${compactButtonClass} mt-3`}>Retry</button></div>
        : !rows ? <p role="status" className="p-4 text-sm text-gray-500 dark:text-gray-400 sm:p-5">Loading assignments…</p>
        : rows.length === 0 ? <p className="p-4 text-sm text-gray-500 dark:text-gray-400 sm:p-5">No assignments in this group yet.</p>
        : <div className="relative mt-2 overflow-x-auto"><table className="w-full min-w-[30rem] text-sm">
          <caption className="sr-only">AI usage by assignment over the last 30 days. Select an assignment to open its details.</caption>
          <thead><tr>
            <th scope="col" className={`${headClass} text-left`}>Assignment</th>
            <th scope="col" className={`${headClass} text-right`}>Questions</th>
            <th scope="col" className={`${headClass} text-right`}>Answers used</th>
            <th scope="col" className={`${headClass} hidden text-right sm:table-cell`}>Without answer</th>
            <th scope="col" className={`${headClass} hidden text-right md:table-cell`}>Limit per student</th>
            <th scope="col" className={`${headClass} hidden text-right lg:table-cell`}>Last activity</th>
          </tr></thead>
          <tbody>{rows.map(row => <tr key={row.id} onClick={() => onOpenAssignment(row.id)} className="group cursor-pointer border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800/60 dark:hover:bg-dark-card/40">
            <th scope="row" className="max-w-0 px-4 py-3 text-left font-normal sm:max-w-none"><button type="button" className="max-w-full truncate rounded text-left text-sm font-medium text-gray-900 group-hover:text-azure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:text-gray-100 dark:group-hover:text-yellow dark:focus-visible:ring-yellow">{row.label}</button></th>
            <td className={`px-4 py-3 text-right tabular-nums ${row.requests > 0 ? "font-semibold text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>{row.requests.toLocaleString()}</td>
            <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">{row.responses.toLocaleString()}</td>
            <td className="hidden px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300 sm:table-cell">{row.unanswered.toLocaleString()}</td>
            <td className="hidden px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300 md:table-cell">{policyLimit(row)}</td>
            <td className="hidden px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400 lg:table-cell">{row.lastActivity ? formatDay(row.lastActivity) : "No activity"}</td>
          </tr>)}</tbody>
        </table></div>}
      <p className="border-t border-gray-100 px-4 py-3 text-xs leading-relaxed text-gray-500 dark:border-gray-800/60 dark:text-gray-400 sm:px-5">{QUOTA_NOTE}</p>
    </div>
  </section>;
}

function policyLimit(row: UsageRow): string {
  if (!row.currentPolicy) return "—";
  return row.currentPolicy.enabled ? String(row.currentPolicy.maximumCurrent) : "AI off";
}

function formatDay(value: string): string {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: value.length === 10 ? "UTC" : undefined });
}

function UsageTrend({ trend }: { trend: Daily[] }) {
  const { theme } = useTheme();
  const colors = TREND_COLORS[theme === "dark" ? "dark" : "light"];
  if (trend.length === 0) return <p className="text-sm text-gray-500 dark:text-gray-400">No daily activity recorded in this period.</p>;
  return <figure aria-label="Daily AI questions and answers used">
    <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Per day (UTC)</span>
      <ul className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
        <li className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-0.5 w-4 rounded-full" style={{ background: colors.questions }} />Questions asked</li>
        <li className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-0.5 w-4 rounded-full" style={{ background: colors.answers }} />Answers used</li>
      </ul>
    </figcaption>
    <div className="mt-3 h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trend} margin={{ top: 6, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={colors.grid} vertical={false} />
          <XAxis dataKey="day" tickFormatter={formatDay} tick={{ fontSize: 11, fill: colors.text }} tickLine={false} axisLine={{ stroke: colors.grid }} minTickGap={28} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: colors.text }} tickLine={false} axisLine={false} width={44} />
          <Tooltip cursor={{ stroke: colors.text, strokeWidth: 1 }} content={<TrendTooltip colors={colors} />} />
          <Line dataKey="requests" name="Questions asked" stroke={colors.questions} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: colors.surface, strokeWidth: 2 }} isAnimationActive={false} />
          <Line dataKey="responses" name="Answers used" stroke={colors.answers} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: colors.surface, strokeWidth: 2 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
    <details className="mt-3 text-xs">
      <summary className="cursor-pointer rounded font-medium text-azure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:text-yellow dark:focus-visible:ring-yellow">View as table</summary>
      <div className="relative mt-2 max-h-56 overflow-auto rounded-lg border border-gray-200 dark:border-gray-800/60"><table className="w-full text-left tabular-nums">
        <caption className="sr-only">Daily AI questions and answers used, UTC</caption>
        <thead><tr><th scope="col" className="px-3 py-2 font-semibold">Date</th><th scope="col" className="px-3 py-2 text-right font-semibold">Questions asked</th><th scope="col" className="px-3 py-2 text-right font-semibold">Answers used</th></tr></thead>
        <tbody>{trend.map(day => <tr key={day.day} className="border-t border-gray-100 dark:border-gray-800/60"><th scope="row" className="px-3 py-1.5 font-normal">{day.day}</th><td className="px-3 py-1.5 text-right">{day.requests}</td><td className="px-3 py-1.5 text-right">{day.responses}</td></tr>)}</tbody>
      </table></div>
    </details>
  </figure>;
}

function TrendTooltip({ active, payload, label, colors }: {
  active?: boolean; payload?: Array<{ dataKey?: string | number; name?: string; value?: number | string }>; label?: string | number;
  colors: (typeof TREND_COLORS)["light"];
}) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-gray-700 dark:bg-dark-card">
    <p className="font-medium text-gray-900 dark:text-gray-100">{formatDay(String(label))}</p>
    <ul className="mt-1.5 space-y-1">{payload.map(entry => <li key={String(entry.dataKey)} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
      <span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ background: entry.dataKey === "requests" ? colors.questions : colors.answers }} />
      <strong className="font-semibold tabular-nums text-gray-900 dark:text-white">{entry.value}</strong>{entry.name}
    </li>)}</ul>
  </div>;
}

export function AssignmentAiUsage({ row, loading, unavailable, onRetry }: { row?: UsageRow; loading: boolean; unavailable: boolean; onRetry?: () => void }) {
  const counts = row ? [["Questions asked", row.requests], ["Answers used", row.responses], ["Without an answer", row.unanswered]] as const : [];
  return <section aria-label="Assignment AI usage" aria-busy={loading}>
    <p className="text-xs text-gray-500 dark:text-gray-400">Questions started in this assignment over the last 30 days, including historical participants.</p>
    {loading ? <p role="status" className="mt-5 text-sm text-gray-500 dark:text-gray-400">Loading AI usage…</p>
      : unavailable || !row ? <div role="alert" className="mt-5"><p className="text-sm text-gray-500 dark:text-gray-400">AI usage unavailable</p>{onRetry && <button type="button" onClick={onRetry} className={`${compactButtonClass} mt-3`}>Retry assignment AI usage</button>}</div>
      : <>
        <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 dark:border-gray-700 dark:bg-gray-700">{counts.map(([label, count]) => <div key={label} className="bg-white px-4 py-3 dark:bg-dark-card"><dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt><dd className="mt-1 text-2xl font-semibold">{count.toLocaleString()}</dd></div>)}</dl>
        {row.requests === 0 && <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No AI questions in this assignment in the last 30 days.</p>}
        {row.currentPolicy && <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">{row.currentPolicy.enabled ? `Current limit: ${row.currentPolicy.maximumCurrent} answers per student.` : "AI assistance is currently off for this assignment."}</p>}
        <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{QUOTA_NOTE} Questions blocked, failed, or cancelled do not count.</p>
      </>}
  </section>;
}
