import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { BookOpen, CheckCircle2, ChevronRight, CircleAlert, ClipboardList, Clock3, HardDrive, RefreshCw } from "lucide-react";

import { listMyAssignmentOverviews } from "../api/assignment.api";
import { StudentHeader } from "../components/StudentHeader";
import { StudentSidebar } from "../components/StudentSidebar";
import type { Assignment, Language, StudentAssignmentOverview } from "../types/assignment.types";
import { assignmentProgress, type AssignmentProgress } from "../utils/assignment-progress";

type FilterTab = "all" | "open" | "inprogress" | "done" | "closed";

const LANG_ABBR: Record<Language, string> = { PYTHON: "PY", JAVA: "JAVA", CPP: "C++", C: "C" };

const STATE_META: Record<AssignmentProgress, { label: string; className: string; accepted?: boolean }> = {
  open: { label: "Open", className: "bg-azure/10 text-azure dark:text-yellow border-azure/20 dark:border-yellow/20" },
  inprogress: { label: "In progress", className: "bg-azure/10 text-azure dark:text-yellow border-azure/20 dark:border-yellow/20" },
  done: { label: "Done", className: "bg-green-500/10 text-green-500 border-green-500/20", accepted: true },
  closed: { label: "Closed", className: "bg-red-500/10 text-red-500 border-red-500/20" },
  upcoming: { label: "Upcoming", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No deadline";
}

export function MyAssignmentsPage() {
  const [overviews, setOverviews] = useState<StudentAssignmentOverview[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOverviews(await listMyAssignmentOverviews());
    } catch (cause) {
      setOverviews([]);
      setError(cause instanceof Error ? cause.message : "Could not load assignments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const assignments = useMemo(() => overviews.map((overview) => overview.assignment), [overviews]);
  const submissionByAssignment = useMemo(() => new Map(overviews.flatMap((overview) => overview.currentSubmission ? [[overview.assignment.id, overview.currentSubmission] as const] : [])), [overviews]);
  const overviewByAssignment = useMemo(() => new Map(overviews.map((overview) => [overview.assignment.id, overview])), [overviews]);
  const counts = useMemo(() => assignments.reduce<Record<AssignmentProgress, number>>((total, assignment) => {
    total[assignmentProgress(assignment, submissionByAssignment.get(assignment.id))] += 1;
    return total;
  }, { open: 0, inprogress: 0, done: 0, closed: 0, upcoming: 0 }), [assignments, submissionByAssignment]);
  const visibleAssignments = useMemo(() => filterTab === "all" ? assignments : assignments.filter((assignment) => assignmentProgress(assignment, submissionByAssignment.get(assignment.id)) === filterTab), [assignments, filterTab, submissionByAssignment]);

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 font-sans">
      <StudentSidebar active="assignments" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <StudentHeader breadcrumbs={[{ label: "Student" }, { label: "My assignments" }]} />
        <main className="flex-1 overflow-y-auto scrollbar-hide p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div><div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 text-xs font-medium text-gray-500 dark:text-gray-400 mb-3"><ClipboardList size={13} className="text-yellow" /> YOUR WORK</div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">My assignments</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track every assignment, current verdict, deadline, and class.</p></div>
              <button onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors disabled:opacity-50"><RefreshCw size={13} /> Refresh</button>
            </div>

            {loading ? <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse"><div className="md:col-span-3 h-24 rounded-2xl bg-gray-100 dark:bg-dark-surface" />{[0, 1, 2].map((item) => <div key={item} className="h-44 rounded-2xl bg-gray-100 dark:bg-dark-surface" />)}</div> : error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"><CircleAlert className="mx-auto text-red-500 mb-3" size={28} /><h2 className="font-semibold">Could not load assignments</h2><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error}</p><button onClick={() => void load()} className="btn-primary mt-5">Try again</button></div> : <>
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <SummaryCard label="Open" value={counts.open} className="text-azure dark:text-yellow" />
                <SummaryCard label="In progress" value={counts.inprogress} className="text-azure dark:text-yellow" />
                <SummaryCard label="Done" value={counts.done} className="text-green-500" />
                <SummaryCard label="Closed" value={counts.closed} className="text-red-500" />
              </section>

              <section className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-dark-surface overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800/60"><div><h2 className="font-semibold text-gray-900 dark:text-white">All assignments</h2><p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{visibleAssignments.length} visible · {assignments.length} total</p></div><div className="flex overflow-x-auto scrollbar-hide gap-0.5 -mx-1 px-1">{(["all", "open", "inprogress", "done", "closed"] as FilterTab[]).map((tab) => <button key={tab} onClick={() => setFilterTab(tab)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${filterTab === tab ? "bg-azure/10 dark:bg-yellow/10 text-azure dark:text-yellow" : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>{tab === "inprogress" ? "In progress" : tab.charAt(0).toUpperCase() + tab.slice(1)}</button>)}</div></div>
                {visibleAssignments.length === 0 ? <div className="py-16 text-center"><ClipboardList className="mx-auto text-gray-400 dark:text-gray-600 mb-3" size={30} /><h3 className="font-semibold text-gray-800 dark:text-gray-100">No {filterTab === "all" ? "assignments" : filterTab === "inprogress" ? "in-progress assignments" : `${filterTab} assignments`}</h3><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Try another filter or check with your teacher.</p></div> : <div className="divide-y divide-gray-100 dark:divide-gray-800/60">{visibleAssignments.map((assignment) => <AssignmentCard key={assignment.id} overview={overviewByAssignment.get(assignment.id)!} />)}</div>}
              </section>
            </>}
          </div>
        </main>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, className }: { label: string; value: number; className: string }) {
  return <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-dark-surface p-4"><p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 dark:text-gray-500">{label}</p><p className={`mt-1 text-2xl font-bold ${className}`}>{value}</p></div>;
}

function AssignmentCard({ overview }: { overview: StudentAssignmentOverview }) {
  const { assignment, currentSubmission: submission } = overview;
  const state = assignmentProgress(assignment, submission);
  const meta = STATE_META[state];
  const currentVerdict = submission && submission.executionStatus !== "AC" ? submission.executionStatus : null;
  const isOverdue = !!assignment.dueDate && Date.parse(assignment.dueDate) < Date.now() && state !== "done" && state !== "closed";
  return <Link to={`/assignment/${assignment.id}`} className="group block px-5 py-5 hover:bg-gray-50 dark:hover:bg-dark-card/50 transition-colors"><div className="flex items-start gap-4"><div className="relative w-10 h-10 flex-shrink-0 grid place-items-center"><svg className="absolute inset-0 w-full h-full text-gray-300 dark:text-gray-700" viewBox="0 0 36 36" fill="none"><polygon points="18,2 34,10 34,26 18,34 2,26 2,10" stroke="currentColor" strokeWidth="1.5" /></svg><ClipboardList size={15} className="text-gray-500 dark:text-gray-400" /></div><div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-gray-500"><BookOpen size={11} /> {overview.groupName}{overview.groupArchived ? " · Read-only" : ""}</span><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.className}`}>{meta.accepted && <CheckCircle2 size={11} />}{meta.label}</span>{currentVerdict && <span className="rounded-md bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 px-1.5 py-0.5 text-[10px] font-mono text-gray-500 dark:text-gray-400">{currentVerdict}</span>}{overview.grade && <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-500">{overview.grade.value}/{overview.grade.maxPoints} pts</span>}</div><div className="mt-2 flex items-start gap-3"><div className="min-w-0 flex-1"><h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 group-hover:text-azure dark:group-hover:text-yellow transition-colors truncate">{assignment.title}</h3><p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">{assignment.description}</p></div><ChevronRight size={17} className="mt-1 text-gray-300 dark:text-gray-700 group-hover:text-gray-500 dark:group-hover:text-gray-400 flex-shrink-0" /></div><div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-mono text-gray-400 dark:text-gray-500"><span className="inline-flex items-center gap-1"><Clock3 size={11} /> {assignment.timeLimitMs}ms</span><span className="inline-flex items-center gap-1"><HardDrive size={11} /> {assignment.memoryLimitMb}MB</span><span>{assignment.maxPoints} points</span><span className={isOverdue ? "text-orange-500" : ""}>{assignment.dueDate ? `Due ${formatDate(assignment.dueDate)}` : "No due date"}</span><span className="flex items-center gap-1">{assignment.allowedLanguages.slice(0, 4).map((language) => <span key={language} className="rounded bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-gray-700/60 px-1 py-0.5">{LANG_ABBR[language]}</span>)}</span></div></div></div></Link>;
}
