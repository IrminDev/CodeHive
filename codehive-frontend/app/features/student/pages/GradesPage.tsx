import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { BookOpen, CheckCircle2, ChevronRight, CircleAlert, Clock3, GraduationCap, MessageSquare, RefreshCw } from "lucide-react";

import { listMyAssignmentFeedback, listMyAssignmentOverviews } from "../api/assignment.api";
import { StudentHeader } from "../components/StudentHeader";
import { StudentSidebar } from "../components/StudentSidebar";
import type { AssignmentFeedback, StudentAssignmentOverview } from "../types/assignment.types";

type GradeFilter = "all" | "returned" | "awaiting" | "not-submitted";

export function GradesPage() {
  const [searchParams] = useSearchParams();
  const focusedAssignment = searchParams.get("assignmentId");
  const [items, setItems] = useState<StudentAssignmentOverview[]>([]);
  const [feedback, setFeedback] = useState<Record<string, AssignmentFeedback[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState<string | null>(null);
  const [filter, setFilter] = useState<GradeFilter>("all");
  const [groupId, setGroupId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setItems(await listMyAssignmentOverviews()); }
    catch (cause) { setItems([]); setError(cause instanceof Error ? cause.message : "Could not load grades."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggleFeedback(item: StudentAssignmentOverview) {
    const assignmentId = item.assignment.id;
    if (expanded === assignmentId) { setExpanded(null); return; }
    setExpanded(assignmentId);
    if (feedback[assignmentId] || item.feedbackCount === 0) return;
    setLoadingFeedback(assignmentId);
    try {
      const result = await listMyAssignmentFeedback(assignmentId);
      setFeedback((current) => ({ ...current, [assignmentId]: result }));
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load feedback."); }
    finally { setLoadingFeedback(null); }
  }

  const groups = useMemo(() => Array.from(new Map(items.map((item) => [item.groupId, item.groupName])).entries()), [items]);
  const filtered = useMemo(() => items.filter((item) => {
    if (groupId !== "all" && item.groupId !== groupId) return false;
    if (filter === "returned") return !!item.grade;
    if (filter === "not-submitted") return item.workStatus === "NOT_SUBMITTED";
    if (filter === "awaiting") return item.workStatus === "SUBMITTED" && !item.grade;
    return true;
  }), [filter, groupId, items]);
  const returned = items.filter((item) => item.grade).length;
  const earned = items.reduce((sum, item) => sum + (item.grade?.value ?? 0), 0);
  const possible = items.reduce((sum, item) => sum + (item.grade?.maxPoints ?? 0), 0);

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 font-sans">
      <StudentSidebar active="grades" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <StudentHeader breadcrumbs={[{ label: "Student" }, { label: "Grades" }]} />
        <main className="flex-1 overflow-y-auto scrollbar-hide p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div><div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 text-xs font-medium text-gray-500 dark:text-gray-400 mb-3"><GraduationCap size={13} className="text-yellow" /> ACADEMIC RECORD</div><h1 className="text-3xl font-bold">My grades</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Returned grades, pending work, and published teacher feedback.</p></div><button onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-50"><RefreshCw size={13} /> Refresh</button></div>

            {loading ? <div className="space-y-4 animate-pulse"><div className="h-24 rounded-2xl bg-gray-100 dark:bg-dark-surface" /><div className="h-80 rounded-2xl bg-gray-100 dark:bg-dark-surface" /></div> : error && items.length === 0 ? <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"><CircleAlert className="mx-auto text-red-500" size={28} /><h2 className="mt-3 font-semibold">Could not load grades</h2><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error}</p></div> : <>
              {error && <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500">{error}</div>}
              <section className="grid grid-cols-1 sm:grid-cols-3 gap-3"><Summary label="Assignments" value={String(items.length)} /><Summary label="Grades returned" value={`${returned} / ${items.length}`} /><Summary label="Returned points" value={possible ? `${earned} / ${possible}` : "—"} /></section>
              <section className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface overflow-hidden">
                <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3"><div><h2 className="font-semibold">Assignment record</h2><p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Draft grades stay private until teacher returns them.</p></div><div className="flex flex-col sm:flex-row gap-2"><select value={groupId} onChange={(event) => setGroupId(event.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card text-xs"><option value="all">All groups</option>{groups.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><div className="flex overflow-x-auto gap-0.5">{(["all", "returned", "awaiting", "not-submitted"] as GradeFilter[]).map((value) => <button key={value} onClick={() => setFilter(value)} className={`px-2.5 py-2 rounded-md text-xs whitespace-nowrap ${filter === value ? "bg-azure/10 dark:bg-yellow/10 text-azure dark:text-yellow" : "text-gray-500"}`}>{value === "not-submitted" ? "Not submitted" : value.charAt(0).toUpperCase() + value.slice(1)}</button>)}</div></div></header>
                {filtered.length === 0 ? <div className="py-16 text-center text-sm text-gray-500">No assignments match these filters.</div> : <div className="divide-y divide-gray-100 dark:divide-gray-800/60">{filtered.map((item) => <article key={item.assignment.id} className={`${focusedAssignment === item.assignment.id ? "bg-azure/5 dark:bg-yellow/5" : ""}`}><div className="px-5 py-4 flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-card grid place-items-center text-gray-500"><BookOpen size={17} /></div><div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold truncate">{item.assignment.title}</h3>{item.groupArchived && <span className="text-[10px] text-gray-500">Read-only class</span>}</div><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.groupName} · {item.assignment.maxPoints} possible points</p></div><div className="text-right flex-shrink-0">{item.grade ? <><p className="font-mono font-bold text-green-500">{item.grade.value} / {item.grade.maxPoints}</p><p className="text-[10px] text-gray-500">Returned</p></> : item.workStatus === "SUBMITTED" ? <><p className="text-xs font-semibold text-yellow">Awaiting grade</p><p className="text-[10px] text-gray-500">Submitted</p></> : <p className="text-xs text-gray-500">Not submitted</p>}</div><button onClick={() => void toggleFeedback(item)} disabled={!item.feedbackCount && expanded !== item.assignment.id} className="w-9 h-9 rounded-lg grid place-items-center text-gray-400 hover:text-azure dark:hover:text-yellow disabled:opacity-30" title="Teacher feedback"><MessageSquare size={16} /></button><Link to={`/assignment/${item.assignment.id}`} aria-label={`Open ${item.assignment.title}`}><ChevronRight size={16} className="text-gray-400" /></Link></div>{expanded === item.assignment.id && <div className="mx-5 mb-4 rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-dark-card p-4">{loadingFeedback === item.assignment.id ? <p className="text-xs text-gray-500">Loading feedback…</p> : (feedback[item.assignment.id] ?? []).length ? <div className="space-y-3">{feedback[item.assignment.id].map((entry) => <div key={entry.id}><p className="text-sm leading-relaxed">{entry.status === "DELETED" ? "Feedback removed." : entry.body}</p><p className="mt-1 text-[10px] text-gray-500">{new Date(entry.createdAt).toLocaleString()}</p></div>)}</div> : <p className="text-xs text-gray-500">No published feedback.</p>}</div>}</article>)}</div>}
              </section>
            </>}
          </div>
        </main>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-dark-surface p-4"><p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>;
}
