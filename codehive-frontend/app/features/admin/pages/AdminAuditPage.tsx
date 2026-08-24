import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "~/core/providers/AuthProvider";
import { Scope } from "~/shared/types/model/User";
import { listAdminAuditEvents } from "../api/admin.api";
import { AdminApiError } from "../api/client";
import { AdminShell } from "../components/AdminShell";
import { AdminUserFilter } from "../components/AdminUserFilter";
import { AdminEmpty, AdminError, AdminLoading, AdminPageHeader, Pagination, StatusPill, inputClass, panelClass } from "../components/AdminUI";
import type { AdminAuditAction, AdminAuditEvent, AdminAuditOutcome, PageResponse } from "../types/admin.types";
import { endExclusiveLocalDay, errorMessage, formatDate, humanize, startOfLocalDay } from "../utils/format";
import { hasEffectiveScope } from "../utils/permissions";

const ACTIONS: AdminAuditAction[] = ["USER_CREATED", "USER_PROFILE_UPDATED", "USER_ROLE_CHANGED", "USER_BLOCKED", "USER_UNBLOCKED", "USER_DELETED", "USER_SCOPES_CHANGED", "CSV_REGISTRATION_SUBMITTED", "CSV_REGISTRATION_COMPLETED"];

export function AdminAuditPage() {
  const { user } = useAuth(); const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<PageResponse<AdminAuditEvent> | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string>();
  useEffect(() => { const controller = new AbortController(); setLoading(true); setError(undefined); void listAdminAuditEvents({ actorId: params.get("actorId") || undefined, targetId: params.get("targetId") || undefined, action: (params.get("action") as AdminAuditAction) || undefined, outcome: (params.get("outcome") as AdminAuditOutcome) || undefined, from: params.get("from") || undefined, to: params.get("to") || undefined, page: Number(params.get("page") ?? 0), size: Number(params.get("size") ?? 20) }, controller.signal).then(setResult).catch((cause) => { if (cause instanceof DOMException && cause.name === "AbortError") return; setError(cause instanceof AdminApiError && cause.status === 429 ? `${cause.message}${cause.retryAfter ? ` Retry in ${cause.retryAfter}s.` : ""}` : errorMessage(cause, "Could not load audit history.")); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort(); }, [params]);
  function update(key: string, value?: string) { const next = new URLSearchParams(params); value ? next.set(key, value) : next.delete(key); if (key !== "page") next.set("page", "0"); setParams(next); }
  const canSearchUsers = hasEffectiveScope(user, Scope.VIEW_USERS);
  return <AdminShell active="audit" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Audit history" }]}>
    <AdminPageHeader eyebrow="Accountability" title="Audit history" description="Trace successful and failed administrative operations with recorded reasons." />
    <div className="space-y-4"><div className={`${panelClass} p-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4`}>
      {canSearchUsers ? <AdminUserFilter label="Actor" selectedId={params.get("actorId") || undefined} onSelect={(id) => update("actorId", id)} /> : <UuidFilter label="Actor UUID" value={params.get("actorId") ?? ""} onChange={(value) => update("actorId", value)} />}
      {canSearchUsers ? <AdminUserFilter label="Target" selectedId={params.get("targetId") || undefined} onSelect={(id) => update("targetId", id)} /> : <UuidFilter label="Target UUID" value={params.get("targetId") ?? ""} onChange={(value) => update("targetId", value)} />}
      <label><Label text="Action" /><select className={`${inputClass} py-2.5`} value={params.get("action") ?? ""} onChange={(event) => update("action", event.target.value)}><option value="">All actions</option>{ACTIONS.map((action) => <option key={action} value={action}>{humanize(action)}</option>)}</select></label>
      <label><Label text="Outcome" /><select className={`${inputClass} py-2.5`} value={params.get("outcome") ?? ""} onChange={(event) => update("outcome", event.target.value)}><option value="">All outcomes</option><option value="SUCCESS">Success</option><option value="FAILURE">Failure</option></select></label>
      <label><Label text="From" /><input type="date" className={`${inputClass} py-2.5`} value={params.get("from")?.slice(0, 10) ?? ""} onChange={(event) => update("from", startOfLocalDay(event.target.value))} /></label>
      <label><Label text="Through" /><input type="date" className={`${inputClass} py-2.5`} value={params.get("to") ? new Date(new Date(params.get("to")!).getTime() - 1).toISOString().slice(0, 10) : ""} onChange={(event) => update("to", endExclusiveLocalDay(event.target.value))} /></label>
      <label><Label text="Page size" /><select className={`${inputClass} py-2.5`} value={params.get("size") ?? "20"} onChange={(event) => update("size", event.target.value)}><option value="20">20 rows</option><option value="50">50 rows</option><option value="100">100 rows</option></select></label>
    </div>
    {loading ? <AdminLoading rows={6} /> : error ? <AdminError message={error} /> : !result || result.content.length === 0 ? <AdminEmpty title="No audit events found" description="No administrative events match current filters." /> : <><AuditResults events={result.content} /><Pagination page={result.page} totalPages={result.totalPages} totalElements={result.totalElements} onPage={(page) => update("page", String(page))} /></>}
    </div>
  </AdminShell>;
}

function Label({ text }: { text: string }) { return <span className="block text-[10px] uppercase tracking-wide font-semibold text-gray-500 mb-1.5">{text}</span>; }
function UuidFilter({ label, value, onChange }: { label: string; value: string; onChange: (value?: string) => void }) { const [draft, setDraft] = useState(value); return <label><Label text={label} /><input className={`${inputClass} py-2.5 font-mono text-xs`} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => onChange(draft.trim() || undefined)} placeholder="00000000-0000-0000-0000-000000000000" pattern="[0-9a-fA-F-]{36}" /></label>; }
function AuditResults({ events }: { events: AdminAuditEvent[] }) { return <div className={`${panelClass} divide-y divide-gray-100 dark:divide-gray-800/60`}>{events.map((event) => <article key={event.id} className="p-5"><div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><StatusPill label={humanize(event.action)} tone="info" /><StatusPill label={event.outcome} tone={event.outcome === "SUCCESS" ? "success" : "error"} /></div><p className="mt-3 text-sm"><Identity id={event.actorId} name={event.actorDisplayName} /> <span className="text-gray-400">→</span> <Identity id={event.targetId} name={event.targetDisplayName} /></p></div><time className="text-xs text-gray-500 flex-shrink-0">{formatDate(event.occurredAt)}</time></div><div className="mt-3 rounded-xl bg-gray-50 dark:bg-dark-card p-3"><p className="text-sm text-gray-700 dark:text-gray-300">{event.reason}</p>{event.details && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{event.details}</p>}</div>{event.correlationId && <p className="mt-2 text-[10px] font-mono text-gray-400 truncate">Correlation: {event.correlationId}</p>}</article>)}</div>; }
function Identity({ id, name }: { id: string | null; name: string | null }) { return id ? <Link to={`/admin/users/${id}`} className="font-medium hover:text-azure dark:hover:text-yellow">{name ?? id}</Link> : <span className="font-medium text-gray-500">{name ?? "System"}</span>; }
