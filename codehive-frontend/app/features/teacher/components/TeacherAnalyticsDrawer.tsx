import type { UsageRow } from "~/features/assistant-usage/types";
import { AssignmentAiUsage } from "./TeacherAiUsage";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  CircleAlert,
  GraduationCap,
  RefreshCw,
  X,
} from "lucide-react";
import { Link } from "react-router";

import type { Language } from "../types/assignment.types";
import type {
  AssignmentMetrics,
  AssignmentMetricsDetail,
} from "../types/metrics.types";
import {
  compactButtonClass,
  StatusPill,
  TeacherLoading,
} from "./TeacherUI";
import { formatPercentage, VerdictList } from "./TeacherAnalyticsOverview";

type DrawerTab = "overview" | "students" | "ai";

const LANGUAGE_LABEL: Record<Language, string> = { PYTHON: "Python", JAVA: "Java", CPP: "C++", C: "C" };

export function AssignmentAnalyticsDrawer({
  assignment,
  aiUsage,
  aiUsageLoading,
  aiUsageUnavailable,
  onRetryAiUsage,
  onOpenStudent,
  detail,
  groupId,
  loading,
  error,
  onClose,
  onRetry,
}: {
  assignment?: AssignmentMetrics;
  aiUsage?: UsageRow;
  aiUsageLoading: boolean;
  aiUsageUnavailable: boolean;
  onRetryAiUsage: () => void;
  onOpenStudent: (studentId: string) => void;
  detail: AssignmentMetricsDetail | null;
  groupId: string;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onRetry: () => void;
}) {
  const [tab, setTab] = useState<DrawerTab>("overview");
  const open = Boolean(assignment || detail || loading || error);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open, onClose]);

  useEffect(() => { setTab("overview"); }, [assignment?.assignmentId]);

  if (!open) return null;
  const current = detail ?? assignment;
  const gradeUrl = current
    ? `/teacher/grades?groupId=${encodeURIComponent(groupId)}&assignmentId=${encodeURIComponent(current.assignmentId)}`
    : `/teacher/grades?groupId=${encodeURIComponent(groupId)}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-dark-bg/45 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="assignment-analytics-title">
      <button type="button" aria-label="Close assignment analytics" onClick={onClose} className="absolute inset-0 cursor-default" />
      <aside className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-dark-card">
        <header className="flex-shrink-0 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-azure dark:text-yellow">Assignment analytics</p>
              <h2 id="assignment-analytics-title" tabIndex={-1} autoFocus className="mt-1 truncate text-xl font-semibold outline-none">{current?.title ?? "Loading assignment…"}</h2>
              {current && <div className="mt-2 flex flex-wrap items-center gap-2"><StatusPill label={current.validationStatus} tone={current.validationStatus === "READY" ? "success" : current.validationStatus === "FAILED" ? "error" : "warning"} />{current.overdue && <StatusPill label="overdue" tone="error" />}<span className="text-xs text-gray-500 dark:text-gray-400">{current.maxPoints} pts</span></div>}
            </div>
            <button type="button" onClick={onClose} className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-dark-surface dark:hover:text-gray-200" aria-label="Close"><X size={17} /></button>
          </div>
          {current && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={gradeUrl} className="inline-flex items-center gap-1.5 rounded-lg bg-azure px-3 py-2 text-xs font-semibold text-white hover:bg-french"><GraduationCap size={13} /> Open gradebook</Link>
              <Link to={`/teacher/assignments/${current.assignmentId}/preview`} className={compactButtonClass}>Preview assignment</Link>
            </div>
          )}
        </header>

        <nav className="flex flex-shrink-0 gap-1 border-b border-gray-200 px-4 dark:border-gray-700" role="tablist" aria-label="Assignment analytics sections">
          <DrawerTabButton active={tab === "overview"} label="Overview" onClick={() => setTab("overview")} />
          <DrawerTabButton active={tab === "students"} label="Students" onClick={() => setTab("students")} />
          <DrawerTabButton active={tab === "ai"} label="AI usage" onClick={() => setTab("ai")} />
        </nav>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {tab === "ai" ? (
            <AssignmentAiUsage row={aiUsage} loading={aiUsageLoading} unavailable={aiUsageUnavailable} onRetry={onRetryAiUsage} />
          ) : loading && !detail ? (
            <TeacherLoading rows={5} />
          ) : error ? (
            <DrawerError message={error} onRetry={onRetry} />
          ) : detail ? (
            tab === "overview" ? <AssignmentOverview detail={detail} /> : <AssignmentStudents detail={detail} groupId={groupId} onOpenStudent={onOpenStudent} />
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function AssignmentOverview({ detail }: { detail: AssignmentMetricsDetail }) {
  const accepted = detail.acceptedPerformance;
  const margin = detail.averageDeliveryMarginHours;
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700/60">
      <div className="pb-5">
        <DrawerStatGrid>
          <DrawerMetric label="Submitted" value={formatPercentage(detail.submissionRate)} detail={`${detail.submittedCount} of ${detail.activeStudents} students`} />
          <DrawerMetric label="On time" value={formatPercentage(detail.onTimeRate)} detail={`${detail.lateCount} late`} />
          <DrawerMetric label="Average score" value={formatPercentage(detail.averageScore)} detail={detail.averagePoints == null ? "No grades" : `${Number(detail.averagePoints.toFixed(1))} of ${detail.maxPoints} pts`} />
          <DrawerMetric label="Attempts" value={detail.averageAttempts == null ? "No data" : String(Number(detail.averageAttempts.toFixed(1)))} detail="Average per student" />
        </DrawerStatGrid>
      </div>

      <DrawerSection title="Grading and delivery">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <CountCard label="Missing" value={detail.missingCount} tone="error" />
          <CountCard label="Late" value={detail.lateCount} tone="warning" />
          <CountCard label="Draft grades" value={detail.draftGrades} tone="info" />
          <CountCard label="Returned" value={detail.returnedGrades} tone="success" />
        </dl>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Average delivery margin: <strong className="font-semibold text-gray-900 dark:text-gray-100">{margin == null ? "No data" : `${Math.abs(margin).toFixed(1)} hours ${margin >= 0 ? "before" : "after"} the due date`}</strong>
        </p>
      </DrawerSection>

      <DrawerSection title="Verdicts of current submissions">
        <VerdictList distribution={detail.verdictDistribution} />
      </DrawerSection>

      <DrawerSection title="Languages used">
        <LanguageRows values={detail.languageDistribution} />
      </DrawerSection>

      <DrawerSection title="Accepted solutions against the limits">
        <div className="space-y-4">
          <ResourceBar label="Execution time" value={accepted.averageTimeMs} limit={accepted.timeLimitMs} unit="ms" />
          <ResourceBar label="Memory" value={accepted.averageMemoryMb} limit={accepted.memoryLimitMb} unit="MB" />
        </div>
      </DrawerSection>

      <DrawerSection title={`Missing students (${detail.missingStudents.length})`}>
        {detail.missingStudents.length === 0
          ? <p className="text-sm text-gray-600 dark:text-gray-300">Every active student has submitted.</p>
          : <ul className="divide-y divide-gray-100 dark:divide-gray-800/60">{detail.missingStudents.map((student) => <li key={student.studentId} className="flex items-baseline justify-between gap-3 py-2"><span className="min-w-0 truncate text-sm">{student.fullName}</span><span className="shrink-0 font-mono text-xs text-gray-500 dark:text-gray-400">{student.enrollmentNumber}</span></li>)}</ul>}
      </DrawerSection>
    </div>
  );
}

function AssignmentStudents({ detail, groupId, onOpenStudent }: { detail: AssignmentMetricsDetail; groupId: string; onOpenStudent: (studentId: string) => void }) {
  if (!detail.perStudent.length) return <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">No active students.</p>;
  return (
    <ul aria-label="Student breakdown" className="divide-y divide-gray-200 dark:divide-gray-700/60">
      {detail.perStudent.map((student) => {
        const url = `/teacher/grades?groupId=${encodeURIComponent(groupId)}&assignmentId=${encodeURIComponent(detail.assignmentId)}&studentId=${encodeURIComponent(student.studentId)}`;
        return (
          <li key={student.studentId} className="py-4 first:pt-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <button type="button" onClick={() => onOpenStudent(student.studentId)} className="max-w-full truncate rounded text-left text-sm font-medium text-gray-900 hover:text-azure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:text-gray-100 dark:hover:text-yellow dark:focus-visible:ring-yellow">{student.fullName}</button>
                <p className="font-mono text-xs text-gray-500 dark:text-gray-400">{student.enrollmentNumber}</p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                {student.deliveredLate && <StatusPill label="late" tone="warning" />}
                <StatusPill label={student.workStatus.replaceAll("_", " ")} tone={workTone(student.workStatus)} />
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-5">
              <TinyMetric label="Verdict" value={student.verdict ?? "—"} />
              <TinyMetric label="Attempts" value={String(student.attempts)} />
              <TinyMetric label="Time" value={student.timeMs == null ? "—" : `${student.timeMs} ms`} />
              <TinyMetric label="Memory" value={student.memoryMb == null ? "—" : `${student.memoryMb.toFixed(1)} MB`} />
              <TinyMetric label="Grade" value={student.grade ? `${student.grade.value}/${student.grade.maxPoints}${student.grade.status === "DRAFT" ? " (draft)" : ""}` : "Not graded"} />
            </dl>
            <Link to={url} className="mt-3 inline-flex items-center gap-1 rounded text-xs font-medium text-azure underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:text-yellow dark:focus-visible:ring-yellow">Review work<ArrowRight size={12} aria-hidden="true" /></Link>
          </li>
        );
      })}
    </ul>
  );
}

function LanguageRows({ values }: { values: Partial<Record<Language, number>> }) {
  const rows = (Object.entries(values) as Array<[Language, number]>).filter(([, value]) => value > 0).sort((left, right) => right[1] - left[1]);
  const total = rows.reduce((sum, [, value]) => sum + value, 0);
  if (!total) return <p className="text-sm text-gray-500 dark:text-gray-400">No submissions yet.</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map(([language, value]) => {
        const share = value / total * 100;
        return (
          <li key={language} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 text-xs sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto]">
            <span className="truncate text-gray-700 dark:text-gray-300">{LANGUAGE_LABEL[language] ?? language}</span>
            <span aria-hidden="true" className="order-last col-span-2 h-2 overflow-hidden rounded-full bg-azure/15 dark:bg-yellow/15 sm:order-none sm:col-span-1"><span className="block h-full rounded-full bg-azure dark:bg-yellow" style={{ width: `${share}%` }} /></span>
            <span className="text-right tabular-nums text-gray-500 dark:text-gray-400"><strong className="font-semibold text-gray-900 dark:text-gray-100">{value}</strong> · {share.toFixed(0)}%</span>
          </li>
        );
      })}
    </ul>
  );
}

/** The fill turns orange once the average uses more than 80% of the limit. */
function ResourceBar({ label, value, limit, unit }: { label: string; value: number | null; limit: number; unit: string }) {
  const ratio = value == null || !limit ? null : Math.min(100, Math.max(0, value / limit * 100));
  const close = ratio != null && ratio > 80;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <span className="tabular-nums text-gray-500 dark:text-gray-400">{value == null ? "No accepted solutions yet" : <><strong className="font-semibold text-gray-900 dark:text-gray-100">{Number(value.toFixed(1))} {unit}</strong> of {limit} {unit}{close && " · close to the limit"}</>}</span>
      </div>
      <div role="progressbar" aria-label={`${label} used by accepted solutions`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={ratio == null ? undefined : Math.round(ratio)}
        className={`mt-2 h-2 overflow-hidden rounded-full ${close ? "bg-orange-500/20" : "bg-azure/15 dark:bg-yellow/15"}`}>
        <div className={`h-full rounded-full ${close ? "bg-orange-500" : "bg-azure dark:bg-yellow"}`} style={{ width: `${ratio ?? 0}%` }} />
      </div>
    </div>
  );
}

export function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="py-5 last:pb-0"><h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>{children}</section>;
}

/** Hairline-separated stat band; fill it with DrawerMetric cells. */
export function DrawerStatGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 dark:border-gray-700 dark:bg-gray-700 sm:grid-cols-4">{children}</dl>;
}

export function DrawerMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="bg-white p-3.5 dark:bg-dark-card"><dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt><dd className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{value}</dd><dd className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{detail}</dd></div>;
}

/** A plain count; the dot carries the tone and the label always names it. */
export function CountCard({ label, value, tone }: { label: string; value: number; tone: "error" | "warning" | "info" | "success" }) {
  const dot = { error: "bg-red-500", warning: "bg-orange-500", info: "bg-azure dark:bg-yellow", success: "bg-green-500" }[tone];
  return <div><dt className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"><span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${value > 0 ? dot : "bg-gray-300 dark:bg-gray-600"}`} />{label}</dt><dd className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{value.toLocaleString()}</dd></div>;
}

export function TinyMetric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-[11px] text-gray-500 dark:text-gray-400">{label}</dt><dd className="mt-0.5 truncate text-xs font-medium tabular-nums text-gray-900 dark:text-gray-100">{value}</dd></div>;
}

export function DrawerTabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`-mb-px border-b-2 px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-azure dark:focus-visible:ring-yellow ${active ? "border-azure text-azure dark:border-yellow dark:text-yellow" : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"}`}>{label}</button>;
}

function DrawerError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"><CircleAlert size={26} aria-hidden="true" className="mx-auto text-red-500" /><h3 className="mt-3 font-semibold">Could not load assignment analytics</h3><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p><button type="button" onClick={onRetry} className={compactButtonClass + " mt-5"}><RefreshCw size={13} aria-hidden="true" /> Retry</button></div>;
}

function workTone(value: string): "success" | "warning" | "error" | "neutral" {
  if (value === "RETURNED") return "success";
  if (value === "SUBMITTED") return "warning";
  if (value === "NOT_SUBMITTED" || value === "WITHDRAWN") return "error";
  return "neutral";
}
