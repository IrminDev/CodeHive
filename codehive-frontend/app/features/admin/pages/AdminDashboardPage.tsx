import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, CalendarDays, FileCheck2, Plus, Upload, Users } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "~/core/providers/AuthProvider";
import { Scope } from "~/shared/types/model/User";
import { getAdminStatistics } from "../api/admin.api";
import { AdminShell } from "../components/AdminShell";
import { AdminError, AdminLoading, AdminPageHeader, panelClass, primaryCompactClass } from "../components/AdminUI";
import type { AdminStatistics } from "../types/admin.types";
import { endExclusiveLocalDay, errorMessage, formatDate, humanize, startOfLocalDay } from "../utils/format";
import { hasAnyEffectiveScope, hasEffectiveScope } from "../utils/permissions";

const CHART_COLORS = ["#00509D", "#FDC500", "#16a34a", "#dc2626", "#9333ea", "#ea580c", "#64748b", "#db2777"];

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<AdminStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [mounted, setMounted] = useState(false);
  const canAnalytics = hasEffectiveScope(user, Scope.CHECK_ANALYTICS);
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;

  useEffect(() => setMounted(true), []);
  const load = useCallback(() => {
    if (!canAnalytics) return () => undefined;
    const controller = new AbortController();
    setLoading(true);
    setError(undefined);
    void getAdminStatistics(from, to, controller.signal)
      .then(setData)
      .catch((cause) => { if (cause instanceof DOMException && cause.name === "AbortError") return; setError(errorMessage(cause, "Could not load platform statistics.")); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [canAnalytics, from, to]);
  useEffect(load, [load]);

  function selectRange(days: number) {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    setParams({ from: start.toISOString(), to: end.toISOString() });
  }

  const roleData = data ? [
    { name: "Students", value: data.users.students },
    { name: "Teachers", value: data.users.teachers },
    { name: "Admins", value: data.users.admins },
  ] : [];
  const validationData = useMemo(() => Object.entries(data?.assignmentValidation ?? {}).map(([name, value]) => ({ name: humanize(name), value })), [data]);
  const verdictData = useMemo(() => Object.entries(data?.executionVerdicts ?? {}).map(([name, value]) => ({ name, value })), [data]);

  const registrationActions = hasAnyEffectiveScope(user, [Scope.CREATE_USERS, Scope.CREATE_ADMINS]);
  return <AdminShell active="overview" breadcrumbs={[{ label: "Admin" }, { label: "Overview" }]}>
    <AdminPageHeader eyebrow="Operations" title="Admin overview" description="Monitor account health, platform activity, and moderation signals."
      actions={registrationActions ? <><Link to="/admin/create-user" className={primaryCompactClass}><Plus size={14} /> New user</Link>{hasEffectiveScope(user, Scope.CREATE_USERS) && <Link to="/admin/csv-upload" className="btn-outline inline-flex items-center gap-1.5 px-3 py-2 text-xs"><Upload size={14} /> CSV upload</Link>}</> : undefined} />

    {!canAnalytics ? <PermissionDashboard /> : loading ? <AdminLoading rows={5} /> : error || !data ? <AdminError message={error ?? "Statistics unavailable."} onRetry={() => load()} /> : <div className="space-y-6">
      <div className={`${panelClass} p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between`}>
        <div><p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Reporting window</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(data.from)} – {formatDate(data.to)}</p></div>
        <div className="flex flex-wrap items-end gap-2">{[7, 30, 90].map((days) => <button key={days} onClick={() => selectRange(days)} className="px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 hover:text-azure dark:hover:text-yellow">{days} days</button>)}<label className="text-[10px] text-gray-500">From<input type="date" value={from?.slice(0, 10) ?? ""} onChange={(event) => { const next = new URLSearchParams(params); const value = startOfLocalDay(event.target.value); value ? next.set("from", value) : next.delete("from"); setParams(next); }} className="block mt-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-xs" /></label><label className="text-[10px] text-gray-500">Through<input type="date" value={to ? new Date(new Date(to).getTime() - 1).toISOString().slice(0, 10) : ""} onChange={(event) => { const next = new URLSearchParams(params); const value = endExclusiveLocalDay(event.target.value); value ? next.set("to", value) : next.delete("to"); setParams(next); }} className="block mt-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-xs" /></label><button onClick={() => setParams({})} className="px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 hover:text-azure dark:hover:text-yellow">Default</button></div>
      </div>

      <MetricGrid data={data} />
      <div className="grid gap-6 xl:grid-cols-3">
        <ChartPanel title="Users by role" description="Visible accounts">
          {mounted && <ResponsiveContainer width="100%" height={230}><PieChart><Pie data={roleData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>{roleData.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>}
          <ChartLegend data={roleData} />
        </ChartPanel>
        <ChartPanel title="Assignment validation" description="Current visible assignments">
          {mounted && <ResponsiveContainer width="100%" height={230}><BarChart data={validationData} layout="vertical" margin={{ left: 12 }}><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="#00509D" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer>}
          <ChartLegend data={validationData} />
        </ChartPanel>
        <ChartPanel title="Execution verdicts" description="Current visible executions">
          {mounted && <ResponsiveContainer width="100%" height={230}><BarChart data={verdictData} layout="vertical" margin={{ left: 4 }}><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={38} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="#FDC500" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer>}
          <ChartLegend data={verdictData} />
        </ChartPanel>
      </div>
      <p className="text-xs text-gray-400 text-right">Generated {formatDate(data.generatedAt)}</p>
    </div>}
  </AdminShell>;
}

function MetricGrid({ data }: { data: AdminStatistics }) {
  const items = [
    ["Total users", data.users.total, Users], ["Active users", data.users.active, Users], ["Blocked users", data.users.blocked, Users],
    ["Registered", data.users.registeredInPeriod, CalendarDays], ["Active groups", data.resources.activeGroups, Users], ["Archived groups", data.resources.archivedGroups, Users],
    ["Active assignments", data.resources.activeAssignments, FileCheck2], ["Submissions", data.resources.submissionsInPeriod, FileCheck2], ["Executions", data.resources.executionsInPeriod, BarChart3], ["Rate-limit incidents", data.incidents, Activity],
  ] as const;
  return <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">{items.map(([label, value, Icon]) => <div key={label} className={`${panelClass} p-4`}><Icon size={16} className="text-azure dark:text-yellow" /><p className="mt-3 text-2xl font-bold font-mono">{value.toLocaleString()}</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p></div>)}</div>;
}

function ChartPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className={`${panelClass} p-5 min-w-0`}><h2 className="text-sm font-semibold">{title}</h2><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p><div className="mt-3">{children}</div></section>;
}

function ChartLegend({ data }: { data: { name: string; value: number }[] }) {
  return <ul className="flex flex-wrap gap-x-3 gap-y-1 mt-2" aria-label="Chart values">{data.map((item) => <li key={item.name} className="text-[10px] text-gray-500 dark:text-gray-400"><span className="font-medium text-gray-800 dark:text-gray-200">{item.name}</span> {item.value.toLocaleString()}</li>)}</ul>;
}

function PermissionDashboard() {
  const { user } = useAuth();
  const links = [
    hasAnyEffectiveScope(user, [Scope.VIEW_USERS, Scope.CREATE_USERS, Scope.CREATE_ADMINS]) && { to: "/admin/users", label: "Users", description: "View or register accounts." },
    hasEffectiveScope(user, Scope.VIEW_USERS) && { to: "/admin/incidents", label: "Incidents", description: "Review rate-limit violations." },
    hasEffectiveScope(user, Scope.VIEW_AUDIT_LOG) && { to: "/admin/audit", label: "Audit history", description: "Review administrative operations." },
  ].filter(Boolean) as { to: string; label: string; description: string }[];
  return <div className="space-y-5"><div className="rounded-2xl border border-azure/20 dark:border-yellow/20 bg-azure/5 dark:bg-yellow/5 p-5"><h2 className="font-semibold">Analytics access unavailable</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">CHECK_ANALYTICS scope is required for platform statistics.</p></div><div className="grid gap-4 md:grid-cols-3">{links.map((link) => <Link key={link.to} to={link.to} className={`${panelClass} p-5 hover:border-azure/30 dark:hover:border-yellow/30 transition-colors`}><h2 className="font-semibold">{link.label}</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{link.description}</p></Link>)}</div></div>;
}
