import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { CalendarInput } from "~/shared/components/ui/CalendarInput";
import { Dropdown } from "~/shared/components/ui/Dropdown";
import { listRateLimitIncidents } from "../api/admin.api";
import { AdminApiError } from "../api/client";
import { AdminShell } from "../components/AdminShell";
import { AdminUserFilter } from "../components/AdminUserFilter";
import { AdminEmpty, AdminError, AdminLoading, AdminPageHeader, Pagination, StatusPill, inputClass, panelClass } from "../components/AdminUI";
import type { PageResponse, RateLimitIncident } from "../types/admin.types";
import { endExclusiveLocalDay, errorMessage, formatDate, startOfLocalDay } from "../utils/format";

export function AdminIncidentsPage() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState<PageResponse<RateLimitIncident> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(undefined);
    void listRateLimitIncidents({ userId: params.get("userId") || undefined, policy: params.get("policy") || undefined, method: params.get("method") || undefined, endpoint: params.get("endpoint") || undefined, from: params.get("from") || undefined, to: params.get("to") || undefined, page: Number(params.get("page") ?? 0), size: Number(params.get("size") ?? 20) }, controller.signal)
      .then(setResult).catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof AdminApiError && cause.status === 429 ? `${cause.message}${cause.retryAfter ? ` Retry in ${cause.retryAfter}s.` : ""}${cause.policy ? ` Policy: ${cause.policy}.` : ""}` : errorMessage(cause, "Could not load incidents."));
      }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [params]);
  function update(key: string, value?: string) { const next = new URLSearchParams(params); value ? next.set(key, value) : next.delete(key); if (key !== "page") next.set("page", "0"); setParams(next); }
  const fromDate = params.get("from")?.slice(0, 10) ?? "";
  const toDate = params.get("to") ? new Date(new Date(params.get("to")!).getTime() - 1).toISOString().slice(0, 10) : "";
  return <AdminShell active="incidents" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Incidents" }]}>
    <AdminPageHeader eyebrow="Moderation" title="Rate-limit incidents" description="Review authenticated users repeatedly rejected by endpoint rate limits. Rows remain available for 180 days." />
    <div className="space-y-4">
      <div className={`${panelClass} p-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4`}>
        <AdminUserFilter label="User" selectedId={params.get("userId") || undefined} onSelect={(id) => update("userId", id)} />
        <TextFilter label="Policy" value={params.get("policy") ?? ""} placeholder="global.authenticated" onChange={(value) => update("policy", value)} />
        <TextFilter label="Endpoint" value={params.get("endpoint") ?? ""} placeholder="/api/execution/check/{id}" onChange={(value) => update("endpoint", value)} />
        <label><FilterLabel text="Method" /><Dropdown value={params.get("method") ?? ""} onChange={(value) => update("method", value)} options={["", "GET", "POST", "PATCH", "PUT", "DELETE"].map((method) => ({ value: method, label: method || "All methods" }))} /></label>
        <label><FilterLabel text="From" /><CalendarInput value={fromDate} onChange={(value) => update("from", startOfLocalDay(value))} /></label>
        <label><FilterLabel text="Through" /><CalendarInput value={toDate} onChange={(value) => update("to", endExclusiveLocalDay(value))} /></label>
        <label><FilterLabel text="Page size" /><Dropdown value={params.get("size") ?? "20"} onChange={(value) => update("size", value)} options={[20, 50, 100].map((size) => ({ value: size, label: `${size} rows` }))} /></label>
      </div>
      {loading ? <AdminLoading rows={6} /> : error ? <AdminError message={error} /> : !result || result.content.length === 0 ? <AdminEmpty title="No incidents found" description="No retained rate-limit violations match current filters." /> : <><IncidentResults incidents={result.content} /><Pagination page={result.page} totalPages={result.totalPages} totalElements={result.totalElements} onPage={(page) => update("page", String(page))} /></>}
    </div>
  </AdminShell>;
}

function TextFilter({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value?: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <label><FilterLabel text={label} /><input className={`${inputClass} py-2.5`} value={draft} placeholder={placeholder} onChange={(event) => setDraft(event.target.value)} onBlur={() => onChange(draft.trim() || undefined)} onKeyDown={(event) => { if (event.key === "Enter") onChange(draft.trim() || undefined); }} /></label>;
}
function FilterLabel({ text }: { text: string }) { return <span className="block text-[10px] uppercase tracking-wide font-semibold text-gray-500 mb-1.5">{text}</span>; }

function IncidentResults({ incidents }: { incidents: RateLimitIncident[] }) {
  return <div className={`${panelClass} divide-y divide-gray-100 dark:divide-gray-800/60`}>{incidents.map((item) => <article key={item.id} className="p-4 sm:p-5 grid gap-3 sm:grid-cols-[minmax(160px,.8fr)_minmax(220px,1.3fr)_minmax(180px,1fr)_auto] sm:items-center"><div className="min-w-0"><Link to={`/admin/users/${item.userId}`} className="font-medium text-sm hover:text-azure dark:hover:text-yellow truncate block">{item.userDisplayName}</Link><p className="text-xs text-gray-500 mt-1">{formatDate(item.occurredAt)}</p></div><div className="min-w-0 flex items-center gap-2"><StatusPill label={item.method} tone="info" /><code className="text-xs truncate">{item.endpoint}</code></div><code className="text-xs text-gray-500 truncate">{item.policy}</code><span className="text-[10px] font-mono text-gray-400 truncate" title={item.correlationId ?? undefined}>{item.correlationId ?? "No correlation ID"}</span></article>)}</div>;
}
