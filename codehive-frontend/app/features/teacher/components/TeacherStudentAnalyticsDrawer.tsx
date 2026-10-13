import { useEffect, useState } from "react";
import { ArrowRight, CircleAlert, GraduationCap, RefreshCw, X } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "~/core/providers/AuthProvider";
import { usageQuery, usageRequest } from "~/features/assistant-usage/api";
import type { Breakdown, Summary, UsageRow } from "~/features/assistant-usage/types";
import { listStudentAssignmentMetrics } from "../api/metrics.api";
import type { StudentAssignmentAnalytics, StudentMetrics } from "../types/metrics.types";
import { CountCard, DrawerMetric, DrawerSection, DrawerStatGrid, DrawerTabButton, TinyMetric } from "./TeacherAnalyticsDrawer";
import { formatPercentage } from "./TeacherAnalyticsOverview";
import { compactButtonClass, StatusPill, TeacherLoading } from "./TeacherUI";

type Tab = "overview" | "grades" | "ai";
type State<T> = { scope: string; value?: T; error?: string };

export function TeacherStudentAnalyticsDrawer({ student, groupId, assignmentTitles, refreshVersion, onClose }: {
  student: StudentMetrics; groupId: string; assignmentTitles: Map<string, string>; refreshVersion: number; onClose: () => void;
}) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [revision, setRevision] = useState(0);
  const [grades, setGrades] = useState<State<StudentAssignmentAnalytics[]>>();
  const [summary, setSummary] = useState<State<Summary>>();
  const [usage, setUsage] = useState<State<Map<string, UsageRow>>>();
  const scope = JSON.stringify([user?.id, groupId, student.studentId, refreshVersion, revision]);

  useEffect(() => {
    const controller = new AbortController();
    const fail = (cause: unknown) => cause instanceof Error && cause.message ? cause.message : "Could not load student analytics.";
    setGrades(undefined); setSummary(undefined); setUsage(undefined);
    void listStudentAssignmentMetrics(groupId, student.studentId, controller.signal)
      .then(value => { if (!controller.signal.aborted) setGrades({ scope, value }); })
      .catch(cause => { if (!controller.signal.aborted) setGrades({ scope, error: fail(cause) }); });
    const to = new Date();
    const dates = { from: new Date(to.getTime() - 30 * 86400000).toISOString(), to: to.toISOString() };
    const base = `/api/groups/${encodeURIComponent(groupId)}/assistant-usage/students/${encodeURIComponent(student.studentId)}`;
    void usageRequest<Summary>("owner", base + usageQuery(dates), controller.signal)
      .then(value => { if (!controller.signal.aborted) setSummary({ scope, value }); })
      .catch(cause => { if (!controller.signal.aborted) setSummary({ scope, error: fail(cause) }); });
    void (async () => {
      const rows = new Map<string, UsageRow>();
      for (let page = 0; !controller.signal.aborted; page++) {
        const result = await usageRequest<Breakdown>("owner", base + "/assignments" + usageQuery({ ...dates, page, size: 100 }), controller.signal);
        if (controller.signal.aborted) return;
        result.rows.content.forEach(row => rows.set(row.id, row));
        if (result.rows.last) { setUsage({ scope, value: rows }); return; }
      }
    })().catch(cause => { if (!controller.signal.aborted) setUsage({ scope, error: fail(cause) }); });
    return () => controller.abort();
  }, [groupId, student.studentId, scope]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);
  useEffect(() => { setTab("overview"); }, [groupId, student.studentId]);
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener("assistant-usage-changed", refresh);
    return () => window.removeEventListener("assistant-usage-changed", refresh);
  }, []);

  const gradeData = grades?.scope === scope ? grades : undefined;
  const summaryData = summary?.scope === scope ? summary : undefined;
  const usageData = usage?.scope === scope ? usage : undefined;
  const retry = () => setRevision(value => value + 1);
  const e = summaryData?.value?.educational;

  const needsAttention = student.missingAssignmentIds.length > 0 || student.lateCount > 0;

  return <div className="fixed inset-0 z-50 flex justify-end bg-dark-bg/45 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="student-analytics-title">
    <button type="button" aria-label="Close student analytics" onClick={onClose} className="absolute inset-0 cursor-default" />
    <aside className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-dark-card">
      <header className="flex-shrink-0 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-azure dark:text-yellow">Student analytics</p>
            <h2 id="student-analytics-title" tabIndex={-1} autoFocus className="mt-1 truncate text-xl font-semibold outline-none">{student.fullName}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2"><StatusPill label={needsAttention ? "attention" : "on track"} tone={needsAttention ? "warning" : "success"} /><span className="font-mono text-xs text-gray-500 dark:text-gray-400">{student.enrollmentNumber}</span></div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-dark-surface dark:hover:text-gray-200"><X size={17} /></button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2"><Link to={`/teacher/grades?groupId=${encodeURIComponent(groupId)}&studentId=${encodeURIComponent(student.studentId)}`} className="inline-flex items-center gap-1.5 rounded-lg bg-azure px-3 py-2 text-xs font-semibold text-white hover:bg-french"><GraduationCap size={13} /> Open gradebook</Link></div>
      </header>
      <nav role="tablist" aria-label="Student analytics sections" className="flex flex-shrink-0 gap-1 border-b border-gray-200 px-4 dark:border-gray-700">
        <DrawerTabButton active={tab === "overview"} label="Overview" onClick={() => setTab("overview")} />
        <DrawerTabButton active={tab === "grades"} label="Grades" onClick={() => setTab("grades")} />
        <DrawerTabButton active={tab === "ai"} label="AI usage" onClick={() => setTab("ai")} />
      </nav>
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {tab === "overview" ? <div className="divide-y divide-gray-200 dark:divide-gray-700/60">
          <div className="pb-5">
            <DrawerStatGrid>
              <DrawerMetric label="Completion" value={formatPercentage(student.completionRate)} detail={`${student.submittedCount} of ${student.publishedAssignments} submitted`} />
              <DrawerMetric label="Average score" value={formatPercentage(student.averageScore)} detail={`${student.gradedAssignments} graded`} />
              <DrawerMetric label="Submitted" value={String(student.submittedCount)} detail={`${student.publishedAssignments} published`} />
              <DrawerMetric label="Attempts" value={String(student.totalAttempts)} detail="Across assignments" />
            </DrawerStatGrid>
          </div>
          <DrawerSection title="Grading and delivery">
            <dl className="grid grid-cols-3 gap-x-4 gap-y-3">
              <CountCard label="Missing" value={student.missingAssignmentIds.length} tone="error" />
              <CountCard label="Late deliveries" value={student.lateCount} tone="warning" />
              <CountCard label="Graded" value={student.gradedAssignments} tone="success" />
            </dl>
          </DrawerSection>
          <DrawerSection title={`Missing assignments (${student.missingAssignmentIds.length})`}>
            {student.missingAssignmentIds.length
              ? <ul className="divide-y divide-gray-100 dark:divide-gray-800/60">{student.missingAssignmentIds.map(id => <li key={id} className="truncate py-2 text-sm">{assignmentTitles.get(id) ?? "Assignment"}</li>)}</ul>
              : <p className="text-sm text-gray-600 dark:text-gray-300">No missing assignments.</p>}
          </DrawerSection>
        </div> : tab === "grades" ? <section aria-label="Assignment grades">
          <p className="text-xs text-gray-500 dark:text-gray-400">Current delivery, verdict, attempts, grade, and lifetime AI answers used.</p>
          {usageData?.error && <ErrorNotice message="Assignment AI usage unavailable" onRetry={retry} label="Retry AI usage" />}
          {!gradeData ? <div role="status" aria-label="Loading grades" className="mt-4"><TeacherLoading rows={3} /></div> : gradeData.error ? <ErrorNotice message={gradeData.error} onRetry={retry} label="Retry grades" /> : gradeData.value?.length === 0 ? <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">No assignments in this group.</p> : <ul className="mt-2 divide-y divide-gray-200 dark:divide-gray-700/60">{gradeData.value?.map(item => {
            const quota = usageData?.value?.get(item.assignmentId)?.quota;
            const url = `/teacher/grades?groupId=${encodeURIComponent(groupId)}&assignmentId=${encodeURIComponent(item.assignmentId)}&studentId=${encodeURIComponent(student.studentId)}`;
            return <li key={item.assignmentId} className="py-4">
              <div className="flex items-start justify-between gap-3"><h4 className="min-w-0 truncate text-sm font-medium">{item.title}</h4><StatusPill label={item.workStatus.replaceAll("_", " ")} tone={item.workStatus === "RETURNED" ? "success" : item.workStatus === "SUBMITTED" ? "warning" : "error"} /></div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                <TinyMetric label="Verdict" value={item.verdict ?? "—"} />
                <TinyMetric label="Attempts" value={String(item.attempts)} />
                <TinyMetric label="Grade" value={item.grade ? `${item.grade.value} / ${item.grade.maxPoints}${item.grade.status === "DRAFT" ? " (draft)" : ""}` : "Not graded"} />
                <TinyMetric label="AI answers used (lifetime)" value={!usageData ? "Loading…" : quota ? quota.usedLifetime.toLocaleString() : "Unavailable"} />
              </dl>
              <Link to={url} className="mt-3 inline-flex items-center gap-1 rounded text-xs font-medium text-azure underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:text-yellow dark:focus-visible:ring-yellow" aria-label={`Review work for ${item.title}`}>Review work<ArrowRight size={12} aria-hidden="true" /></Link>
            </li>;
          })}</ul>}
        </section> : <section aria-label="Student AI usage">
          <p className="text-xs text-gray-500 dark:text-gray-400">This student's questions in this group over the last 30 days.</p>
          {!summaryData ? <p role="status" className="mt-5 text-sm text-gray-500 dark:text-gray-400">Loading AI usage…</p> : summaryData.error ? <ErrorNotice message={summaryData.error} onRetry={retry} label="Retry AI usage" /> : e && <>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              <CountCard label="Questions asked" value={e.requests} tone="info" />
              <CountCard label="Answers used" value={e.responses} tone="success" />
              <CountCard label="Without an answer" value={e.blocked + e.failed + e.cancelled} tone="error" />
              <CountCard label="In progress" value={e.pending} tone="warning" />
            </dl>
            {e.requests === 0 && <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No AI questions in the last 30 days.</p>}
            <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">Only delivered answers consume quota, including educational redirections. Lifetime answer counts per assignment appear in Grades.</p>
          </>}
        </section>}
      </div>
    </aside>
  </div>;
}

function ErrorNotice({ message, onRetry, label }: { message: string; onRetry: () => void; label: string }) {
  return <div role="alert" className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm"><p className="flex items-center gap-2"><CircleAlert size={15} className="shrink-0 text-red-500" />{message}</p><button type="button" onClick={onRetry} className={`${compactButtonClass} mt-3`}><RefreshCw size={13} />{label}</button></div>;
}
