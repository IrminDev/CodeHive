import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "~/core/providers/AuthProvider";
import { Scope } from "~/shared/types/model/User";
import { hasEffectiveScope } from "~/features/admin/utils/permissions";
import { ownedUsageGroups, usageQuery, usageRequest } from "./api";
import { measured, TechnicalUsage, UsageSummary, usageInput, usagePanel } from "./UsageSummary";
import type { Audience, Breakdown, GroupOption, Models, Summary, UsageRow } from "./types";

export function UsageDashboard(props: { audience: Audience; fixedUserId?: string }) {
  const { user } = useAuth();
  return <UsageDashboardContent key={`${user?.id ?? "anonymous"}:${props.audience}:${props.fixedUserId ?? ""}`} {...props} />;
}
function UsageDashboardContent({ audience, fixedUserId }: { audience: Audience; fixedUserId?: string }) {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [refresh, setRefresh] = useState(0);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [groupsError, setGroupsError] = useState<string>();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [models, setModels] = useState<Models | null>(null);
  const [error, setError] = useState<string>();
  const [tableError, setTableError] = useState<string>();
  const [modelsError, setModelsError] = useState<string>();
  const [technicalColumns, setTechnicalColumns] = useState(audience === "admin");
  const [loadedFor, setLoadedFor] = useState<string>();
  const [loading, setLoading] = useState(false);
  const canIdentify = audience !== "admin" || hasEffectiveScope(user, Scope.VIEW_USERS);
  const selectedUser = fixedUserId ?? (audience === "admin" ? params.get("userId") ?? "" : "");
  const groupId = params.get("groupId") ?? "";
  const assignmentId = audience === "owner" ? params.get("assignmentId") ?? "" : "";
  const from = params.get("aiFrom") ?? "", to = params.get("aiTo") ?? "";
  const lifetime = params.get("aiLifetime") === "true";
  const page = Math.max(0, Number(params.get("aiPage") ?? 0) || 0);
  const search = params.get("aiSearch") ?? "", sort = params.get("aiSort") ?? "label";
  const direction = params.get("aiDirection") ?? "ASC";
  const table = audience === "owner" ? (assignmentId || params.get("aiTable") === "students" ? "students" : "assignments") : (audience === "personal" || selectedUser ? (groupId ? "assignments" : "groups") : "users");
  const base = audience === "owner" ? (assignmentId ? `/api/assignments/${encodeURIComponent(assignmentId)}/assistant-usage` : `/api/groups/${encodeURIComponent(groupId)}/assistant-usage`) : audience === "personal" ? `/api/assistant-usage/me${groupId ? `/groups/${encodeURIComponent(groupId)}` : ""}` : selectedUser ? `/api/admin/users/${encodeURIComponent(selectedUser)}/assistant-usage` : "/api/admin/assistant-usage";
  const allowed = audience === "owner" ? Boolean(groupId) : audience !== "admin" || !selectedUser || canIdentify;
  const dateValid = lifetime || ((!from || /^\d{4}-\d{2}-\d{2}$/.test(from)) && (!to || /^\d{4}-\d{2}-\d{2}$/.test(to)));
  const query = usageQuery({ ...(lifetime ? { lifetime: true } : { from: from ? `${from}T00:00:00Z` : undefined, to: to ? `${to}T00:00:00Z` : undefined }),
    ...(audience === "admin" && selectedUser && groupId || audience === "owner" && assignmentId ? { groupId } : {}),
    ...(audience === "admin" ? { provider: params.get("aiProvider") ?? undefined, model: params.get("aiModel") ?? undefined } : {}) });
  const tableQuery = query + (query ? "&" : "?") + new URLSearchParams({ page: String(page), size: "20", search, sort, direction });
  const tablePath = audience === "admin" && selectedUser && groupId ? `${base}/groups/${encodeURIComponent(groupId)}/assignments` : `${base}/${table}`;
  const dataScope = `${base}:${tablePath}:${tableQuery}:${canIdentify}`;
  const currentData = loadedFor === dataScope;
  function change(values: Record<string, string | undefined>) {
    setParams(current => { const next = new URLSearchParams(current); next.delete("aiPage"); Object.entries(values).forEach(([k, v]) => { if (v) next.set(k, v); else next.delete(k); }); return next; });
  }
  useEffect(() => {
    if (audience !== "owner") return;
    const controller = new AbortController(); setGroups([]); setGroupsError(undefined);
    void ownedUsageGroups(controller.signal).then(value => { if (!controller.signal.aborted) setGroups(value); }).catch(cause => { if (!controller.signal.aborted) setGroupsError(cause instanceof Error ? cause.message : "Could not load owned groups."); });
    return () => controller.abort();
  }, [audience, user?.id, refresh]);
  useEffect(() => {
    const reload = () => setRefresh(value => value + 1);
    window.addEventListener("assistant-usage-changed", reload);
    return () => window.removeEventListener("assistant-usage-changed", reload);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoadedFor(undefined); setSummary(null); setBreakdown(null); setModels(null); setError(undefined); setTableError(undefined); setModelsError(undefined);
    if (!allowed || !dateValid) { setLoading(false); return () => controller.abort(); }
    setLoading(true);
    const safe = <T,>(promise: Promise<T>, accept: (v: T) => void, reject: (s: string) => void) => promise.then(v => { if (!controller.signal.aborted) accept(v); }).catch(cause => { if (!controller.signal.aborted) reject(cause instanceof Error ? cause.message : "Could not load AI usage."); });
    void Promise.all([
      safe(usageRequest<Summary>(audience, base + query, controller.signal), setSummary, setError),
      table === "users" && !canIdentify ? Promise.resolve() : safe(usageRequest<Breakdown>(audience, tablePath + tableQuery, controller.signal), setBreakdown, setTableError),
      audience === "admin" && !selectedUser ? safe(usageRequest<Models>(audience, "/api/admin/assistant-usage/models" + query, controller.signal), setModels, setModelsError) : Promise.resolve(),
    ]).finally(() => { if (!controller.signal.aborted) { setLoadedFor(dataScope); setLoading(false); } });
    return () => controller.abort();
  }, [audience, base, query, tablePath, tableQuery, allowed, dateValid, canIdentify, selectedUser, user?.id, refresh, table, dataScope]);
  function open(row: UsageRow) {
    if (table === "groups") change({ groupId: row.id });
    else if (table === "users") change({ userId: row.id, groupId: undefined });
    else if (table === "assignments" && audience === "owner") change({ assignmentId: row.id });
  }
  return <div className="space-y-5">
    <div className={`${usagePanel} flex flex-wrap items-end gap-3`}>
      {audience === "owner" && <label className="grid gap-1 text-xs">Owned group<select className={usageInput} value={groupId} onChange={e => change({ groupId: e.target.value, assignmentId: undefined })}><option value="">Choose a group</option>{groups.map(g => <option key={g.id} value={g.id}>{g.label} ({g.lifecycle})</option>)}</select></label>}
      <label className="grid gap-1 text-xs">From (UTC)<input className={usageInput} type="date" disabled={lifetime} value={from} onChange={e => change({ aiFrom: e.target.value })} /></label>
      <label className="grid gap-1 text-xs">To, exclusive (UTC)<input className={usageInput} type="date" disabled={lifetime} value={to} onChange={e => change({ aiTo: e.target.value })} /></label>
      <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={lifetime} onChange={e => change({ aiLifetime: e.target.checked ? "true" : undefined })} />All history</label>
      <button className={usageInput} onClick={() => setRefresh(v => v + 1)}>Refresh</button>
      {groupId && audience !== "owner" && <button className={usageInput} onClick={() => change({ groupId: undefined })}>All groups</button>}
      {assignmentId && <button className={usageInput} onClick={() => change({ assignmentId: undefined })}>Back to group</button>}
      {selectedUser && !fixedUserId && <button className={usageInput} onClick={() => change({ userId: undefined, groupId: undefined })}>All users</button>}
    </div>
    {audience === "admin" && !selectedUser && <div className="flex flex-wrap gap-3"><label className="grid gap-1 text-xs">Provider<input className={usageInput} value={params.get("aiProvider") ?? ""} onChange={e => change({ aiProvider: e.target.value })} /></label><label className="grid gap-1 text-xs">Model<input className={usageInput} value={params.get("aiModel") ?? ""} onChange={e => change({ aiModel: e.target.value })} /></label><p className="text-xs text-gray-500 self-end">Provider/model filters affect technical measurements only.</p></div>}
    {groupsError && <p role="alert">{groupsError}</p>}
    {!dateValid && <p role="alert">Use valid UTC dates.</p>}
    {!allowed && <p role="status">{audience === "owner" ? "Choose an owned group, including archived or deleted groups." : "VIEW_USERS permission is required for user details."}</p>}
    {loading && <p role="status">Loading AI usage…</p>}
    {error && <div role="alert" className={usagePanel}>{error} <button onClick={() => setRefresh(v => v + 1)}>Retry</button></div>}
    {currentData && summary && <UsageSummary value={summary} personal={audience === "personal"} />}
    {audience === "owner" && !assignmentId && groupId && <nav aria-label="AI usage breakdown" className="flex gap-3"><button className={usageInput} aria-pressed={table === "assignments"} onClick={() => change({ aiTable: "assignments" })}>Assignments</button><button className={usageInput} aria-pressed={table === "students"} onClick={() => change({ aiTable: "students" })}>Students</button></nav>}
    {allowed && (table !== "users" || canIdentify) && <section className={usagePanel} aria-label="AI usage breakdown table"><div className="flex flex-wrap gap-3 items-end mb-4"><h2 className="font-semibold capitalize mr-auto">{table}</h2><label className="flex gap-2 text-xs items-center"><input type="checkbox" checked={technicalColumns} onChange={e => setTechnicalColumns(e.target.checked)} />Show technical columns</label><label className="grid gap-1 text-xs">Search<input className={usageInput} value={search} onChange={e => change({ aiSearch: e.target.value })} /></label><label className="grid gap-1 text-xs">Sort<select className={usageInput} value={sort} onChange={e => change({ aiSort: e.target.value })}>{[["label", "Name"], ["requests", "Questions"], ["responses", "Answers used"], ["lastActivity", "Last activity"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label><label className="grid gap-1 text-xs">Order<select className={usageInput} value={direction} onChange={e => change({ aiDirection: e.target.value })}><option>ASC</option><option>DESC</option></select></label></div>
      {tableError ? <p role="alert">{tableError} <button onClick={() => setRefresh(v => v + 1)}>Retry table</button></p> : currentData && breakdown && <><div className="overflow-x-auto"><table className="w-full text-sm text-left"><caption className="sr-only">AI usage by {table}. Quota is lifetime and independent of date filters.</caption><thead><tr>{["Name", "Questions", "Answers used", "Without answer", "Regenerations", "Lifetime quota / remaining", ...(technicalColumns ? ["Provider calls", "Known tokens"] : []), "Last activity"].map(h => <th key={h} className="p-2 whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{breakdown.rows.content.map(row => <tr key={row.id} className="border-t border-gray-200 dark:border-gray-800"><td className="p-2">{table === "groups" || table === "users" || table === "assignments" && audience === "owner" ? <button className="text-azure dark:text-yellow underline" onClick={() => open(row)}>{row.label}</button> : row.label}{row.enrollmentNumber && <small className="block">{row.enrollmentNumber}{table === "students" ? row.currentParticipant ? " · Current student" : " · Historical participant" : ""}</small>}{audience === "personal" && table === "assignments" && row.requests > 0 && <Link className="block text-xs underline" to={`/assignment/${row.id}/assistant-history`}>My conversation history</Link>}{audience === "admin" && table === "users" && <Link className="block text-xs underline" to={`/admin/users/${row.id}?tab=ai-usage`}>User detail</Link>}{row.currentPolicy && <small className="block">{row.currentPolicy.enabled ? `Current limit: ${row.currentPolicy.maximumCurrent}` : "AI disabled"}</small>}</td><td className="p-2">{row.requests}</td><td className="p-2">{row.responses}</td><td className="p-2">{row.unanswered}</td><td className="p-2">{row.regenerations}</td><td className="p-2">{row.quota ? <>{row.quota.usedLifetime} / {row.quota.maximumCurrent} · {row.quota.remainingNow} remaining{row.quota.pendingReservations > 0 && <small className="block">{row.quota.pendingReservations} pending reservations</small>}{row.quota.limitReduced && <small className="block">Current limit reduced</small>}<small className="block">Remaining quota does not guarantee eligibility.</small></> : "Per assignment only"}</td>{technicalColumns && <><td className="p-2">{row.calls}</td><td className="p-2">{measured(row.knownTotalTokens)}</td></>}<td className="p-2">{row.lastActivity ? new Date(row.lastActivity).toLocaleString() : "No activity"}</td></tr>)}</tbody></table></div>{breakdown.rows.content.length === 0 && <p>No matching usage rows.</p>}<div className="flex flex-wrap items-center gap-3 mt-4 text-sm"><button className={usageInput} disabled={page === 0} onClick={() => change({ aiPage: String(page - 1) })}>Previous</button><span>Page {page + 1} · {breakdown.rows.totalElements} rows</span><button className={usageInput} disabled={breakdown.rows.last} onClick={() => change({ aiPage: String(page + 1) })}>Next</button><span className="text-xs text-gray-500">Generated {new Date(breakdown.generatedAt).toLocaleString()}</span></div></>}
    </section>}
    {modelsError && <p role="alert">{modelsError} <button onClick={() => setRefresh(v => v + 1)}>Retry models</button></p>}
    {currentData && models && <section className={usagePanel}><h2 className="font-semibold mb-4">Provider, model and stage</h2>{models.rows.length === 0 && <p>No measured provider calls.</p>}{models.rows.map((row, i) => <details key={i} className="border-t border-gray-200 dark:border-gray-800 py-3"><summary className="cursor-pointer">{row.provider ?? "Unknown provider"} · {row.reportedModel ?? row.configuredModel ?? "Unknown model"} · {row.stage.replaceAll("_", " ")} · {row.technical.calls} calls</summary><div className="mt-3"><TechnicalUsage value={row.technical} startedAt={models.instrumentationStartedAt} /></div></details>)}</section>}
  </div>;
}
