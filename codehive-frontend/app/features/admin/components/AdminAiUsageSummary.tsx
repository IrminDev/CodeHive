import type { ReactNode } from "react";
import { Activity, BarChart3, CheckCircle2, ChevronDown, CircleAlert, Clock3, Cpu, MessageSquare, Sparkles, Users } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Summary, Technical } from "~/features/assistant-usage/types";
import { measured } from "~/features/assistant-usage/UsageSummary";
import { panelClass, StatusPill } from "./AdminUI";

export function AdminAiUsageMetrics({ value }: { value: Summary }) {
  const e = value.educational;
  const cards = [
    { label: "Questions asked", value: e.requests, hint: "Started in reporting window", icon: MessageSquare, color: "bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow" },
    { label: "Answers used", value: e.responses, hint: "Delivered answers consume quota", icon: Sparkles, color: "bg-green-500/10 text-green-600 dark:text-green-400" },
    { label: "Without an answer", value: e.blocked + e.failed + e.cancelled, hint: "Blocked, failed, or cancelled", icon: CircleAlert, color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
    { label: "In progress", value: e.pending, hint: "Questions awaiting an outcome", icon: Clock3, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
    { label: "Students with activity", value: e.activeUsers, hint: "Includes historical participants", icon: Users, color: "bg-gray-100 text-gray-600 dark:bg-dark-card dark:text-gray-300" },
  ];
  return <dl className="grid grid-cols-2 gap-3 xl:grid-cols-5">{cards.map(card => <div key={card.label} className={`${panelClass} relative overflow-hidden p-4 sm:p-5`}>
    <span className={`grid h-9 w-9 place-items-center rounded-xl ${card.color}`}><card.icon size={17} /></span>
    <dt className="mt-4 text-xs font-medium text-gray-500 dark:text-gray-400">{card.label}</dt>
    <dd className="mt-1 font-mono text-3xl font-bold tracking-tight">{card.value.toLocaleString()}</dd>
    <p className="mt-2 text-[10px] leading-relaxed text-gray-400">{card.hint}</p>
  </div>)}</dl>;
}

export function AdminAiUsageOverview({ value }: { value: Summary }) {
  const e = value.educational;
  const hasTrend = value.trend.some(day => day.requests > 0 || day.calls > 0);
  return <div className="space-y-5">
    <section className={`${panelClass} overflow-hidden`} aria-label="Daily AI usage trend">
      <PanelHeading icon={<BarChart3 size={16} />} title="Activity over time" description="Daily counts in UTC. Questions use question start; provider calls use call start." />
      {hasTrend ? <div className="p-4 sm:p-5">
        <div className="h-64 sm:h-72" aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><LineChart data={value.trend} margin={{ top: 12, right: 12, left: -15, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} /><XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} /><Line type="monotone" dataKey="requests" name="Questions" stroke="#00509D" strokeWidth={2} strokeDasharray="4 2" dot={false} /><Line type="monotone" dataKey="responses" name="Answers used" stroke="#16a34a" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="calls" name="Provider calls" stroke="#9333ea" strokeWidth={2} strokeDasharray="2 2" dot={false} /></LineChart></ResponsiveContainer></div>
        <details className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700"><summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-xs font-medium"><ChevronDown size={14} /> View daily data table</summary><div className="overflow-x-auto border-t border-gray-100 dark:border-gray-800"><table className="w-full text-right text-xs"><caption className="sr-only">Daily usage counts and known tokens, UTC</caption><thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500 dark:bg-dark-card"><tr>{["Date", "Questions", "Answers used", "Calls", "Known tokens"].map(h => <th key={h} scope="col" className="whitespace-nowrap px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100 dark:divide-gray-800">{value.trend.map(day => <tr key={day.day}><th scope="row" className="px-4 py-3 font-mono font-medium">{day.day}</th>{[day.requests, day.responses, day.calls].map((count, index) => <td key={index} className="px-4 py-3 font-mono">{count.toLocaleString()}</td>)}<td className="px-4 py-3 font-mono">{measured(day.knownTotalTokens)}</td></tr>)}</tbody></table></div></details>
      </div> : <div className="p-10 text-center"><BarChart3 size={26} className="mx-auto text-gray-300 dark:text-gray-600" /><p className="mt-3 text-sm font-medium">{value.filters.from ? "No activity in this date range" : "Daily trend needs a date range"}</p><p className="mt-1 text-xs text-gray-500">{value.filters.from ? "Try a broader reporting window." : "Choose 7, 30, or 90 days to see activity over time."}</p></div>}
    </section>

    <div className="grid items-start gap-5 xl:grid-cols-2">
      <section className={`${panelClass} overflow-hidden`}>
        <PanelHeading icon={<CheckCircle2 size={16} />} title="Question outcomes" description="Current outcomes of questions started in this reporting window." />
        <div className="space-y-3 p-5">{[["Educational answers", e.completed, "bg-green-500"], ["Educational redirections", e.redirected, "bg-azure dark:bg-yellow"], ["Blocked", e.blocked, "bg-orange-500"], ["Failed", e.failed, "bg-red-500"], ["Cancelled", e.cancelled, "bg-gray-400"], ["Pending", e.pending, "bg-purple-500"]].map(([label, count, color]) => <div key={label} className="flex items-center gap-2 text-xs"><span className={`h-2 w-2 rounded-full ${color}`} /><span className="flex-1 text-gray-600 dark:text-gray-300">{label}</span><strong className="font-mono">{Number(count).toLocaleString()}</strong></div>)}<p className="border-t border-gray-100 pt-3 text-[10px] leading-relaxed text-gray-500 dark:border-gray-800">Educational redirections consume one answer. Questions without a delivered answer do not consume quota, even when provider work occurred.</p></div>
      </section>
      <section className={`${panelClass} overflow-hidden`}>
        <PanelHeading icon={<Cpu size={16} />} title="Provider consumption" description="Measured technical work, separate from student answer quota." />
        <div className="p-5"><AdminTechnicalUsage value={value.technical} startedAt={value.instrumentationStartedAt} /></div>
      </section>
    </div>

    <details className={`${panelClass} group overflow-hidden`}>
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4"><span className="flex items-center gap-2 text-sm font-semibold"><Activity size={16} className="text-azure dark:text-yellow" /> Educational details</span><ChevronDown size={16} className="text-gray-400 transition-transform group-open:rotate-180" /></summary>
      <div className="space-y-4 border-t border-gray-100 p-5 dark:border-gray-800">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Fact label="Regenerations" value={e.regenerations.toLocaleString()} /><Fact label="Students receiving answers" value={e.respondingUsers.toLocaleString()} /><Fact label="Response latency" value={e.averageLatencyMs == null ? "Not measured" : `${e.averageLatencyMs.toLocaleString()} ms`} /><Fact label="Latency samples" value={e.latencySamples.toLocaleString()} /><Fact label="Editor opt-ins" value={e.editorOptIns.toLocaleString()} /><Fact label="Execution opt-ins" value={e.executionOptIns.toLocaleString()} /></dl>
        <div className="grid gap-4 sm:grid-cols-2"><Levels title="Requested assistance" values={e.requestedLevels} /><Levels title="Delivered assistance" values={e.deliveredLevels} /></div>
        {value.currentPolicy && <p className="text-xs text-gray-500">Current policy: {value.currentPolicy.enabled ? `${value.currentPolicy.maximumCurrent} lifetime answers per student · ${value.currentPolicy.level?.replaceAll("_", " ") ?? "No level"}` : "AI disabled"}. Current policy does not describe historical permissions.</p>}
        <p className="text-[10px] leading-relaxed text-gray-500">Opt-ins count consent choices, not context actually sent. Usage frequency does not measure learning, dependence, or cheating.</p>
      </div>
    </details>
    {e.historicalUninstrumented > 0 && <div role="status" className="flex items-start gap-2 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-xs text-orange-700 dark:text-orange-400"><CircleAlert size={15} className="shrink-0" /><p>{e.historicalUninstrumented.toLocaleString()} historical questions have no call instrumentation. Their tokens and calls cannot be reconstructed.</p></div>}
  </div>;
}

export function AdminTechnicalUsage({ value, startedAt }: { value: Technical; startedAt: string | null }) {
  const coverage = value.coveragePercent;
  return <div className="space-y-4">
    <dl className="grid grid-cols-2 gap-3"><Fact label="Provider calls" value={value.calls.toLocaleString()} /><Fact label="Known total tokens" value={measured(value.knownTotalTokens)} /><Fact label="Known input tokens" value={measured(value.knownInputTokens)} /><Fact label="Known output tokens" value={measured(value.knownOutputTokens)} /></dl>
    <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-medium">Measurement coverage</span><StatusPill label={coverage == null ? "Not measured" : `${coverage}%`} tone={coverage === 100 ? "success" : "warning"} /></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-card"><div className="h-full rounded-full bg-azure dark:bg-yellow" style={{ width: `${Math.max(0, Math.min(100, coverage ?? 0))}%` }} /></div><p className="mt-2 text-[10px] text-gray-500">{value.measuredCalls.toLocaleString()} measured / {value.calls.toLocaleString()} calls · {value.unknownCalls.toLocaleString()} with unknown tokens</p>{value.unknownCalls > 0 && <p className="mt-1 text-[10px] text-orange-600 dark:text-orange-400">Actual consumption may be higher.</p>}</div>
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Fact label="Succeeded" value={value.succeeded.toLocaleString()} /><Fact label="Failed calls" value={value.failed.toLocaleString()} /><Fact label="Uncertain results" value={value.uncertain.toLocaleString()} /><Fact label="Caller timeouts" value={value.callerTimeouts.toLocaleString()} /><Fact label="Provider latency" value={value.averageLatencyMs == null ? "Not measured" : `${value.averageLatencyMs.toLocaleString()} ms`} /><Fact label="Latency samples" value={value.latencySamples.toLocaleString()} /></dl>
    <p className="text-[10px] text-gray-500">First recorded call: {startedAt ? new Date(startedAt).toLocaleString() : "No recorded calls yet"}</p>
    <p className="text-[10px] leading-relaxed text-gray-500">Tokens include reviews and failed questions. They are not money or answer quota. Provider totals may differ from input plus output.</p>
  </div>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-gray-50 p-3 dark:bg-dark-card"><dt className="text-[10px] text-gray-500 dark:text-gray-400">{label}</dt><dd className="mt-1 break-words font-mono text-sm font-semibold">{value}</dd></div>;
}
function Levels({ title, values }: { title: string; values: Record<string, number> }) {
  return <div><h3 className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{title}</h3><dl className="mt-2 space-y-2">{Object.entries(values).map(([level, count]) => <div key={level} className="flex justify-between gap-2 text-xs"><dt>{level.replaceAll("_", " ")}</dt><dd className="font-mono">{count.toLocaleString()}</dd></div>)}</dl>{!Object.keys(values).length && <p className="mt-2 text-xs text-gray-500">Not measured</p>}</div>;
}
export function PanelHeading({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <header className="border-b border-gray-100 bg-gray-50/60 px-5 py-4 dark:border-gray-800/60 dark:bg-dark-card/40"><h2 className="flex items-center gap-2 text-sm font-semibold"><span className="text-azure dark:text-yellow">{icon}</span>{title}</h2><p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{description}</p></header>;
}
