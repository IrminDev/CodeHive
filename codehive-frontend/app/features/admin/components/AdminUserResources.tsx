import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { listAdminUserAssignments, listAdminUserExecutions, listAdminUserGroups, listAdminUserSubmissions } from "../api/admin.api";
import type { AdminAssignmentResource, AdminExecutionResource, AdminGroupResource, AdminSubmissionResource, PageResponse } from "../types/admin.types";
import { errorMessage, formatDate, humanize } from "../utils/format";
import { AdminEmpty, AdminError, AdminLoading, Pagination, StatusPill, compactButtonClass, panelClass } from "./AdminUI";

export type UserResourceTab = "overview" | "groups" | "assignments" | "submissions" | "executions";

export function AdminUserResources({ userId, tab }: { userId: string; tab: Exclude<UserResourceTab, "overview"> }) {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("resourcePage") ?? 0);
  const groupRelationship = params.get("relationship") === "ENROLLED" ? "ENROLLED" : "OWNED";
  const assignmentRelationship = params.get("relationship") === "PARTICIPATED" ? "PARTICIPATED" : "AUTHORED";
  const [result, setResult] = useState<PageResponse<AdminGroupResource | AdminAssignmentResource | AdminSubmissionResource | AdminExecutionResource> | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState<string>();
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(undefined); setResult(null);
    const request = tab === "groups" ? listAdminUserGroups(userId, groupRelationship, page, 20, controller.signal)
      : tab === "assignments" ? listAdminUserAssignments(userId, assignmentRelationship, page, 20, controller.signal)
      : tab === "submissions" ? listAdminUserSubmissions(userId, page, 20, controller.signal)
      : listAdminUserExecutions(userId, page, 20, controller.signal);
    void request.then((data) => setResult(data as typeof result)).catch((cause) => { if (cause instanceof DOMException && cause.name === "AbortError") return; setError(errorMessage(cause, `Could not load ${tab}.`)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [assignmentRelationship, groupRelationship, page, tab, userId]);
  function update(key: string, value: string) { const next = new URLSearchParams(params); next.set(key, value); if (key !== "resourcePage") next.set("resourcePage", "0"); setParams(next); }
  return <div className="space-y-4">
    {tab === "groups" && <Relationship value={groupRelationship} options={[["OWNED", "Owned"], ["ENROLLED", "Enrolled"]]} onChange={(value) => update("relationship", value)} />}
    {tab === "assignments" && <Relationship value={assignmentRelationship} options={[["AUTHORED", "Authored"], ["PARTICIPATED", "Participated"]]} onChange={(value) => update("relationship", value)} />}
    {loading ? <AdminLoading rows={5} /> : error ? <AdminError message={error} /> : !result || result.content.length === 0 ? <AdminEmpty title={`No ${tab}`} description={`No ${tab} match this relationship and page.`} /> : <><ResourceRows tab={tab} rows={result.content} /><Pagination page={result.page} totalPages={result.totalPages} totalElements={result.totalElements} onPage={(nextPage) => update("resourcePage", String(nextPage))} /></>}
  </div>;
}

function Relationship({ value, options, onChange }: { value: string; options: string[][]; onChange: (value: string) => void }) { return <div className="flex gap-2">{options.map(([key, label]) => <button key={key} className={`${compactButtonClass} ${value === key ? "border-azure/30 text-azure dark:border-yellow/30 dark:text-yellow bg-azure/5 dark:bg-yellow/5" : ""}`} onClick={() => onChange(key)}>{label}</button>)}</div>; }

function ResourceRows({ tab, rows }: { tab: string; rows: (AdminGroupResource | AdminAssignmentResource | AdminSubmissionResource | AdminExecutionResource)[] }) {
  return <div className={`${panelClass} divide-y divide-gray-100 dark:divide-gray-800/60`}>{rows.map((row) => {
    if (tab === "groups") { const item = row as AdminGroupResource; return <article key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p className="font-medium">{item.name}</p><p className="text-xs text-gray-500 mt-1">Created {formatDate(item.createdAt)} · <span className="font-mono">{item.id}</span></p></div><div className="flex gap-2"><StatusPill label={item.relationship} tone="info" /><StatusPill label={item.archived ? "Archived" : item.active ? "Active" : "Inactive"} tone={item.archived ? "warning" : item.active ? "success" : "neutral"} />{item.deletionReason && <StatusPill label={item.deletionReason} tone="warning" />}{item.enrollmentStatus && <StatusPill label={item.enrollmentStatus} />}</div></article>; }
    if (tab === "assignments") { const item = row as AdminAssignmentResource; return <article key={item.id} className="p-4 sm:p-5"><div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3"><div><p className="font-medium">{item.title}</p><p className="text-xs text-gray-500 mt-1">{item.groupName} · Created {formatDate(item.createdAt)}</p></div><div className="flex flex-wrap gap-2"><StatusPill label={item.relationship} tone="info" /><StatusPill label={item.validationStatus} tone={item.validationStatus === "READY" ? "success" : item.validationStatus === "FAILED" ? "error" : "warning"} />{item.studentWorkStatus && <StatusPill label={humanize(item.studentWorkStatus)} />}</div></div><p className="mt-3 text-xs text-gray-500">Launch {formatDate(item.launchDate)} · Due {formatDate(item.dueDate)} · Close {formatDate(item.closeDate)}</p></article>; }
    if (tab === "submissions") { const item = row as AdminSubmissionResource; return <article key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p className="font-medium">{item.assignmentTitle}</p><p className="text-xs text-gray-500 mt-1">{item.groupName} · {item.language} · {formatDate(item.createdAt)}</p></div><div className="flex flex-wrap gap-2"><StatusPill label={item.status} tone={item.status === "SUBMITTED" ? "success" : "neutral"} />{item.deliveredLate && <StatusPill label="Late" tone="warning" />}{item.latestVerdict && <StatusPill label={item.latestVerdict} tone={item.latestVerdict === "AC" ? "success" : item.latestVerdict === "PENDING" ? "warning" : "error"} />}</div></article>; }
    const item = row as AdminExecutionResource; return <article key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p className="font-medium">{humanize(item.type)} execution</p><p className="text-xs text-gray-500 mt-1">{humanize(item.trigger)} · {formatDate(item.createdAt)}</p><p className="text-[10px] font-mono text-gray-400 mt-1">{item.id}</p></div><div className="flex flex-wrap gap-2"><StatusPill label={item.status} tone={item.status === "AC" ? "success" : item.status === "PENDING" ? "warning" : "error"} /><StatusPill label={item.timeMs === null ? "No time" : `${item.timeMs} ms`} /><StatusPill label={item.memoryMb === null ? "No memory" : `${item.memoryMb} MB`} /><StatusPill label={item.reportAvailable ? "Report retained" : "No report"} tone={item.reportAvailable ? "info" : "neutral"} /></div></article>;
  })}</div>;
}
