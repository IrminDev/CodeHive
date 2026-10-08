import { Activity, ArrowLeft, ArrowRight, BarChart3, CalendarDays, ChevronDown, Cpu, ExternalLink, Filter, RefreshCw, Search, Users } from "lucide-react";
import { Link } from "react-router";
import type { Breakdown, Models, Summary, UsageRow } from "~/features/assistant-usage/types";
import { measured } from "~/features/assistant-usage/UsageSummary";
import { AdminAiUsageMetrics, AdminAiUsageOverview, AdminTechnicalUsage, PanelHeading } from "./AdminAiUsageSummary";
import { AdminLoading, compactButtonClass, inputClass, panelClass, StatusPill } from "./AdminUI";

type Props = {
  params: URLSearchParams;
  onChange: (values: Record<string, string | undefined>) => void;
  onRefresh: () => void;
  summary: Summary | null; breakdown: Breakdown | null; models: Models | null;
  loading: boolean; error?: string; tableError?: string; modelsError?: string;
  allowed: boolean; dateValid: boolean; canIdentify: boolean;
  table: string; selectedUser: string; groupId: string; page: number;
  onOpen: (row: UsageRow) => void;
  technicalColumns: boolean; onTechnicalColumns: (value: boolean) => void;
};
const fieldClass = `${inputClass} py-2 text-xs`;
const labelClass = "grid gap-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400";

