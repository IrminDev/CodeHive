import { useCallback, useEffect, useState } from "react";
import { Activity, Ban, KeyRound, Pencil, Shield, Trash2, UserRoundCog } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useAuth } from "~/core/providers/AuthProvider";
import { getAdminUser } from "../api/admin.api";
import { AdminShell } from "../components/AdminShell";
import { AdminUserDialogs, type UserAction } from "../components/AdminUserDialogs";
import { AdminUserResources, type UserResourceTab } from "../components/AdminUserResources";
import { AdminError, AdminLoading, AdminPageHeader, StatusPill, compactButtonClass, panelClass } from "../components/AdminUI";
import type { AdminUserDetail } from "../types/admin.types";
import { errorMessage, formatDate } from "../utils/format";
import { availableRoleChanges, canChangeScopes, canChangeStatus, canEditProfile } from "../utils/permissions";

const TABS: { key: UserResourceTab; label: string }[] = [{ key: "overview", label: "Overview" }, { key: "groups", label: "Groups" }, { key: "assignments", label: "Assignments" }, { key: "submissions", label: "Submissions" }, { key: "executions", label: "Executions" }];

export function AdminUserDetailPage() {
  const { userId = "" } = useParams(); const { user: actor } = useAuth(); const navigate = useNavigate(); const [params, setParams] = useSearchParams();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState<string>(); const [action, setAction] = useState<UserAction>(null); const [refresh, setRefresh] = useState(0);
  const tabParam = params.get("tab"); const tab: UserResourceTab = TABS.some((item) => item.key === tabParam) ? tabParam as UserResourceTab : "overview";
  const load = useCallback(() => { const controller = new AbortController(); setLoading(true); setError(undefined); void getAdminUser(userId, controller.signal).then(setDetail).catch((cause) => { if (cause instanceof DOMException && cause.name === "AbortError") return; setError(errorMessage(cause, "Could not load user.")); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort(); }, [refresh, userId]);
  useEffect(load, [load]);
  function selectTab(nextTab: UserResourceTab) { const next = new URLSearchParams(); next.set("tab", nextTab); setParams(next); }

  if (loading) return <AdminShell active="users" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Users", to: "/admin/users" }, { label: "Loading" }]}><AdminLoading rows={7} /></AdminShell>;
  if (error || !detail) return <AdminShell active="users" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Users", to: "/admin/users" }, { label: "Unavailable" }]}><AdminError message={error ?? "User unavailable."} onRetry={() => setRefresh((value) => value + 1)} /></AdminShell>;
  const target = detail.user;
  const profile = canEditProfile(actor, target); const status = canChangeStatus(actor, target); const scopes = canChangeScopes(actor, target); const roles = availableRoleChanges(actor, target);
  const actions = <>{profile && <button className={compactButtonClass} onClick={() => setAction("profile")}><Pencil size={14} /> Edit profile</button>}{roles.length > 0 && <button className={compactButtonClass} onClick={() => setAction("role")}><UserRoundCog size={14} /> Change role</button>}{scopes && <button className={compactButtonClass} onClick={() => setAction("scopes")}><KeyRound size={14} /> Scopes</button>}{status && <>{target.status === "BLOCKED" ? <button className={compactButtonClass} onClick={() => setAction("unblock")}><Shield size={14} /> Unblock</button> : <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-orange-500/30 text-orange-600 dark:text-orange-400" onClick={() => setAction("block")}><Ban size={14} /> Block</button>}<button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-red-500/30 text-red-500" onClick={() => setAction("delete")}><Trash2 size={14} /> Delete</button></>}</>;

  return <AdminShell active="users" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Users", to: "/admin/users" }, { label: `${target.name} ${target.lastName}` }]}>
    <AdminPageHeader eyebrow="User record" title={`${target.name} ${target.lastName}`} description={`${target.email} · ${target.enrollmentNumber}`} actions={actions} />
    <div className={`${panelClass} p-5 sm:p-6 mb-5`}><div className="flex flex-col lg:flex-row gap-5 lg:items-start justify-between"><div><div className="flex flex-wrap gap-2"><StatusPill label={target.role} tone="info" /><StatusPill label={target.status} tone={target.status === "ACTIVE" ? "success" : "error"} />{target.scopes.map((scope) => <StatusPill key={scope} label={scope.replaceAll("_", " ")} />)}</div><div className="mt-4 grid gap-1 text-xs text-gray-500 dark:text-gray-400"><span>Created {formatDate(target.createdAt)}</span>{target.blockedAt && <span>Blocked {formatDate(target.blockedAt)}</span>}<span className="font-mono">{target.id}</span></div></div><Link to={`/admin/incidents?userId=${target.id}`} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 min-w-52 hover:border-azure/30 dark:hover:border-yellow/30"><div className="flex items-center gap-2 text-xs font-semibold"><Activity size={15} className="text-azure dark:text-yellow" /> Rate-limit history</div><p className="mt-2 text-2xl font-bold font-mono">{detail.lifetimeRateLimitViolations}</p><p className="text-[10px] text-gray-500">Last: {formatDate(detail.lastRateLimitViolationAt)}</p></Link></div></div>
    <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-800 mb-5" aria-label="User detail sections">{TABS.map((item) => <button key={item.key} onClick={() => selectTab(item.key)} className={`px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 ${tab === item.key ? "border-azure text-azure dark:border-yellow dark:text-yellow" : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"}`} aria-current={tab === item.key ? "page" : undefined}>{item.label}</button>)}</nav>
    {tab === "overview" ? <ResourceSummary detail={detail} /> : <AdminUserResources userId={target.id} tab={tab} />}
    <AdminUserDialogs action={action} detail={detail} actor={actor} onClose={() => setAction(null)} onUpdated={setDetail} onDeleted={() => navigate("/admin/users", { replace: true })} />
  </AdminShell>;
}

function ResourceSummary({ detail }: { detail: AdminUserDetail }) {
  const values = [
    ["Owned groups", detail.resources.ownedGroups, `${detail.resources.activeOwnedGroups} active · ${detail.resources.archivedOwnedGroups} archived`],
    ["Enrollments", detail.resources.enrollments, `${detail.resources.activeEnrollments} active`],
    ["Authored assignments", detail.resources.authoredAssignments, `${detail.resources.activeAuthoredAssignments} active`],
    ["Participated assignments", detail.resources.participatedAssignments, "Student work records"],
    ["Submissions", detail.resources.submissions, "Metadata only"],
    ["Executions", detail.resources.executions, "Metadata only"],
  ] as const;
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{values.map(([label, count, note]) => <div key={label} className={`${panelClass} p-5`}><p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p><p className="mt-3 text-3xl font-bold font-mono">{count}</p><p className="mt-1 text-xs text-gray-400">{note}</p></div>)}</div>;
}
