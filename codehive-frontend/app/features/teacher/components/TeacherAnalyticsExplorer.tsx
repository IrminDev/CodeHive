import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  GraduationCap,
  Search,
  Users,
} from "lucide-react";
import { Link } from "react-router";

import type {
  AssignmentMetrics,
  ExecutionStatus,
  StudentMetrics,
} from "../types/metrics.types";
import {
  compactButtonClass,
  inputClass,
  panelClass,
  StatusPill,
  TeacherEmpty,
} from "./TeacherUI";
import { formatPercentage } from "./TeacherAnalyticsOverview";

export type AnalyticsTab = "assignments" | "students";
export type AssignmentAnalyticsFilter = "all" | "attention" | "overdue" | "grading";
export type AssignmentAnalyticsSort = "attention" | "title" | "completion" | "missing";
export type StudentAnalyticsFilter = "all" | "missing" | "late" | "ungraded" | "complete";
export type StudentAnalyticsSort = "risk" | "name" | "completion" | "score";

const VERDICT_ORDER: ExecutionStatus[] = ["AC", "WA", "TLE", "MLE", "RTE", "CE", "OLE", "PENDING"];
const VERDICT_COLOR: Record<ExecutionStatus, string> = {
  AC: "bg-green-500",
  WA: "bg-red-500",
  TLE: "bg-orange-500",
  MLE: "bg-purple-500",
  RTE: "bg-red-700",
  CE: "bg-yellow",
  OLE: "bg-pink-500",
  PENDING: "bg-azure dark:bg-yellow",
};

export function AnalyticsTabs({
  value,
  assignments,
  students,
  onChange,
}: {
  value: AnalyticsTab;
  assignments: number;
  students: number;
  onChange: (value: AnalyticsTab) => void;
}) {
  return (
    <div className={`${panelClass} mb-4 flex gap-1 p-1`} role="tablist" aria-label="Analytics sections">
      <TabButton active={value === "assignments"} onClick={() => onChange("assignments")} icon={<CalendarClock size={14} />} label="Assignments" count={assignments} />
      <TabButton active={value === "students"} onClick={() => onChange("students")} icon={<Users size={14} />} label="Students" count={students} />
    </div>
  );
}

export function AssignmentExplorer({
  assignments,
  query,
  filter,
  sort,
  error,
  onQuery,
  onFilter,
  onSort,
  onOpen,
  onRetry,
}: {
  assignments: AssignmentMetrics[];
  query: string;
  filter: AssignmentAnalyticsFilter;
  sort: AssignmentAnalyticsSort;
  error?: string;
  onQuery: (value: string) => void;
  onFilter: (value: AssignmentAnalyticsFilter) => void;
  onSort: (value: AssignmentAnalyticsSort) => void;
  onOpen: (assignmentId: string) => void;
  onRetry: () => void;
}) {
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <ExplorerHeader
        title="Assignment performance"
        description="Completion, punctuality, grading, and verdict health by assignment."
        query={query}
        queryPlaceholder="Search assignments…"
        filter={filter}
        sort={sort}
        onQuery={onQuery}
        onFilter={(value) => onFilter(value as AssignmentAnalyticsFilter)}
        onSort={(value) => onSort(value as AssignmentAnalyticsSort)}
        filters={[
          ["all", "All assignments"],
          ["attention", "Needs attention"],
          ["overdue", "Overdue"],
          ["grading", "Pending grading"],
        ]}
        sorts={[
          ["attention", "Attention first"],
          ["title", "Title A–Z"],
          ["completion", "Highest completion"],
          ["missing", "Most missing"],
        ]}
      />
      {error ? (
        <SectionError message={error} onRetry={onRetry} />
      ) : assignments.length === 0 ? (
        <TeacherEmpty
          title={query || filter !== "all" ? "No matching assignments" : "No assignment metrics"}
          description={query || filter !== "all" ? "Change search or filter criteria." : "Published assignment performance appears here."}
        />
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
          {assignments.map((item) => (
            <AssignmentAnalyticsRow key={item.assignmentId} item={item} onOpen={() => onOpen(item.assignmentId)} />
          ))}
        </div>
      )}
    </section>
  );
}

