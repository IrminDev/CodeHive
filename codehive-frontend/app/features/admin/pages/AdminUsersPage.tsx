import { useEffect, useState } from "react";
import { ChevronRight, Plus, Search, Upload } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "~/core/providers/AuthProvider";
import { Dropdown } from "~/shared/components/ui/Dropdown";
import { Role, Scope } from "~/shared/types/model/User";
import { listAdminUsers, type ListUsersParams } from "../api/admin.api";
import { AdminShell } from "../components/AdminShell";
import { AdminEmpty, AdminError, AdminLoading, AdminPageHeader, Pagination, StatusPill, compactButtonClass, inputClass, panelClass, primaryCompactClass } from "../components/AdminUI";
import type { AdminUserSummary, PageResponse } from "../types/admin.types";
import { errorMessage, formatDate } from "../utils/format";
import { hasAnyEffectiveScope, hasEffectiveScope } from "../utils/permissions";

type UserSort = NonNullable<ListUsersParams["sort"]>;

export function AdminUsersPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const canView = hasEffectiveScope(user, Scope.VIEW_USERS);
  const canCreate = hasAnyEffectiveScope(user, [Scope.CREATE_USERS, Scope.CREATE_ADMINS]);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [result, setResult] = useState<PageResponse<AdminUserSummary> | null>(null);
  const [loading, setLoading] = useState(canView);
  const [error, setError] = useState<string>();
  const refresh = params.get("refresh") ?? "";

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const current = params.get("search") ?? "";
      if (search.trim() === current) return;
      const next = new URLSearchParams(params);
      search.trim() ? next.set("search", search.trim()) : next.delete("search");
      next.set("page", "0");
      setParams(next, { replace: true });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [params, search, setParams]);

  useEffect(() => {
    if (!canView) return;
    const controller = new AbortController();
    setLoading(true); setError(undefined);
    const role = params.get("role") as Role | null;
    const status = params.get("status") as "ACTIVE" | "BLOCKED" | null;
    void listAdminUsers({
      search: params.get("search") || undefined,
      role: role && Object.values(Role).includes(role) ? role : undefined,
      status: status === "ACTIVE" || status === "BLOCKED" ? status : undefined,
      page: Number(params.get("page") ?? 0),
      size: Number(params.get("size") ?? 20),
      sort: (params.get("sort") as UserSort) || "createdAt",
      direction: params.get("direction") === "ASC" ? "ASC" : "DESC",
    }, controller.signal).then(setResult).catch((cause) => {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(errorMessage(cause, "Could not load users."));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [canView, params, refresh]);

  function update(key: string, value?: string) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    if (key !== "page") next.set("page", "0");
    setParams(next);
  }
  const actions = <>{canCreate && <Link to="/admin/create-user" className={primaryCompactClass}><Plus size={14} /> New user</Link>}{hasEffectiveScope(user, Scope.CREATE_USERS) && <Link to="/admin/csv-upload" className={compactButtonClass}><Upload size={14} /> CSV upload</Link>}</>;

  return <AdminShell active="users" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Users" }]}>
    <AdminPageHeader eyebrow="Accounts" title="Users" description="Search visible accounts, inspect associated resources, and apply scoped administrative actions." actions={actions} />
    {!canView ? <RegistrationOnly canCsv={hasEffectiveScope(user, Scope.CREATE_USERS)} /> : <div className="space-y-4">
      <div className={`${panelClass} p-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_140px_140px_170px_100px_100px]`}>
        <label className="relative"><span className="sr-only">Search users</span><Search size={16} className="absolute left-3.5 top-3.5 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, enrollment…" className={`${inputClass} pl-10 py-2.5`} /></label>
        <FilterSelect label="Role" value={params.get("role") ?? ""} onChange={(value) => update("role", value)} options={[["", "All roles"], ...Object.values(Role).map((role) => [role, role[0] + role.slice(1).toLowerCase()])]} />
        <FilterSelect label="Status" value={params.get("status") ?? ""} onChange={(value) => update("status", value)} options={[["", "All statuses"], ["ACTIVE", "Active"], ["BLOCKED", "Blocked"]]} />
        <FilterSelect label="Sort" value={params.get("sort") ?? "createdAt"} onChange={(value) => update("sort", value)} options={[["createdAt", "Created"], ["name", "Name"], ["lastName", "Last name"], ["email", "Email"], ["enrollmentNumber", "Enrollment"], ["role", "Role"], ["blocked", "Status"]]} />
        <button onClick={() => update("direction", params.get("direction") === "ASC" ? "DESC" : "ASC")} className={compactButtonClass}>{params.get("direction") === "ASC" ? "Ascending" : "Descending"}</button>
        <FilterSelect label="Page size" value={params.get("size") ?? "20"} onChange={(value) => update("size", value)} options={[["20", "20 rows"], ["50", "50 rows"], ["100", "100 rows"]]} />
      </div>
      {loading ? <AdminLoading rows={6} /> : error ? <AdminError message={error} onRetry={() => update("refresh", String(Date.now()))} /> : !result || result.content.length === 0 ? <AdminEmpty title="No users found" description="Adjust filters or register a new account." action={canCreate ? <Link to="/admin/create-user" className={primaryCompactClass}>Create user</Link> : undefined} /> : <>
        <UserResults users={result.content} />
        <Pagination page={result.page} totalPages={result.totalPages} totalElements={result.totalElements} onPage={(page) => update("page", String(page))} />
      </>}
    </div>}
  </AdminShell>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return <label><span className="sr-only">{label}</span><Dropdown value={value} onChange={onChange} ariaLabel={label} options={options.map(([option, text]) => ({ value: option, label: text }))} /></label>;
}

function UserResults({ users }: { users: AdminUserSummary[] }) {
  return <div className={panelClass}>
    <div className="hidden md:block overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-[10px] uppercase tracking-wide text-gray-400 border-b border-gray-200 dark:border-gray-800/60"><th className="px-5 py-3">User</th><th className="px-5 py-3">Enrollment</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Created</th><th className="w-10" /></tr></thead><tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">{users.map((user) => <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-dark-card transition-colors"><td className="px-5 py-4"><Link to={`/admin/users/${user.id}`} className="font-medium text-sm hover:text-azure dark:hover:text-yellow">{user.name} {user.lastName}</Link><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p></td><td className="px-5 py-4 text-xs font-mono">{user.enrollmentNumber}</td><td className="px-5 py-4"><StatusPill label={user.role} tone="info" /></td><td className="px-5 py-4"><StatusPill label={user.status} tone={user.status === "ACTIVE" ? "success" : "error"} /></td><td className="px-5 py-4 text-xs text-gray-500">{formatDate(user.createdAt, false)}</td><td><Link to={`/admin/users/${user.id}`} aria-label={`View ${user.name}`}><ChevronRight size={16} /></Link></td></tr>)}</tbody></table></div>
    <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800/60">{users.map((user) => <Link key={user.id} to={`/admin/users/${user.id}`} className="block p-4 hover:bg-gray-50 dark:hover:bg-dark-card"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-medium truncate">{user.name} {user.lastName}</p><p className="text-xs text-gray-500 truncate">{user.email}</p></div><StatusPill label={user.status} tone={user.status === "ACTIVE" ? "success" : "error"} /></div><div className="mt-3 flex items-center gap-2 text-xs text-gray-500"><span className="font-mono">{user.enrollmentNumber}</span><span>·</span><span>{user.role}</span></div></Link>)}</div>
  </div>;
}

function RegistrationOnly({ canCsv }: { canCsv: boolean }) {
  return <div className="grid gap-4 md:grid-cols-2"><Link to="/admin/create-user" className={`${panelClass} p-6 hover:border-azure/30 dark:hover:border-yellow/30`}><Plus size={20} className="text-azure dark:text-yellow" /><h2 className="mt-4 font-semibold">Register one user</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create permitted account roles and send temporary credentials.</p></Link>{canCsv && <Link to="/admin/csv-upload" className={`${panelClass} p-6 hover:border-azure/30 dark:hover:border-yellow/30`}><Upload size={20} className="text-azure dark:text-yellow" /><h2 className="mt-4 font-semibold">Bulk registration</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Upload student and teacher accounts from CSV.</p></Link>}</div>;
}
