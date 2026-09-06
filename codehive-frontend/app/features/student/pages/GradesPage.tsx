import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { BookOpen, CheckCircle2, ChevronRight, CircleAlert, Clock3, GraduationCap, MessageSquare, RefreshCw } from "lucide-react";

import { Dropdown } from "~/shared/components/ui/Dropdown";

import { listMyAssignmentFeedback, listMyAssignmentOverviews } from "../api/assignment.api";
import { StudentHeader } from "../components/StudentHeader";
import { StudentSidebar } from "../components/StudentSidebar";
import type { AssignmentFeedback, StudentAssignmentOverview } from "../types/assignment.types";

type GradeFilter = "all" | "returned" | "awaiting" | "not-submitted";
type GradeState = Exclude<GradeFilter, "all">;

const GRADE_META: Record<GradeState, { label: string; className: string; icon?: boolean }> = {
  returned: { label: "Returned", className: "bg-green-500/10 text-green-500 border-green-500/20", icon: true },
  awaiting: { label: "Awaiting grade", className: "bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow border-azure/20 dark:border-yellow/20" },
  "not-submitted": { label: "Not submitted", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

function gradeState(item: StudentAssignmentOverview): GradeState {
  if (item.grade) return "returned";
  return item.workStatus === "SUBMITTED" ? "awaiting" : "not-submitted";
}

function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
}

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
    try {
      setItems(await listMyAssignmentOverviews());
    } catch (cause) {
      setItems([]);
      setError(cause instanceof Error ? cause.message : "Could not load grades.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggleFeedback(item: StudentAssignmentOverview) {
    const assignmentId = item.assignment.id;
    if (expanded === assignmentId) {
      setExpanded(null);
      return;
    }
    setExpanded(assignmentId);
    if (feedback[assignmentId] || item.feedbackCount === 0) return;

    setLoadingFeedback(assignmentId);
    try {
      const result = await listMyAssignmentFeedback(assignmentId);
      setFeedback((current) => ({ ...current, [assignmentId]: result }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load feedback.");
    } finally {
      setLoadingFeedback(null);
    }
  }

  const groups = useMemo(() => Array.from(new Map(items.map((item) => [item.groupId, item.groupName])).entries()), [items]);
  const filtered = useMemo(() => items.filter((item) => {
    if (groupId !== "all" && item.groupId !== groupId) return false;
    return filter === "all" || gradeState(item) === filter;
  }), [filter, groupId, items]);
  const returned = items.filter((item) => gradeState(item) === "returned").length;
  const awaiting = items.filter((item) => gradeState(item) === "awaiting").length;
  const earned = items.reduce((sum, item) => sum + (item.grade?.value ?? 0), 0);
  const possible = items.reduce((sum, item) => sum + (item.grade?.maxPoints ?? 0), 0);

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 font-sans">
      <StudentSidebar active="grades" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <StudentHeader breadcrumbs={[{ label: "Student" }, { label: "Grades" }]} />
        <main className="flex-1 overflow-y-auto scrollbar-hide p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 text-xs font-medium text-gray-500 dark:text-gray-400 mb-3"><GraduationCap size={13} className="text-yellow" /> ACADEMIC RECORD</div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My grades</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Review returned grades, pending work, and published teacher feedback.</p>
              </div>
              <button onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors disabled:opacity-50"><RefreshCw size={13} /> Refresh</button>
            </div>

            {loading ? <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse"><div className="md:col-span-4 h-24 rounded-2xl bg-gray-100 dark:bg-dark-surface" />{[0, 1, 2, 3].map((item) => <div key={item} className="h-36 rounded-2xl bg-gray-100 dark:bg-dark-surface" />)}<div className="md:col-span-4 h-72 rounded-2xl bg-gray-100 dark:bg-dark-surface" /></div> : error && items.length === 0 ? <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"><CircleAlert className="mx-auto text-red-500 mb-3" size={28} /><h2 className="font-semibold">Could not load grades</h2><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error}</p><button onClick={() => void load()} className="btn-primary mt-5">Try again</button></div> : <>
              {error && <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500">{error}</div>}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <SummaryCard label="Assignments" value={items.length} className="text-gray-900 dark:text-white" />
                <SummaryCard label="Grades returned" value={returned} className="text-green-500" />
                <SummaryCard label="Awaiting grade" value={awaiting} className="text-azure dark:text-yellow" />
                <SummaryCard label="Returned points" value={possible ? `${earned} / ${possible}` : "—"} className="text-gray-900 dark:text-white" />
              </section>

              <section className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800/60">
                  <div><h2 className="font-semibold text-gray-900 dark:text-white">Assignment record</h2><p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{filtered.length} visible · {items.length} total · Draft grades stay private until returned.</p></div>
                  <div className="flex flex-col md:flex-row gap-2">
                    <Dropdown value={groupId} onChange={setGroupId} size="compact" className="min-w-40" options={[{ value: "all", label: "All groups" }, ...groups.map(([id, name]) => ({ value: id, label: name }))]} />
                    <div className="flex overflow-x-auto scrollbar-hide gap-0.5 -mx-1 px-1">{(["all", "returned", "awaiting", "not-submitted"] as GradeFilter[]).map((value) => <button key={value} onClick={() => setFilter(value)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${filter === value ? "bg-azure/10 dark:bg-yellow/10 text-azure dark:text-yellow" : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>{value === "not-submitted" ? "Not submitted" : value.charAt(0).toUpperCase() + value.slice(1)}</button>)}</div>
                  </div>
                </div>
                {filtered.length === 0 ? <div className="py-16 text-center"><GraduationCap className="mx-auto text-gray-400 dark:text-gray-600 mb-3" size={30} /><h3 className="font-semibold text-gray-800 dark:text-gray-100">No {filter === "all" ? "grade records" : filter === "not-submitted" ? "unsubmitted assignments" : `${filter} grades`}</h3><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Try another filter or check with your teacher.</p></div> : <div className="divide-y divide-gray-100 dark:divide-gray-800/60">{filtered.map((item) => <GradeCard key={item.assignment.id} item={item} focused={focusedAssignment === item.assignment.id} expanded={expanded === item.assignment.id} loadingFeedback={loadingFeedback === item.assignment.id} feedback={feedback[item.assignment.id] ?? []} onToggleFeedback={() => void toggleFeedback(item)} />)}</div>}
              </section>
            </>}
          </div>
        </main>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, className }: { label: string; value: string | number; className: string }) {
  return <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-dark-surface p-4"><p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 dark:text-gray-500">{label}</p><p className={`mt-1 text-2xl font-bold ${className}`}>{value}</p></div>;
}

function GradeCard({ item, focused, expanded, loadingFeedback, feedback, onToggleFeedback }: { item: StudentAssignmentOverview; focused: boolean; expanded: boolean; loadingFeedback: boolean; feedback: AssignmentFeedback[]; onToggleFeedback: () => void }) {
  const { assignment, grade } = item;
  const state = gradeState(item);
  const meta = GRADE_META[state];
  const returnedAt = grade?.returnedAt ?? grade?.updatedAt;

  return <article className={`group px-5 py-5 transition-colors hover:bg-gray-50 dark:hover:bg-dark-card/50 ${focused ? "bg-azure/5 dark:bg-yellow/5 ring-1 ring-inset ring-azure/20 dark:ring-yellow/20" : ""}`}>
    <div className="flex items-start gap-4">
      <div className="relative w-10 h-10 flex-shrink-0 grid place-items-center"><svg className="absolute inset-0 w-full h-full text-gray-300 dark:text-gray-700" viewBox="0 0 36 36" fill="none"><polygon points="18,2 34,10 34,26 18,34 2,26 2,10" stroke="currentColor" strokeWidth="1.5" /></svg><GraduationCap size={15} className="text-gray-500 dark:text-gray-400" /></div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-gray-500"><BookOpen size={11} /> {item.groupName}{item.groupArchived ? " · Read-only" : ""}</span><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.className}`}>{meta.icon && <CheckCircle2 size={11} />}{meta.label}</span></div>
        <div className="mt-2 flex items-start gap-3"><div className="min-w-0 flex-1"><Link to={`/assignment/${assignment.id}`} className="block w-fit max-w-full text-base font-semibold text-gray-800 dark:text-gray-100 group-hover:text-azure dark:group-hover:text-yellow transition-colors truncate">{assignment.title}</Link><p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">{assignment.description}</p></div></div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-mono text-gray-400 dark:text-gray-500"><span>{assignment.maxPoints} possible points</span><span>{item.workStatus === "SUBMITTED" ? "Work submitted" : "Work not submitted"}</span>{returnedAt && <span className="inline-flex items-center gap-1"><Clock3 size={11} /> Returned {formatDate(returnedAt)}</span>}{item.feedbackCount > 0 && <span className="inline-flex items-center gap-1"><MessageSquare size={11} /> {item.feedbackCount} feedback item{item.feedbackCount === 1 ? "" : "s"}</span>}</div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-shrink-0">
        <div className="min-w-24 text-right">{grade ? <><p className="font-mono text-lg font-bold text-green-500">{grade.value} / {grade.maxPoints}</p><p className="text-[10px] text-gray-500 dark:text-gray-400">Returned grade</p></> : state === "awaiting" ? <><p className="text-xs font-semibold text-azure dark:text-yellow">Awaiting grade</p><p className="text-[10px] text-gray-500 dark:text-gray-400">Teacher review</p></> : <p className="text-xs text-gray-500 dark:text-gray-400">No submission</p>}</div>
        <button onClick={onToggleFeedback} disabled={!item.feedbackCount && !expanded} aria-label={`View feedback for ${assignment.title}`} title="Teacher feedback" className="w-9 h-9 rounded-lg grid place-items-center text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card hover:text-azure dark:hover:text-yellow transition-colors disabled:opacity-30 disabled:hover:bg-transparent"><MessageSquare size={16} /></button>
        <Link to={`/assignment/${assignment.id}`} aria-label={`Open ${assignment.title}`} className="w-9 h-9 rounded-lg grid place-items-center text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card hover:text-gray-700 dark:hover:text-gray-200 transition-colors"><ChevronRight size={17} /></Link>
      </div>
    </div>
    {expanded && <div className="ml-14 mt-4 rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-dark-card p-4"><p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 dark:text-gray-500">Teacher feedback</p>{loadingFeedback ? <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Loading feedback…</p> : feedback.length ? <div className="mt-3 space-y-3">{feedback.map((entry) => <div key={entry.id} className="border-l-2 border-azure/30 dark:border-yellow/30 pl-3"><p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200">{entry.status === "DELETED" ? "Feedback removed." : entry.body}</p><p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">{formatDate(entry.createdAt)}</p></div>)}</div> : <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">No published feedback.</p>}</div>}
  </article>;
}
