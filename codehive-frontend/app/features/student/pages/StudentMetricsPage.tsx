import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, BarChart3, CheckCircle2, ChevronRight, CircleAlert, Clock3, Gauge, HardDrive, RefreshCw, Target } from "lucide-react";

import { getGroup } from "../api/group.api";
import { getMyGroupMetrics, listMyAssignmentMetrics } from "../api/metrics.api";
import { StudentHeader } from "../components/StudentHeader";
import { StudentSidebar } from "../components/StudentSidebar";
import type { ClassGroup } from "../types/group.types";
import type { StudentAssignmentMetric, StudentGroupMetrics, StudentMetricVerdict } from "../types/metrics.types";

type MetricState = { label: string; className: string; accepted?: boolean };

function formatPercent(value: number | null): string {
  if (value == null) return "—";
  return `${value % 1 === 0 ? value : value.toFixed(2)}%`;
}

function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No deadline";
}

function workState(item: StudentAssignmentMetric): MetricState {
  if (item.workStatus === "NOT_SUBMITTED") return { label: "Not submitted", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" };
  if (item.workStatus === "RETURNED") return { label: "Returned", className: "bg-green-500/10 text-green-500 border-green-500/20", accepted: true };
  if (item.workStatus === "WITHDRAWN") return { label: "Withdrawn", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" };
  if (item.deliveredLate) return { label: "Submitted late", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" };
  return { label: "Submitted", className: "bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow border-azure/20 dark:border-yellow/20" };
}

function verdictClass(verdict: StudentMetricVerdict): string {
  if (verdict === "AC") return "bg-green-500/10 text-green-500 border-green-500/20";
  if (verdict === "PENDING") return "bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow border-azure/20 dark:border-yellow/20";
  if (verdict === "TLE") return "bg-orange-500/10 text-orange-500 border-orange-500/20";
  return "bg-red-500/10 text-red-500 border-red-500/20";
}

export function StudentMetricsPage() {
  const { groupId = "" } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<ClassGroup | null>(null);
  const [summary, setSummary] = useState<StudentGroupMetrics | null>(null);
  const [assignments, setAssignments] = useState<StudentAssignmentMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!groupId) {
      setError("Group not found.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [groupResult, summaryResult, assignmentResult] = await Promise.all([
        getGroup(groupId),
        getMyGroupMetrics(groupId),
        listMyAssignmentMetrics(groupId),
      ]);
      setGroup(groupResult);
      setSummary(summaryResult);
      setAssignments(assignmentResult);
    } catch (cause) {
      setGroup(null);
      setSummary(null);
      setAssignments([]);
      setError(cause instanceof Error ? cause.message : "Could not load your class metrics.");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { void load(); }, [load]);

  const onTimeRate = useMemo(() => {
    if (!summary?.submittedCount) return null;
    return ((summary.submittedCount - summary.lateCount) / summary.submittedCount) * 100;
  }, [summary]);
  const completion = Math.min(Math.max(summary?.completionRate ?? 0, 0), 100);

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 font-sans">
      <StudentSidebar active="groups" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <StudentHeader breadcrumbs={[{ label: "Student" }, { label: "Groups", to: "/groups" }, { label: group?.name ?? "Group", to: groupId ? `/groups/${groupId}` : undefined }, { label: "Progress" }]} />
        <main className="flex-1 overflow-y-auto scrollbar-hide p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6 pb-8">
            {loading ? <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse"><div className="md:col-span-4 h-32 rounded-2xl bg-gray-100 dark:bg-dark-surface" />{[0, 1, 2, 3].map((item) => <div key={item} className="h-28 rounded-2xl bg-gray-100 dark:bg-dark-surface" />)}<div className="md:col-span-4 h-80 rounded-2xl bg-gray-100 dark:bg-dark-surface" /></div> : error || !group || !summary ? <div className="max-w-xl mx-auto mt-20 text-center rounded-2xl border border-red-500/20 bg-red-500/5 p-8"><CircleAlert className="mx-auto text-red-500 mb-3" size={28} /><h1 className="font-semibold text-lg">Metrics unavailable</h1><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error ?? "This group is no longer available."}</p><Link to="/groups" className="inline-flex mt-5 btn-primary">Back to groups</Link></div> : <>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div><Link to={`/groups/${group.id}`} className="inline-flex items-center gap-1.5 text-xs font-medium mr-2.5 text-gray-500 dark:text-gray-400 hover:text-azure dark:hover:text-yellow transition-colors"><ArrowLeft size={14} /> {group.name}</Link><div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 text-xs font-medium text-gray-500 dark:text-gray-400"><BarChart3 size={13} className="text-yellow" /> YOUR PROGRESS</div><h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">Class progress</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your delivery, grading, and execution results for {group.name}.</p></div>
                <button onClick={() => void load()} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"><RefreshCw size={13} /> Refresh</button>
              </div>

              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard label="Completion" value={formatPercent(summary.completionRate)} detail={`${summary.submittedCount} of ${summary.publishedAssignments} submitted`} className="text-azure dark:text-yellow" />
                <MetricCard label="Average score" value={formatPercent(summary.averageScore)} detail={`${summary.gradedAssignments} returned grade${summary.gradedAssignments === 1 ? "" : "s"}`} className="text-green-500" />
                <MetricCard label="On-time work" value={formatPercent(onTimeRate)} detail={`${summary.lateCount} late ${summary.lateCount === 1 ? "delivery" : "deliveries"}`} className="text-azure dark:text-yellow" />
                <MetricCard label="Total attempts" value={String(summary.totalAttempts)} detail="Across all assignments" className="text-gray-900 dark:text-white" />
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-gray-900 dark:text-white">Submission progress</h2><p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Published work completed in this class.</p></div><span className="font-mono text-sm font-semibold text-azure dark:text-yellow">{formatPercent(summary.completionRate)}</span></div><div className="mt-5 h-2 rounded-full bg-gray-100 dark:bg-dark-card overflow-hidden"><div className="h-full rounded-full bg-azure dark:bg-yellow transition-all" style={{ width: `${completion}%` }} /></div><div className="mt-4 grid grid-cols-3 gap-3 text-center"><ProgressValue label="Submitted" value={summary.submittedCount} /><ProgressValue label="Missing" value={summary.missingAssignmentIds.length} /><ProgressValue label="Returned" value={summary.gradedAssignments} /></div></div>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-dark-surface p-5"><div className="w-10 h-10 rounded-xl bg-azure/10 dark:bg-yellow/10 text-azure dark:text-yellow grid place-items-center"><Target size={18} /></div><h2 className="mt-4 font-semibold text-gray-900 dark:text-white">Keep moving</h2><p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{summary.missingAssignmentIds.length ? `${summary.missingAssignmentIds.length} assignment${summary.missingAssignmentIds.length === 1 ? " remains" : "s remain"} without a current submission.` : "Every published assignment has a current submission."}</p></div>
              </section>

              <section className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface overflow-hidden"><div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800/60"><div><h2 className="font-semibold text-gray-900 dark:text-white">Assignment performance</h2><p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Current submission, latest verdict, attempts, and returned grade.</p></div><span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-dark-card text-xs font-mono text-gray-500 dark:text-gray-400">{assignments.length}</span></div>{assignments.length === 0 ? <div className="py-16 text-center"><Gauge className="mx-auto text-gray-400 dark:text-gray-600 mb-3" size={30} /><h3 className="font-semibold text-gray-800 dark:text-gray-100">No published assignments</h3><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Metrics appear after your teacher publishes work for this class.</p></div> : <div className="divide-y divide-gray-100 dark:divide-gray-800/60">{assignments.map((item) => <AssignmentMetricCard key={item.assignmentId} item={item} />)}</div>}</section>
            </>}
          </div>
        </main>
      </div>
    </div>
  );
}