export function StudentExplorer({
  students,
  query,
  filter,
  sort,
  groupId,
  assignmentTitles,
  error,
  onQuery,
  onFilter,
  onSort,
  onRetry,
}: {
  students: StudentMetrics[];
  query: string;
  filter: StudentAnalyticsFilter;
  sort: StudentAnalyticsSort;
  groupId: string;
  assignmentTitles: Map<string, string>;
  error?: string;
  onQuery: (value: string) => void;
  onFilter: (value: StudentAnalyticsFilter) => void;
  onSort: (value: StudentAnalyticsSort) => void;
  onRetry: () => void;
}) {
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <ExplorerHeader
        title="Student performance"
        description="Completion, score, punctuality, attempts, and missing work by student."
        query={query}
        queryPlaceholder="Name or enrollment…"
        filter={filter}
        sort={sort}
        onQuery={onQuery}
        onFilter={(value) => onFilter(value as StudentAnalyticsFilter)}
        onSort={(value) => onSort(value as StudentAnalyticsSort)}
        filters={[
          ["all", "All students"],
          ["missing", "Missing work"],
          ["late", "Late work"],
          ["ungraded", "Ungraded work"],
          ["complete", "Complete"],
        ]}
        sorts={[
          ["risk", "Risk first"],
          ["name", "Name A–Z"],
          ["completion", "Highest completion"],
          ["score", "Highest score"],
        ]}
      />
      {error ? (
        <SectionError message={error} onRetry={onRetry} />
      ) : students.length === 0 ? (
        <TeacherEmpty
          title={query || filter !== "all" ? "No matching students" : "No active students"}
          description={query || filter !== "all" ? "Change search or filter criteria." : "Active student performance appears here."}
        />
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
          {students.map((student) => (
            <StudentAnalyticsRow
              key={student.studentId}
              student={student}
              groupId={groupId}
              assignmentTitles={assignmentTitles}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function assignmentNeedsAttention(item: AssignmentMetrics): boolean {
  const ungraded = Math.max(0, item.submittedCount - item.draftGrades - item.returnedGrades);
  return item.validationStatus !== "READY"
    || (item.overdue && item.missingCount > 0)
    || (item.verdictDistribution.PENDING ?? 0) > 0
    || ungraded > 0;
}

function AssignmentAnalyticsRow({ item, onOpen }: { item: AssignmentMetrics; onOpen: () => void }) {
  const ungraded = Math.max(0, item.submittedCount - item.draftGrades - item.returnedGrades);
  const tone = item.validationStatus === "READY" ? "success" : item.validationStatus === "FAILED" ? "error" : "warning";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full p-4 text-left transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-azure dark:hover:bg-dark-card/40 dark:focus:ring-yellow sm:p-5"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="min-w-0 xl:w-[28%]">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold group-hover:text-azure dark:group-hover:text-yellow">{item.title}</h3>
            <StatusPill label={item.validationStatus} tone={tone} />
            {item.overdue && item.missingCount > 0 && <StatusPill label="overdue" tone="error" />}
          </div>
          <p className="mt-1 text-[10px] font-mono text-gray-500">
            {item.dueDate ? `Due ${formatDate(item.dueDate)}` : "No due date"} · {item.maxPoints} pts
          </p>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricProgress label="Submitted" value={item.submissionRate} detail={`${item.submittedCount}/${item.activeStudents}`} />
          <MetricProgress label="On time" value={item.onTimeRate} detail={`${item.lateCount} late`} tone="orange" />
          <MetricProgress label="Average" value={item.averageScore} detail={item.averagePoints == null ? "No grades" : `${item.averagePoints.toFixed(1)} pts`} tone="purple" />
          <div className="rounded-xl bg-gray-50 p-3 dark:bg-dark-card">
            <p className="text-[10px] text-gray-500">Work queue</p>
            <p className="mt-1 text-sm font-semibold font-mono">{item.missingCount} missing</p>
            <p className="text-[10px] text-gray-400">{ungraded} ungraded · {item.draftGrades} drafts</p>
          </div>
        </div>

        <div className="xl:w-48">
          <VerdictBar distribution={item.verdictDistribution} />
          <span className="mt-2 flex items-center justify-end gap-1 text-[10px] font-medium text-gray-400 group-hover:text-azure dark:group-hover:text-yellow">
            View details <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </button>
  );
}

function StudentAnalyticsRow({ student, groupId, assignmentTitles }: { student: StudentMetrics; groupId: string; assignmentTitles: Map<string, string> }) {
  const missing = student.missingAssignmentIds.map((id) => ({ id, title: assignmentTitles.get(id) ?? "Assignment" }));
  const firstMissing = missing[0];
  const gradeLink = firstMissing
    ? `/teacher/grades?groupId=${encodeURIComponent(groupId)}&assignmentId=${encodeURIComponent(firstMissing.id)}&studentId=${encodeURIComponent(student.studentId)}`
    : `/teacher/grades?groupId=${encodeURIComponent(groupId)}`;
  const risk = missing.length > 0 || student.lateCount > 0;
  return (
    <article className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="min-w-0 xl:w-[28%]">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-azure/10 text-xs font-bold text-azure dark:bg-yellow/10 dark:text-yellow">
              {initials(student.fullName)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-semibold">{student.fullName}</h3>
                <StatusPill label={risk ? "attention" : "on track"} tone={risk ? "warning" : "success"} />
              </div>
              <p className="text-[10px] font-mono text-gray-500">{student.enrollmentNumber}</p>
            </div>
          </div>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricProgress label="Completion" value={student.completionRate} detail={`${student.submittedCount}/${student.publishedAssignments}`} />
          <MetricProgress label="Average" value={student.averageScore} detail={`${student.gradedAssignments} graded`} tone="purple" />
          <SmallMetric icon={<Clock3 size={12} />} label="Late" value={String(student.lateCount)} />
          <SmallMetric icon={<CheckCircle2 size={12} />} label="Attempts" value={String(student.totalAttempts)} />
        </div>
        <div className="xl:w-64">
          {missing.length ? (
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-2">
              <p className="text-[10px] font-semibold text-orange-500">{missing.length} missing</p>
              <p className="mt-0.5 truncate text-[10px] text-gray-500" title={missing.map((item) => item.title).join(", ")}>{missing.slice(0, 2).map((item) => item.title).join(" · ")}{missing.length > 2 ? ` +${missing.length - 2}` : ""}</p>
            </div>
          ) : (
            <p className="text-xs text-green-600 dark:text-green-400">No missing assignments</p>
          )}
          <Link to={gradeLink} className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-azure hover:text-french dark:text-yellow">
            <GraduationCap size={12} /> Review grades
          </Link>
        </div>
      </div>
    </article>
  );
}

function ExplorerHeader({ title, description, query, queryPlaceholder, filter, sort, filters, sorts, onQuery, onFilter, onSort }: {
  title: string;
  description: string;
  query: string;
  queryPlaceholder: string;
  filter: string;
  sort: string;
  filters: Array<[string, string]>;
  sorts: Array<[string, string]>;
  onQuery: (value: string) => void;
  onFilter: (value: string) => void;
  onSort: (value: string) => void;
}) {
  return (
    <header className="border-b border-gray-100 p-4 dark:border-gray-800/60 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p></div>
        <div className="grid gap-2 sm:grid-cols-[minmax(190px,1fr)_160px_170px]">
          <span className="relative"><Search size={13} className="absolute left-3 top-3 text-gray-400" /><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder={queryPlaceholder} className={`${inputClass} py-2 pl-8 text-xs`} /></span>
          <select value={filter} onChange={(event) => onFilter(event.target.value)} aria-label="Filter analytics" className={`${inputClass} py-2 text-xs`}>{filters.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select value={sort} onChange={(event) => onSort(event.target.value)} aria-label="Sort analytics" className={`${inputClass} py-2 text-xs`}>{sorts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </div>
      </div>
    </header>
  );
}

function MetricProgress({ label, value, detail, tone = "blue" }: { label: string; value: number | null; detail: string; tone?: "blue" | "orange" | "purple" }) {
  const color = tone === "orange" ? "bg-orange-500" : tone === "purple" ? "bg-purple-500" : "bg-azure dark:bg-yellow";
  return (
    <div className="rounded-xl bg-gray-50 p-3 dark:bg-dark-card">
      <div className="flex justify-between gap-2"><p className="text-[10px] text-gray-500">{label}</p><strong className="text-[10px] font-mono">{formatPercentage(value)}</strong></div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"><div className={`h-full rounded-full ${color}`} style={{ width: `${clamp(value ?? 0)}%` }} /></div>
      <p className="mt-1.5 text-[10px] text-gray-400">{detail}</p>
    </div>
  );
}

function SmallMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-xl bg-gray-50 p-3 dark:bg-dark-card"><p className="flex items-center gap-1 text-[10px] text-gray-500">{icon}{label}</p><p className="mt-1 text-sm font-semibold font-mono">{value}</p></div>;
}

export function VerdictBar({ distribution }: { distribution: Partial<Record<ExecutionStatus, number>> }) {
  const total = VERDICT_ORDER.reduce((sum, status) => sum + (distribution[status] ?? 0), 0);
  if (!total) return <p className="text-[10px] text-gray-400">No verdicts yet</p>;
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-card" title={VERDICT_ORDER.filter((status) => distribution[status]).map((status) => `${status}: ${distribution[status]}`).join(" · ")}>
        {VERDICT_ORDER.map((status) => distribution[status] ? <span key={status} className={VERDICT_COLOR[status]} style={{ width: `${((distribution[status] ?? 0) / total) * 100}%` }} /> : null)}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1">{VERDICT_ORDER.filter((status) => distribution[status]).slice(0, 4).map((status) => <span key={status} className="inline-flex items-center gap-1 text-[9px] font-mono text-gray-400"><span className={`h-1.5 w-1.5 rounded-full ${VERDICT_COLOR[status]}`} />{status} {distribution[status]}</span>)}</div>
    </div>
  );
}

function TabButton({ active, icon, label, count, onClick }: { active: boolean; icon: ReactNode; label: string; count: number; onClick: () => void }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition-colors sm:flex-none ${active ? "bg-azure text-white dark:bg-yellow dark:text-imperial" : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-card"}`}>{icon}{label}<span className={`rounded-md px-1.5 py-0.5 font-mono text-[9px] ${active ? "bg-white/15" : "bg-gray-100 dark:bg-dark-card"}`}>{count}</span></button>;
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="p-8 text-center"><CircleAlert size={24} className="mx-auto text-red-500" /><p className="mt-2 text-sm font-medium">Could not load this section</p><p className="mt-1 text-xs text-gray-500">{message}</p><button onClick={onRetry} className={compactButtonClass + " mt-4"}>Try again</button></div>;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initials(value: string): string {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}
