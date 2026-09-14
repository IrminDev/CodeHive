import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  CircleAlert,
  Clock3,
  Cpu,
  GraduationCap,
  Languages,
  RefreshCw,
  Users,
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
  panelClass,
  StatusPill,
  TeacherLoading,
} from "./TeacherUI";
import { formatPercentage } from "./TeacherAnalyticsOverview";
import { VerdictBar } from "./TeacherAnalyticsExplorer";

type DrawerTab = "overview" | "students";

const LANGUAGE_COLOR: Record<Language, string> = {
  PYTHON: "bg-blue-500",
  JAVA: "bg-orange-500",
  CPP: "bg-purple-500",
  C: "bg-gray-500",
};

export function AssignmentAnalyticsDrawer({
  assignment,
  detail,
  groupId,
  loading,
  error,
  onClose,
  onRetry,
}: {
  assignment?: AssignmentMetrics;
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
              <p className="text-[10px] font-semibold uppercase tracking-widest text-azure dark:text-yellow">Assignment analytics</p>
              <h2 id="assignment-analytics-title" tabIndex={-1} autoFocus className="mt-1 truncate text-xl font-semibold outline-none">{current?.title ?? "Loading assignment…"}</h2>
              {current && <div className="mt-2 flex flex-wrap items-center gap-2"><StatusPill label={current.validationStatus} tone={current.validationStatus === "READY" ? "success" : current.validationStatus === "FAILED" ? "error" : "warning"} />{current.overdue && <StatusPill label="overdue" tone="error" />}<span className="text-[10px] font-mono text-gray-500">{current.maxPoints} pts</span></div>}
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

        <nav className="flex flex-shrink-0 border-b border-gray-200 px-4 dark:border-gray-700" role="tablist">
          <DrawerTabButton active={tab === "overview"} label="Overview" icon={<BarChart3 size={14} />} onClick={() => setTab("overview")} />
          <DrawerTabButton active={tab === "students"} label="Students" icon={<Users size={14} />} onClick={() => setTab("students")} />
        </nav>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading && !detail ? (
            <TeacherLoading rows={5} />
          ) : error ? (
            <DrawerError message={error} onRetry={onRetry} />
          ) : detail ? (
            tab === "overview" ? <AssignmentOverview detail={detail} /> : <AssignmentStudents detail={detail} groupId={groupId} />
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function AssignmentOverview({ detail }: { detail: AssignmentMetricsDetail }) {
  const accepted = detail.acceptedPerformance;
  const timeRatio = accepted.averageTimeMs == null || !accepted.timeLimitMs ? null : accepted.averageTimeMs / accepted.timeLimitMs * 100;
  const memoryRatio = accepted.averageMemoryMb == null || !accepted.memoryLimitMb ? null : accepted.averageMemoryMb / accepted.memoryLimitMb * 100;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DrawerMetric label="Submission" value={formatPercentage(detail.submissionRate)} detail={`${detail.submittedCount}/${detail.activeStudents}`} />
        <DrawerMetric label="On time" value={formatPercentage(detail.onTimeRate)} detail={`${detail.lateCount} late`} />
        <DrawerMetric label="Average" value={formatPercentage(detail.averageScore)} detail={detail.averagePoints == null ? "No grades" : `${detail.averagePoints.toFixed(1)} pts`} />
        <DrawerMetric label="Attempts" value={detail.averageAttempts == null ? "No data" : detail.averageAttempts.toFixed(2)} detail="Average per student" />
      </div>

      <section className={`${panelClass} p-4`}>
        <SectionTitle icon={<GraduationCap size={14} />} title="Grading and delivery" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CountCard label="Missing" value={detail.missingCount} tone="error" />
          <CountCard label="Late" value={detail.lateCount} tone="warning" />
          <CountCard label="Draft grades" value={detail.draftGrades} tone="info" />
          <CountCard label="Returned" value={detail.returnedGrades} tone="success" />
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Average delivery margin: <strong className={detail.averageDeliveryMarginHours != null && detail.averageDeliveryMarginHours < 0 ? "text-red-500" : "text-gray-800 dark:text-gray-200"}>{detail.averageDeliveryMarginHours == null ? "No data" : `${detail.averageDeliveryMarginHours.toFixed(1)} hours ${detail.averageDeliveryMarginHours >= 0 ? "early" : "late"}`}</strong>
        </p>
      </section>

      <section className={`${panelClass} p-4`}>
        <SectionTitle icon={<BarChart3 size={14} />} title="Verdict distribution" />
        <div className="mt-4"><VerdictBar distribution={detail.verdictDistribution} /></div>
      </section>

      <section className={`${panelClass} p-4`}>
        <SectionTitle icon={<Languages size={14} />} title="Language distribution" />
        <div className="mt-4 space-y-3"><DistributionRows values={detail.languageDistribution} colors={LANGUAGE_COLOR} /></div>
      </section>

      <section className={`${panelClass} p-4`}>
        <SectionTitle icon={<Cpu size={14} />} title="Accepted solution performance" />
        <div className="mt-4 space-y-4">
          <ResourceBar icon={<Clock3 size={13} />} label="Execution time" value={accepted.averageTimeMs} limit={accepted.timeLimitMs} unit="ms" ratio={timeRatio} />
          <ResourceBar icon={<Cpu size={13} />} label="Memory" value={accepted.averageMemoryMb} limit={accepted.memoryLimitMb} unit="MB" ratio={memoryRatio} />
        </div>
      </section>

      <section className={`${panelClass} overflow-hidden`}>
        <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800/60"><SectionTitle icon={<Users size={14} />} title={`Missing students (${detail.missingStudents.length})`} /></div>
        {detail.missingStudents.length === 0 ? <p className="p-5 text-center text-xs text-green-600 dark:text-green-400">Every active student has submitted.</p> : <div className="divide-y divide-gray-100 dark:divide-gray-800/60">{detail.missingStudents.map((student) => <div key={student.studentId} className="flex items-center justify-between gap-3 px-4 py-3"><div className="min-w-0"><p className="truncate text-xs font-medium">{student.fullName}</p><p className="text-[10px] font-mono text-gray-500">{student.enrollmentNumber}</p></div><StatusPill label="missing" tone="error" /></div>)}</div>}
      </section>
    </div>
  );
}

function AssignmentStudents({ detail, groupId }: { detail: AssignmentMetricsDetail; groupId: string }) {
  if (!detail.perStudent.length) return <p className="py-12 text-center text-sm text-gray-500">No active students.</p>;
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800/60"><h3 className="text-sm font-semibold">Student breakdown</h3><p className="mt-1 text-xs text-gray-500">Current delivery, verdict, attempts, performance, and grade.</p></div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
        {detail.perStudent.map((student) => {
          const url = `/teacher/grades?groupId=${encodeURIComponent(groupId)}&assignmentId=${encodeURIComponent(detail.assignmentId)}&studentId=${encodeURIComponent(student.studentId)}`;
          return (
            <article key={student.studentId} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-sm font-medium">{student.fullName}</p><p className="text-[10px] font-mono text-gray-500">{student.enrollmentNumber}</p></div>
                <StatusPill label={student.workStatus.replaceAll("_", " ")} tone={workTone(student.workStatus)} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <TinyMetric label="Verdict" value={student.verdict ?? "—"} />
                <TinyMetric label="Attempts" value={String(student.attempts)} />
                <TinyMetric label="Time" value={student.timeMs == null ? "—" : `${student.timeMs} ms`} />
                <TinyMetric label="Memory" value={student.memoryMb == null ? "—" : `${student.memoryMb.toFixed(1)} MB`} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">{student.deliveredLate && <StatusPill label="late" tone="warning" />}{student.grade ? <StatusPill label={`${student.grade.value}/${student.grade.maxPoints} · ${student.grade.status}`} tone={student.grade.status === "RETURNED" ? "success" : "warning"} /> : <StatusPill label="ungraded" tone="neutral" />}</div>
                <Link to={url} className="text-[10px] font-medium text-azure hover:text-french dark:text-yellow">Review work →</Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DistributionRows<T extends string>({ values, colors }: { values: Partial<Record<T, number>>; colors: Record<T, string> }) {
  const rows = Object.entries(values) as Array<[T, number]>;
  const total = rows.reduce((sum, [, value]) => sum + value, 0);
  if (!total) return <p className="text-xs text-gray-500">No distribution data.</p>;
  return <>{rows.sort((left, right) => right[1] - left[1]).map(([label, value]) => <div key={label}><div className="mb-1 flex justify-between text-[10px]"><span className="font-mono">{label}</span><span className="text-gray-500">{value} · {((value / total) * 100).toFixed(1)}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-surface"><div className={`h-full rounded-full ${colors[label]}`} style={{ width: `${(value / total) * 100}%` }} /></div></div>)}</>;
}

function ResourceBar({ icon, label, value, limit, unit, ratio }: { icon: ReactNode; label: string; value: number | null; limit: number; unit: string; ratio: number | null }) {
  return <div><div className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-1.5 text-gray-500">{icon}{label}</span><span className="font-mono">{value == null ? "No accepted data" : `${value.toFixed(1)} ${unit} / ${limit} ${unit}`}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-surface"><div className={`h-full rounded-full ${ratio != null && ratio > 80 ? "bg-orange-500" : "bg-green-500"}`} style={{ width: `${Math.min(100, Math.max(0, ratio ?? 0))}%` }} /></div></div>;
}

function DrawerMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-dark-surface"><p className="text-[10px] text-gray-500">{label}</p><p className="mt-1 text-lg font-bold">{value}</p><p className="mt-1 text-[10px] text-gray-400">{detail}</p></div>;
}

function CountCard({ label, value, tone }: { label: string; value: number; tone: "error" | "warning" | "info" | "success" }) {
  const style = { error: "text-red-500 bg-red-500/5", warning: "text-orange-500 bg-orange-500/5", info: "text-azure dark:text-yellow bg-azure/5 dark:bg-yellow/5", success: "text-green-600 dark:text-green-400 bg-green-500/5" }[tone];
  return <div className={`rounded-xl p-3 ${style}`}><p className="text-[10px]">{label}</p><p className="mt-1 text-lg font-bold font-mono">{value}</p></div>;
}

function TinyMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-dark-surface"><p className="text-[9px] uppercase tracking-wide text-gray-400">{label}</p><p className="mt-1 truncate text-[10px] font-mono font-medium">{value}</p></div>;
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"><span className="text-azure dark:text-yellow">{icon}</span>{title}</h3>;
}

function DrawerTabButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: ReactNode; onClick: () => void }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-medium ${active ? "border-azure text-azure dark:border-yellow dark:text-yellow" : "border-transparent text-gray-500"}`}>{icon}{label}</button>;
}

function DrawerError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"><CircleAlert size={26} className="mx-auto text-red-500" /><h3 className="mt-3 font-semibold">Could not load assignment analytics</h3><p className="mt-1 text-sm text-gray-500">{message}</p><button onClick={onRetry} className={compactButtonClass + " mt-5"}><RefreshCw size={13} /> Retry</button></div>;
}

function workTone(value: string): "success" | "warning" | "error" | "neutral" {
  if (value === "RETURNED") return "success";
  if (value === "SUBMITTED") return "warning";
  if (value === "NOT_SUBMITTED" || value === "WITHDRAWN") return "error";
  return "neutral";
}