function MetricCard({ label, value, detail, className }: { label: string; value: string; detail: string; className: string }) {
  return <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-dark-surface p-4"><p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 dark:text-gray-500">{label}</p><p className={`mt-1 text-2xl font-bold ${className}`}>{value}</p><p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">{detail}</p></div>;
}

function ProgressValue({ label, value }: { label: string; value: number }) {
  return <div><p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p><p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p></div>;
}

function AssignmentMetricCard({ item }: { item: StudentAssignmentMetric }) {
  const state = workState(item);
  return <Link to={`/assignment/${item.assignmentId}`} className="group block px-5 py-5 hover:bg-gray-50 dark:hover:bg-dark-card/50 transition-colors"><div className="flex items-start gap-4"><div className="relative w-10 h-10 flex-shrink-0 grid place-items-center"><svg className="absolute inset-0 w-full h-full text-gray-300 dark:text-gray-700" viewBox="0 0 36 36" fill="none"><polygon points="18,2 34,10 34,26 18,34 2,26 2,10" stroke="currentColor" strokeWidth="1.5" /></svg><Gauge size={15} className="text-gray-500 dark:text-gray-400" /></div><div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${state.className}`}>{state.accepted && <CheckCircle2 size={11} />}{state.label}</span>{item.verdict && <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-mono ${verdictClass(item.verdict)}`}>{item.verdict}</span>}</div><div className="mt-2 flex items-start gap-3"><div className="min-w-0 flex-1"><h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 group-hover:text-azure dark:group-hover:text-yellow transition-colors truncate">{item.title}</h3><div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-mono text-gray-400 dark:text-gray-500"><span>Due {formatDate(item.dueDate)}</span><span>{item.attempts} attempt{item.attempts === 1 ? "" : "s"}</span>{item.timeMs != null && <span className="inline-flex items-center gap-1"><Clock3 size={11} /> {item.timeMs}ms</span>}{item.memoryMb != null && <span className="inline-flex items-center gap-1"><HardDrive size={11} /> {item.memoryMb}MB</span>}</div></div></div></div><div className="flex items-center gap-3 flex-shrink-0"><div className="min-w-20 text-right">{item.grade ? <><p className="font-mono text-lg font-bold text-green-500">{item.grade.value} / {item.grade.maxPoints}</p><p className="text-[10px] text-gray-500 dark:text-gray-400">Returned grade</p></> : <p className="text-xs text-gray-500 dark:text-gray-400">No returned grade</p>}</div><ChevronRight size={17} className="text-gray-300 dark:text-gray-700 group-hover:text-gray-500 dark:group-hover:text-gray-400" /></div></div></Link>;
}
