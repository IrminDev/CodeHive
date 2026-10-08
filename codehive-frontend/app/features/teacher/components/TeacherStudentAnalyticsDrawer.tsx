import { useEffect, useState } from "react";
import { BarChart3, CircleAlert, GraduationCap, RefreshCw, Sparkles, X } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "~/core/providers/AuthProvider";
import { usageQuery, usageRequest } from "~/features/assistant-usage/api";
import type { Breakdown, Summary, UsageRow } from "~/features/assistant-usage/types";
import { listStudentAssignmentMetrics } from "../api/metrics.api";
import type { StudentAssignmentAnalytics, StudentMetrics } from "../types/metrics.types";
import { CountCard, DrawerMetric, DrawerTabButton, SectionTitle, TinyMetric } from "./TeacherAnalyticsDrawer";
import { formatPercentage } from "./TeacherAnalyticsOverview";
import { compactButtonClass, panelClass, StatusPill, TeacherLoading } from "./TeacherUI";

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

  return <div className="fixed inset-0 z-50 flex justify-end bg-dark-bg/45 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="student-analytics-title">
    <button type="button" aria-label="Close student analytics" onClick={onClose} className="absolute inset-0 cursor-default" />
    <aside className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-dark-card">
      <header className="flex-shrink-0 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-azure dark:text-yellow">Student analytics</p>
            <h2 id="student-analytics-title" tabIndex={-1} autoFocus className="mt-1 truncate text-xl font-semibold outline-none">{student.fullName}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2"><StatusPill label={student.missingAssignmentIds.length || student.lateCount ? "attention" : "on track"} tone={student.missingAssignmentIds.length || student.lateCount ? "warning" : "success"} /><span className="text-[10px] font-mono text-gray-500">{student.enrollmentNumber}</span></div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-dark-surface dark:hover:text-gray-200"><X size={17} /></button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2"><Link to={`/teacher/grades?groupId=${encodeURIComponent(groupId)}&studentId=${encodeURIComponent(student.studentId)}`} className="inline-flex items-center gap-1.5 rounded-lg bg-azure px-3 py-2 text-xs font-semibold text-white hover:bg-french"><GraduationCap size={13} /> Open gradebook</Link></div>
      </header>
      <nav role="tablist" aria-label="Student analytics sections" className="flex flex-shrink-0 border-b border-gray-200 px-4 dark:border-gray-700">
        <DrawerTabButton active={tab === "overview"} label="Overview" icon={<BarChart3 size={14} />} onClick={() => setTab("overview")} />
        <DrawerTabButton active={tab === "grades"} label="Grades" icon={<GraduationCap size={14} />} onClick={() => setTab("grades")} />
        <DrawerTabButton active={tab === "ai"} label="AI Usage" icon={<Sparkles size={14} />} onClick={() => setTab("ai")} />
      </nav>
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {tab === "overview" ? <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DrawerMetric label="Completion" value={formatPercentage(student.completionRate)} detail={`${student.submittedCount}/${student.publishedAssignments} submitted`} />
            <DrawerMetric label="Average score" value={formatPercentage(student.averageScore)} detail={`${student.gradedAssignments} graded assignments`} />
            <DrawerMetric label="Submitted" value={String(student.submittedCount)} detail={`${student.publishedAssignments} published assignments`} />
            <DrawerMetric label="Attempts" value={String(student.totalAttempts)} detail="Total across assignments" />
          </div>
          <section className={`${panelClass} p-4`}>
            <SectionTitle icon={<GraduationCap size={14} />} title="Grading and delivery" />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <CountCard label="Missing" value={student.missingAssignmentIds.length} tone="error" />
              <CountCard label="Late deliveries" value={student.lateCount} tone="warning" />
              <CountCard label="Graded assignments" value={student.gradedAssignments} tone="success" />
            </div>
          </section>
          <section className={`${panelClass} overflow-hidden`}>
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800/60"><SectionTitle icon={<CircleAlert size={14} />} title="Missing assignments" /><span className="font-mono text-[10px] text-gray-500">{student.missingAssignmentIds.length}</span></div>
            {student.missingAssignmentIds.length ? <ul className="divide-y divide-gray-100 dark:divide-gray-800/60">{student.missingAssignmentIds.map(id => <li key={id} className="flex items-center justify-between gap-3 px-4 py-3"><p className="min-w-0 truncate text-xs font-medium">{assignmentTitles.get(id) ?? "Assignment"}</p><StatusPill label="missing" tone="error" /></li>)}</ul> : <p className="p-5 text-center text-xs text-green-600 dark:text-green-400">No missing assignments.</p>}
          </section>
        </div> : tab === "grades" ? <section className={`${panelClass} overflow-hidden`}>
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800/60"><h3 className="text-sm font-semibold">Assignment grades</h3><p className="mt-1 text-xs text-gray-500">Current delivery, verdict, attempts, grade, and lifetime AI answers used.</p></div>
          {usageData?.error && <div className="px-4 pb-4"><ErrorNotice message="Assignment AI usage unavailable" onRetry={retry} label="Retry AI usage" /></div>}
          {!gradeData ? <div role="status" aria-label="Loading grades" className="p-4"><TeacherLoading rows={3} /></div> : gradeData.error ? <div className="p-4"><ErrorNotice message={gradeData.error} onRetry={retry} label="Retry grades" /></div> : gradeData.value?.length === 0 ? <p className="py-12 text-center text-sm text-gray-500">No assignments in this group.</p> : <div className="divide-y divide-gray-100 dark:divide-gray-800/60">{gradeData.value?.map(item => {
            const quota = usageData?.value?.get(item.assignmentId)?.quota;
            const url = `/teacher/grades?groupId=${encodeURIComponent(groupId)}&assignmentId=${encodeURIComponent(item.assignmentId)}&studentId=${encodeURIComponent(student.studentId)}`;
            return <article key={item.assignmentId} className="p-4">
              <div className="flex items-start justify-between gap-3"><h4 className="min-w-0 truncate text-sm font-medium">{item.title}</h4><StatusPill label={item.workStatus.replaceAll("_", " ")} tone={item.workStatus === "RETURNED" ? "success" : item.workStatus === "SUBMITTED" ? "warning" : "error"} /></div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <TinyMetric label="Verdict" value={item.verdict ?? "—"} />
                <TinyMetric label="Attempts" value={String(item.attempts)} />
                <TinyMetric label="Grade" value={item.grade ? `${item.grade.value} / ${item.grade.maxPoints}` : "Not graded"} />
                <TinyMetric label="AI answers used (lifetime)" value={!usageData ? "Loading…" : quota ? quota.usedLifetime.toLocaleString() : "Unavailable"} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3"><StatusPill label={item.grade?.status === "DRAFT" ? "Draft" : item.grade?.status === "RETURNED" ? "Returned" : "ungraded"} tone={item.grade?.status === "RETURNED" ? "success" : item.grade ? "warning" : "neutral"} /><Link to={url} className="text-[10px] font-medium text-azure hover:text-french dark:text-yellow" aria-label={`Review work for ${item.title}`}>Review work →</Link></div>
            </article>;
          })}</div>}
        </section> : <section className={`${panelClass} p-5`}>
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} className="text-azure dark:text-yellow" /> Student AI usage</h3><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">This student's questions in this group over the last 30 days.</p>
          {!summaryData ? <p role="status" className="mt-5 text-sm text-gray-500">Loading AI usage…</p> : summaryData.error ? <ErrorNotice message={summaryData.error} onRetry={retry} label="Retry AI usage" /> : e && <>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <CountCard label="Questions asked" value={e.requests} tone="info" />
              <CountCard label="Answers used" value={e.responses} tone="success" />
              <CountCard label="Without an answer" value={e.blocked + e.failed + e.cancelled} tone="error" />
              <CountCard label="In progress" value={e.pending} tone="warning" />
            </div>
            {e.requests === 0 && <p className="mt-4 text-sm text-gray-500">No AI questions in the last 30 days.</p>}
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