export function AdminAiUsageDashboard(props: Props) {
  const { params, onChange, onRefresh, summary, breakdown, models, loading, allowed, selectedUser, groupId } = props;
  const from = params.get("aiFrom") ?? "", to = params.get("aiTo") ?? "";
  const lifetime = params.get("aiLifetime") === "true";
  const requestedView = params.get("aiView") ?? "overview";
  const view = requestedView === "activity" || requestedView === "providers" && !selectedUser ? requestedView : "overview";
  const scope = selectedUser ? summary?.label ?? "Student usage" : "Platform usage";

  function range(days: number) {
    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);
    end.setUTCDate(end.getUTCDate() + 1);
    const start = new Date(end.getTime() - days * 86400000);
    onChange({ aiFrom: start.toISOString().slice(0, 10), aiTo: end.toISOString().slice(0, 10), aiLifetime: undefined });
  }
  return <div className="space-y-5">
    <section className={`${panelClass} overflow-hidden`} aria-label="AI usage filters">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800/60">
        <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow"><CalendarDays size={17} /></span><div><h2 className="text-sm font-semibold">Reporting window</h2><p className="mt-0.5 text-[10px] text-gray-500">{lifetime ? "All recorded history" : from || to ? "Custom dates · UTC" : "Last 30 days · default"}</p></div></div>
        <button type="button" disabled={loading} onClick={onRefresh} className={compactButtonClass}><RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh</button>
      </div>
      <div className="flex flex-wrap items-end gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap gap-1 rounded-xl bg-gray-50 p-1 dark:bg-dark-card" aria-label="Quick date ranges">{[7, 30, 90].map(days => <button key={days} type="button" onClick={() => range(days)} className="rounded-lg px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-white hover:text-azure dark:text-gray-300 dark:hover:bg-dark-surface dark:hover:text-yellow">{days} days</button>)}<button type="button" aria-pressed={lifetime} onClick={() => onChange({ aiLifetime: lifetime ? undefined : "true" })} className={`rounded-lg px-3 py-2 text-xs font-medium ${lifetime ? "bg-white text-azure shadow-sm dark:bg-dark-surface dark:text-yellow" : "text-gray-500 hover:text-azure dark:hover:text-yellow"}`}>All history</button></div>
        <label className={labelClass}>From (UTC)<input type="date" className={fieldClass} disabled={lifetime} value={from} onChange={e => onChange({ aiFrom: e.target.value })} /></label>
        <label className={labelClass}>To, exclusive (UTC)<input type="date" className={fieldClass} disabled={lifetime} value={to} onChange={e => onChange({ aiTo: e.target.value })} /></label>
        <button type="button" className={compactButtonClass} onClick={() => onChange({ aiFrom: undefined, aiTo: undefined, aiLifetime: undefined, aiProvider: undefined, aiModel: undefined, aiSearch: undefined })}>Reset filters</button>
      </div>
      {!selectedUser && <details className="group border-t border-gray-100 dark:border-gray-800/60" open={params.has("aiProvider") || params.has("aiModel") || undefined}>
        <summary className="flex cursor-pointer items-center gap-2 px-5 py-3 text-xs font-medium text-gray-500"><Filter size={13} /> Provider & model filters <ChevronDown size={13} className="ml-auto transition-transform group-open:rotate-180" /></summary>
        <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr]"><label className={labelClass}>Provider<input className={fieldClass} placeholder="All providers" value={params.get("aiProvider") ?? ""} onChange={e => onChange({ aiProvider: e.target.value })} /></label><label className={labelClass}>Model<input className={fieldClass} placeholder="All models" value={params.get("aiModel") ?? ""} onChange={e => onChange({ aiModel: e.target.value })} /></label><p className="self-end text-[10px] leading-relaxed text-gray-500">Provider and model filters apply to technical measurements. Educational answer counts keep their full reporting-window scope.</p></div>
      </details>}
    </section>

    {(params.get("aiProvider") || params.get("aiModel")) && <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500"><Filter size={12} /><span>Technical filters:</span>{params.get("aiProvider") && <StatusPill label={`Provider: ${params.get("aiProvider")}`} tone="info" />}{params.get("aiModel") && <StatusPill label={`Model: ${params.get("aiModel")}`} tone="info" />}</div>}

    {(selectedUser || groupId) && <nav aria-label="Usage scope" className="flex flex-wrap items-center gap-2 text-xs"><button type="button" onClick={() => onChange({ userId: undefined, groupId: undefined })} className={compactButtonClass}><ArrowLeft size={12} /> All users</button>{groupId && <button type="button" onClick={() => onChange({ groupId: undefined })} className={compactButtonClass}>All groups</button>}<span className="font-medium">{scope}</span>{groupId && <StatusPill label="Group selected" tone="info" />}</nav>}
    {!props.dateValid && <Notice title="Invalid reporting dates" message="Use valid UTC dates." />}
    {!allowed && <Notice title="User details unavailable" message="VIEW_USERS permission is required for user details." />}
    {props.error && <Notice title="Usage summary unavailable" message={props.error} onRetry={onRefresh} />}
    {allowed && props.dateValid && <>
      {loading ? <div role="status" aria-label="Loading AI usage"><AdminLoading rows={2} /></div> : summary && <>
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">{scope}</h2><span className="text-[10px] text-gray-400">Updated {new Date(summary.generatedAt).toLocaleString()}</span></div>
        <AdminAiUsageMetrics value={summary} />
      </>}
      <nav aria-label="AI usage views" className={`${panelClass} flex flex-wrap gap-1 p-1`}>
        {[{ id: "overview", label: "Overview", icon: BarChart3 }, { id: "activity", label: selectedUser ? groupId ? "Assignments" : "Groups" : "User activity", icon: Users }, ...(!selectedUser ? [{ id: "providers", label: "Providers & models", icon: Cpu }] : [])].map(tab => <button key={tab.id} type="button" aria-pressed={view === tab.id} onClick={() => onChange({ aiView: tab.id })} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition-colors ${view === tab.id ? "bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-card"}`}><tab.icon size={14} />{tab.label}</button>)}
      </nav>
      {view === "overview" && summary && <AdminAiUsageOverview value={summary} />}
      {view === "activity" && (props.canIdentify ? <ActivityTable {...props} /> : <Notice title="User activity requires access" message="VIEW_USERS permission is required to identify users. Platform totals and provider measurements remain available." />)}
      {view === "providers" && <section className={`${panelClass} overflow-hidden`}>
        <PanelHeading icon={<Cpu size={16} />} title="Providers & models" description="Expand a model and processing stage to inspect calls, tokens, and measurement coverage." />
        {props.modelsError ? <div className="p-5"><Notice title="Provider data unavailable" message={props.modelsError} onRetry={onRefresh} /></div> : models && <>
          {models.rows.length === 0 ? <Empty title="No measured provider calls" description="Try a broader date range or clear provider filters." /> : <div className="divide-y divide-gray-100 dark:divide-gray-800/60">{models.rows.map((row, i) => <details key={`${row.provider}:${row.configuredModel}:${row.reportedModel}:${row.stage}:${i}`} className="group">
            <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-dark-card/50"><span className="grid h-9 w-9 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400"><Cpu size={16} /></span><div className="min-w-0 flex-1"><p className="break-words text-xs font-semibold">{row.reportedModel ?? row.configuredModel ?? "Unknown model"}</p><p className="mt-1 text-[10px] text-gray-500">{row.provider ?? "Unknown provider"} · {row.stage.replaceAll("_", " ")}</p></div><span className="font-mono text-xs">{row.technical.calls.toLocaleString()} calls</span><ChevronDown size={15} className="text-gray-400 transition-transform group-open:rotate-180" /></summary>
            <div className="border-t border-gray-100 bg-gray-50/40 p-5 dark:border-gray-800/60 dark:bg-dark-surface"><AdminTechnicalUsage value={row.technical} startedAt={models.instrumentationStartedAt} /></div>
          </details>)}</div>}
        </>}
      </section>}
    </>}
  </div>;
}

function ActivityTable(props: Props) {
  const { table, params, onChange, breakdown, onOpen, technicalColumns } = props;
  const quotaColumn = table === "assignments";
  return <section className={`${panelClass} overflow-hidden`} aria-label="AI usage breakdown table">
    <PanelHeading icon={<Activity size={16} />} title={table === "users" ? "User activity" : table === "groups" ? "Group activity" : "Assignment activity"} description={table === "users" ? "Select a user to explore their groups and assignment usage." : table === "groups" ? "Select a group to see assignment activity and lifetime quotas." : "Answer quotas cover each assignment's lifetime, independent of date filters."} />
    <div className="flex flex-wrap items-end gap-3 border-b border-gray-100 p-4 dark:border-gray-800/60">
      <label className={`${labelClass} min-w-44 flex-1`}>Search<span className="relative"><Search size={13} className="absolute left-3 top-2.5 text-gray-400" /><input className={`${fieldClass} pl-8`} value={params.get("aiSearch") ?? ""} placeholder={`Search ${table}…`} onChange={e => onChange({ aiSearch: e.target.value })} /></span></label>
      <label className={labelClass}>Sort<select className={fieldClass} value={params.get("aiSort") ?? "label"} onChange={e => onChange({ aiSort: e.target.value })}>{[["label", "Name"], ["requests", "Questions"], ["responses", "Answers used"], ["lastActivity", "Last activity"]].map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
      <label className={labelClass}>Order<select className={fieldClass} value={params.get("aiDirection") ?? "ASC"} onChange={e => onChange({ aiDirection: e.target.value })}><option value="ASC">Ascending</option><option value="DESC">Descending</option></select></label>
      <label className="flex items-center gap-2 py-2 text-xs text-gray-500"><input type="checkbox" checked={technicalColumns} onChange={e => props.onTechnicalColumns(e.target.checked)} className="accent-azure dark:accent-yellow" /> Show technical columns</label>
    </div>
    {props.tableError ? <div className="p-5"><Notice title="Activity unavailable" message={props.tableError} onRetry={props.onRefresh} /></div> : breakdown && <>
      {breakdown.rows.content.length === 0 ? <Empty title="No matching activity" description="Try another search or a broader reporting window." /> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><caption className="sr-only">AI usage by {table}. Quotas are lifetime, independent of date filters.</caption>
        <thead className="bg-gray-50 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-dark-card"><tr>{["Name", "Questions", "Answers used", "Without answer", ...(quotaColumn ? ["Lifetime quota"] : []), ...(technicalColumns ? ["Regenerations", "Provider calls", "Known tokens"] : []), "Last activity"].map((h, index) => <th key={h} scope="col" className={`whitespace-nowrap px-4 py-3 ${index > 0 && h !== "Last activity" ? "text-right" : ""}`}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">{breakdown.rows.content.map(row => <tr key={row.id} className="transition-colors hover:bg-gray-50/80 dark:hover:bg-dark-card/50">
          <th scope="row" className="min-w-48 px-4 py-4 font-medium">{table === "users" || table === "groups" ? <button type="button" onClick={() => onOpen(row)} className="inline-flex items-center gap-2 text-left text-azure hover:underline dark:text-yellow">{row.label}<ArrowRight size={12} className="shrink-0" /></button> : row.label}{row.enrollmentNumber && <p className="mt-1 font-mono text-[10px] text-gray-400">{row.enrollmentNumber}</p>}{table === "users" && <Link to={`/admin/users/${row.id}?tab=ai-usage`} className="mt-2 inline-flex items-center gap-1 text-[10px] text-gray-500 hover:text-azure dark:hover:text-yellow" aria-label={`Open profile for ${row.label}`}>User profile <ExternalLink size={10} /></Link>}{row.currentPolicy && <p className="mt-1 text-[10px] text-gray-500">{row.currentPolicy.enabled ? `Current answer limit: ${row.currentPolicy.maximumCurrent}` : "AI disabled"}</p>}</th>
          <td className="px-4 py-4 text-right font-mono">{row.requests.toLocaleString()}</td><td className="px-4 py-4 text-right font-mono font-semibold text-green-600 dark:text-green-400">{row.responses.toLocaleString()}</td><td className="px-4 py-4 text-right font-mono">{row.unanswered.toLocaleString()}</td>
          {quotaColumn && <td className="min-w-40 px-4 py-4 text-right">{row.quota ? <><p className="font-mono">{row.quota.usedLifetime} / {row.quota.maximumCurrent}</p><p className="mt-1 text-[10px] text-gray-500">{row.quota.remainingNow} remaining · {row.quota.pendingReservations} pending</p>{row.quota.limitReduced && <p className="mt-1 text-[10px] text-orange-500">Current limit reduced</p>}<p className="mt-1 text-[9px] text-gray-400">Remaining quota does not guarantee eligibility.</p></> : <span className="text-gray-400">Unavailable</span>}</td>}
          {technicalColumns && <><td className="px-4 py-4 text-right font-mono">{row.regenerations.toLocaleString()}</td><td className="px-4 py-4 text-right font-mono">{row.calls.toLocaleString()}</td><td className="whitespace-nowrap px-4 py-4 text-right font-mono">{measured(row.knownTotalTokens)}</td></>}
          <td className="whitespace-nowrap px-4 py-4 text-[10px] text-gray-500">{row.lastActivity ? new Date(row.lastActivity).toLocaleString() : "No activity"}</td>
        </tr>)}</tbody>
      </table></div>}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-800/60"><p className="text-[10px] text-gray-500">Page {props.page + 1} · {breakdown.rows.totalElements.toLocaleString()} {table}</p><div className="flex gap-2"><button type="button" className={compactButtonClass} disabled={props.page === 0} onClick={() => onChange({ aiPage: String(props.page - 1) })}><ArrowLeft size={12} /> Previous</button><button type="button" className={compactButtonClass} disabled={breakdown.rows.last} onClick={() => onChange({ aiPage: String(props.page + 1) })}>Next <ArrowRight size={12} /></button></div></footer>
      <p className="px-4 pb-3 text-[9px] text-gray-400">Activity generated {new Date(breakdown.generatedAt).toLocaleString()}</p>
    </>}
  </section>;
}

function Notice({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return <div role="alert" className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4"><h3 className="text-xs font-semibold text-orange-700 dark:text-orange-400">{title}</h3><p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{message}</p>{onRetry && <button type="button" onClick={onRetry} className={`${compactButtonClass} mt-3`}><RefreshCw size={12} /> Retry</button>}</div>;
}
function Empty({ title, description }: { title: string; description: string }) {
  return <div className="p-10 text-center"><Search size={24} className="mx-auto text-gray-300 dark:text-gray-600" /><h3 className="mt-3 text-sm font-medium">{title}</h3><p className="mt-1 text-xs text-gray-500">{description}</p></div>;
}
