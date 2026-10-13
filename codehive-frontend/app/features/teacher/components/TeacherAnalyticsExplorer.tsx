import { useEffect, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown, CircleAlert, Search } from "lucide-react";
import { Dropdown } from "~/shared/components/ui/Dropdown";

import type { AssignmentMetrics, StudentMetrics } from "../types/metrics.types";
import {
  compactButtonClass,
  inputClass,
  panelClass,
  StatusPill,
} from "./TeacherUI";
import { formatPercentage, Meter, plural, VERDICT_ORDER } from "./TeacherAnalyticsOverview";

export type AnalyticsTab = "assignments" | "students" | "ai";
export type AssignmentAnalyticsFilter = "all" | "attention" | "overdue" | "grading";
export type AssignmentSortKey = "priority" | "title" | "submitted" | "onTime" | "score" | "accepted" | "toGrade" | "missing";
export type StudentAnalyticsFilter = "all" | "missing" | "late" | "ungraded" | "complete";
export type StudentSortKey = "priority" | "name" | "completion" | "score" | "late" | "missing" | "attempts";
export interface SortState<Key extends string> { key: Key; descending: boolean }

export const PRIORITY_SORT = { key: "priority", descending: true } as const;
const PAGE_SIZE = 25;

/** Long tables open with one page of rows; the count resets whenever the view changes. */
function useRowLimit(resetKey: string) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  useEffect(() => { setLimit(PAGE_SIZE); }, [resetKey]);
  return [limit, setLimit] as const;
}

const headClass = "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400";
const cellClass = "px-4 py-3 align-middle";
const rowClass = "group cursor-pointer border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800/60 dark:hover:bg-dark-card/40";
const rowButtonClass = "max-w-full truncate rounded text-left text-sm font-medium text-gray-900 group-hover:text-azure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:text-gray-100 dark:group-hover:text-yellow dark:focus-visible:ring-yellow";

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
    <div role="tablist" aria-label="Analytics detail" className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-800/60">
      <TabButton active={value === "assignments"} onClick={() => onChange("assignments")} label="Assignments" count={assignments} />
      <TabButton active={value === "students"} onClick={() => onChange("students")} label="Students" count={students} />
      <TabButton active={value === "ai"} onClick={() => onChange("ai")} label="AI usage" />
    </div>
  );
}

export function AssignmentExplorer({
  assignments,
  total,
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
  total: number;
  query: string;
  filter: AssignmentAnalyticsFilter;
  sort: SortState<AssignmentSortKey>;
  error?: string;
  onQuery: (value: string) => void;
  onFilter: (value: AssignmentAnalyticsFilter) => void;
  onSort: (value: SortState<AssignmentSortKey>) => void;
  onOpen: (assignmentId: string) => void;
  onRetry: () => void;
}) {
  const filtered = Boolean(query) || filter !== "all";
  const [limit, setLimit] = useRowLimit(`${query}|${filter}|${sort.key}|${sort.descending}`);
  return (
    <section className={`${panelClass} overflow-hidden`} aria-label="Assignment performance">
      <ExplorerToolbar
        query={query}
        queryPlaceholder="Search assignments…"
        filter={filter}
        filters={[
          ["all", "All assignments"],
          ["attention", "Needs attention"],
          ["overdue", "Overdue"],
          ["grading", "Pending grading"],
        ]}
        summary={`${assignments.length}${filtered ? ` of ${total}` : ""} ${plural(filtered ? total : assignments.length, "assignment")}`}
        priorityLabel="Attention first"
        prioritized={sort.key === "priority"}
        onPrioritize={() => onSort(PRIORITY_SORT)}
        onQuery={onQuery}
        onFilter={(value) => onFilter(value as AssignmentAnalyticsFilter)}
      />
      {error ? (
        <SectionError message={error} onRetry={onRetry} />
      ) : assignments.length === 0 ? (
        <EmptyRows
          title={filtered ? "No matching assignments" : "No assignment metrics"}
          description={filtered ? "Change the search or filter." : "Published assignment performance appears here."}
        />
      ) : (
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <caption className="sr-only">Assignment performance. Select an assignment to open its details.</caption>
            <thead>
              <tr>
                <SortHeader label="Assignment" column="title" sort={sort} onSort={onSort} />
                <SortHeader label="Submitted" column="submitted" sort={sort} onSort={onSort} numeric />
                <SortHeader label="On time" column="onTime" sort={sort} onSort={onSort} numeric className="hidden lg:table-cell" />
                <SortHeader label="Avg. score" column="score" sort={sort} onSort={onSort} numeric className="hidden md:table-cell" />
                <SortHeader label="Accepted" column="accepted" sort={sort} onSort={onSort} numeric className="hidden xl:table-cell" />
                <SortHeader label="To grade" column="toGrade" sort={sort} onSort={onSort} numeric />
                <SortHeader label="Missing" column="missing" sort={sort} onSort={onSort} numeric />
                <th scope="col" className="w-8"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {assignments.slice(0, limit).map((item) => <AssignmentRow key={item.assignmentId} item={item} onOpen={() => onOpen(item.assignmentId)} />)}
            </tbody>
          </table>
        </div>
      )}
      {!error && <MoreRows shown={Math.min(limit, assignments.length)} total={assignments.length} noun="assignment" onShow={setLimit} />}
    </section>
  );
}

export function StudentExplorer({
  students,
  total,
  onOpen,
  query,
  filter,
  sort,
  error,
  onQuery,
  onFilter,
  onSort,
  onRetry,
}: {
  students: StudentMetrics[];
  total: number;
  onOpen: (studentId: string) => void;
  query: string;
  filter: StudentAnalyticsFilter;
  sort: SortState<StudentSortKey>;
  error?: string;
  onQuery: (value: string) => void;
  onFilter: (value: StudentAnalyticsFilter) => void;
  onSort: (value: SortState<StudentSortKey>) => void;
  onRetry: () => void;
}) {
  const filtered = Boolean(query) || filter !== "all";
  const [limit, setLimit] = useRowLimit(`${query}|${filter}|${sort.key}|${sort.descending}`);
  return (
    <section className={`${panelClass} overflow-hidden`} aria-label="Student performance">
      <ExplorerToolbar
        query={query}
        queryPlaceholder="Name or enrollment…"
        filter={filter}
        filters={[
          ["all", "All students"],
          ["missing", "Missing work"],
          ["late", "Late work"],
          ["ungraded", "Ungraded work"],
          ["complete", "Complete"],
        ]}
        summary={`${students.length}${filtered ? ` of ${total}` : ""} ${plural(filtered ? total : students.length, "student")}`}
        priorityLabel="At risk first"
        prioritized={sort.key === "priority"}
        onPrioritize={() => onSort(PRIORITY_SORT)}
        onQuery={onQuery}
        onFilter={(value) => onFilter(value as StudentAnalyticsFilter)}
      />
      {error ? (
        <SectionError message={error} onRetry={onRetry} />
      ) : students.length === 0 ? (
        <EmptyRows
          title={filtered ? "No matching students" : "No active students"}
          description={filtered ? "Change the search or filter." : "Active student performance appears here."}
        />
      ) : (
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <caption className="sr-only">Student performance. Select a student to open their details.</caption>
            <thead>
              <tr>
                <SortHeader label="Student" column="name" sort={sort} onSort={onSort} />
                <SortHeader label="Completion" column="completion" sort={sort} onSort={onSort} numeric />
                <SortHeader label="Avg. score" column="score" sort={sort} onSort={onSort} numeric className="hidden md:table-cell" />
                <SortHeader label="Missing" column="missing" sort={sort} onSort={onSort} numeric />
                <SortHeader label="Late" column="late" sort={sort} onSort={onSort} numeric />
                <SortHeader label="Attempts" column="attempts" sort={sort} onSort={onSort} numeric className="hidden lg:table-cell" />
                <th scope="col" className="w-8"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {students.slice(0, limit).map((student) => <StudentRow key={student.studentId} student={student} onOpen={() => onOpen(student.studentId)} />)}
            </tbody>
          </table>
        </div>
      )}
      {!error && <MoreRows shown={Math.min(limit, students.length)} total={students.length} noun="student" onShow={setLimit} />}
    </section>
  );
}

export function assignmentNeedsAttention(item: AssignmentMetrics): boolean {
  return item.validationStatus !== "READY"
    || (item.overdue && item.missingCount > 0)
    || (item.verdictDistribution.PENDING ?? 0) > 0
    || ungradedCount(item) > 0;
}

export function ungradedCount(item: AssignmentMetrics): number {
  return Math.max(0, item.submittedCount - item.draftGrades - item.returnedGrades);
}

function verdictTotal(item: AssignmentMetrics): number {
  return VERDICT_ORDER.reduce((sum, status) => sum + (item.verdictDistribution[status] ?? 0), 0);
}

function acceptedRate(item: AssignmentMetrics): number | null {
  const total = verdictTotal(item);
  return total === 0 ? null : (item.verdictDistribution.AC ?? 0) / total * 100;
}

function studentRisk(student: StudentMetrics): number {
  return student.missingAssignmentIds.length * 3 + student.lateCount + Math.max(0, student.submittedCount - student.gradedAssignments);
}

export function sortAssignments(items: AssignmentMetrics[], sort: SortState<AssignmentSortKey>): AssignmentMetrics[] {
  const byTitle = (left: AssignmentMetrics, right: AssignmentMetrics) => left.title.localeCompare(right.title);
  if (sort.key === "priority") {
    return [...items].sort((left, right) => Number(assignmentNeedsAttention(right)) - Number(assignmentNeedsAttention(left))
      || Number(right.overdue) - Number(left.overdue)
      || right.missingCount - left.missingCount
      || byTitle(left, right));
  }
  if (sort.key === "title") return [...items].sort((left, right) => sort.descending ? byTitle(right, left) : byTitle(left, right));
  const value: Record<Exclude<AssignmentSortKey, "priority" | "title">, (item: AssignmentMetrics) => number | null> = {
    submitted: (item) => item.submissionRate,
    onTime: (item) => item.onTimeRate,
    score: (item) => item.averageScore,
    accepted: acceptedRate,
    toGrade: ungradedCount,
    missing: (item) => item.missingCount,
  };
  return [...items].sort((left, right) => compareNullable(value[sort.key as keyof typeof value](left), value[sort.key as keyof typeof value](right), sort.descending) || byTitle(left, right));
}

export function sortStudents(items: StudentMetrics[], sort: SortState<StudentSortKey>): StudentMetrics[] {
  const byName = (left: StudentMetrics, right: StudentMetrics) => left.fullName.localeCompare(right.fullName);
  if (sort.key === "priority") return [...items].sort((left, right) => studentRisk(right) - studentRisk(left) || byName(left, right));
  if (sort.key === "name") return [...items].sort((left, right) => sort.descending ? byName(right, left) : byName(left, right));
  const value: Record<Exclude<StudentSortKey, "priority" | "name">, (student: StudentMetrics) => number | null> = {
    completion: (student) => student.completionRate,
    score: (student) => student.averageScore,
    late: (student) => student.lateCount,
    missing: (student) => student.missingAssignmentIds.length,
    attempts: (student) => student.totalAttempts,
  };
  return [...items].sort((left, right) => compareNullable(value[sort.key as keyof typeof value](left), value[sort.key as keyof typeof value](right), sort.descending) || byName(left, right));
}

/** Rows without data always sort last, whichever direction is chosen. */
function compareNullable(left: number | null, right: number | null, descending: boolean): number {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return descending ? right - left : left - right;
}

function AssignmentRow({ item, onOpen }: { item: AssignmentMetrics; onOpen: () => void }) {
  const ungraded = ungradedCount(item);
  const accepted = acceptedRate(item);
  const overdue = item.overdue && item.missingCount > 0;
  return (
    <tr onClick={onOpen} className={rowClass}>
      <th scope="row" className={`${cellClass} max-w-0 text-left font-normal sm:max-w-none sm:w-[30%]`}>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <button type="button" className={rowButtonClass}>{item.title}</button>
          {item.validationStatus !== "READY" && <StatusPill label={item.validationStatus === "FAILED" ? "validation failed" : "validating"} tone={item.validationStatus === "FAILED" ? "error" : "warning"} />}
          {overdue && <StatusPill label="overdue" tone="error" />}
        </div>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.dueDate ? `Due ${formatDate(item.dueDate)}` : "No due date"} · {item.maxPoints} pts</p>
      </th>
      <td className={cellClass}><RateCell value={item.submissionRate} label={`Submitted, ${item.title}`} detail={`${item.submittedCount}/${item.activeStudents}`} /></td>
      <td className={`${cellClass} hidden text-right lg:table-cell`}><Figure value={item.onTimeRate == null ? "—" : formatPercentage(item.onTimeRate)} detail={item.lateCount > 0 ? `${item.lateCount} late` : undefined} /></td>
      <td className={`${cellClass} hidden text-right md:table-cell`}><Figure value={item.averageScore == null ? "—" : formatPercentage(item.averageScore)} detail={item.averagePoints == null ? undefined : `${Number(item.averagePoints.toFixed(1))} pts`} /></td>
      <td className={`${cellClass} hidden xl:table-cell`}><RateCell value={accepted} label={`Accepted, ${item.title}`} detail={`${item.verdictDistribution.AC ?? 0}/${verdictTotal(item)}`} /></td>
      <td className={`${cellClass} text-right`}><Figure value={String(ungraded)} emphasis={ungraded > 0} detail={item.draftGrades > 0 ? `${item.draftGrades} ${plural(item.draftGrades, "draft")}` : undefined} /></td>
      <td className={`${cellClass} text-right`}><Figure value={String(item.missingCount)} emphasis={overdue} /></td>
      <td className="pr-3 text-gray-300 group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400"><ChevronRight size={16} aria-hidden="true" /></td>
    </tr>
  );
}

function StudentRow({ student, onOpen }: { student: StudentMetrics; onOpen: () => void }) {
  const missing = student.missingAssignmentIds.length;
  return (
    <tr onClick={onOpen} className={rowClass}>
      <th scope="row" className={`${cellClass} max-w-0 text-left font-normal sm:max-w-none sm:w-[30%]`}>
        <button type="button" aria-label={`View details for ${student.fullName}`} className={rowButtonClass}>{student.fullName}</button>
        <p className="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400">{student.enrollmentNumber}</p>
      </th>
      <td className={cellClass}><RateCell value={student.completionRate} label={`Completion, ${student.fullName}`} detail={`${student.submittedCount}/${student.publishedAssignments}`} /></td>
      <td className={`${cellClass} hidden text-right md:table-cell`}><Figure value={student.averageScore == null ? "—" : formatPercentage(student.averageScore)} detail={`${student.gradedAssignments} graded`} /></td>
      <td className={`${cellClass} text-right`}><Figure value={String(missing)} emphasis={missing > 0} /></td>
      <td className={`${cellClass} text-right`}><Figure value={String(student.lateCount)} emphasis={student.lateCount > 0} /></td>
      <td className={`${cellClass} hidden text-right lg:table-cell`}><Figure value={String(student.totalAttempts)} /></td>
      <td className="pr-3 text-gray-300 group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400"><ChevronRight size={16} aria-hidden="true" /></td>
    </tr>
  );
}

function RateCell({ value, label, detail }: { value: number | null; label: string; detail: string }) {
  return (
    <div className="ml-auto flex min-w-28 max-w-44 items-center gap-2.5">
      <Meter value={value} label={label} className="flex-1" />
      <span className="w-20 shrink-0 text-right tabular-nums">
        <span className="text-sm text-gray-900 dark:text-gray-100">{value == null ? "—" : formatPercentage(value)}</span>
        <span className="block text-xs text-gray-500 dark:text-gray-400">{detail}</span>
      </span>
    </div>
  );
}

function Figure({ value, detail, emphasis = false }: { value: string; detail?: string; emphasis?: boolean }) {
  return (
    <span className="tabular-nums">
      <span className={`text-sm ${emphasis ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>{value}</span>
      {detail && <span className="block text-xs text-gray-500 dark:text-gray-400">{detail}</span>}
    </span>
  );
}

function SortHeader<Key extends string>({ label, column, sort, onSort, numeric = false, className = "" }: {
  label: string;
  column: Key;
  sort: SortState<Key>;
  onSort: (value: SortState<Key>) => void;
  numeric?: boolean;
  className?: string;
}) {
  const active = sort.key === column;
  return (
    <th scope="col" aria-sort={active ? (sort.descending ? "descending" : "ascending") : "none"} className={`${headClass} ${numeric ? "text-right" : "text-left"} ${className}`}>
      <button
        type="button"
        onClick={() => onSort({ key: column, descending: active ? !sort.descending : numeric })}
        className={`inline-flex items-center gap-1 rounded uppercase tracking-wide transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure dark:hover:text-gray-100 dark:focus-visible:ring-yellow ${active ? "text-gray-900 dark:text-gray-100" : ""}`}
      >
        {label}
        {active
          ? (sort.descending ? <ArrowDown size={12} aria-hidden="true" /> : <ArrowUp size={12} aria-hidden="true" />)
          : <ChevronsUpDown size={12} aria-hidden="true" className="opacity-40" />}
      </button>
    </th>
  );
}

function ExplorerToolbar({ query, queryPlaceholder, filter, filters, summary, priorityLabel, prioritized, onPrioritize, onQuery, onFilter }: {
  query: string;
  queryPlaceholder: string;
  filter: string;
  filters: Array<[string, string]>;
  summary: string;
  priorityLabel: string;
  prioritized: boolean;
  onPrioritize: () => void;
  onQuery: (value: string) => void;
  onFilter: (value: string) => void;
}) {
  return (
    <header className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <label className="relative sm:w-64">
        <span className="sr-only">{queryPlaceholder}</span>
        <Search size={14} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder={queryPlaceholder} className={`${inputClass} rounded-lg py-2 pl-9 text-sm`} />
      </label>
      <Dropdown value={filter} onChange={onFilter} ariaLabel="Filter rows" size="compact" className="sm:w-48" options={filters.map(([value, label]) => ({ value, label }))} />
      <div className="flex items-center gap-3 sm:ml-auto">
        <p role="status" className="text-xs text-gray-500 dark:text-gray-400">{summary}</p>
        <button type="button" onClick={onPrioritize} aria-pressed={prioritized} title={prioritized ? "Rows that need attention are listed first" : "Restore the default order"}
          className={`${compactButtonClass} ${prioritized ? "border-azure/40 bg-azure/10 text-azure hover:text-azure dark:border-yellow/40 dark:bg-yellow/10 dark:text-yellow dark:hover:text-yellow" : ""}`}>
          {priorityLabel}
        </button>
      </div>
    </header>
  );
}

function TabButton({ active, label, count, onClick }: { active: boolean; label: string; count?: number; onClick: () => void }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-azure dark:focus-visible:ring-yellow ${active
        ? "border-azure text-azure dark:border-yellow dark:text-yellow"
        : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"}`}>
      {label}
      {count != null && <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs tabular-nums text-gray-600 dark:bg-dark-card dark:text-gray-300">{count}</span>}
    </button>
  );
}

function MoreRows({ shown, total, noun, onShow }: { shown: number; total: number; noun: string; onShow: (limit: number) => void }) {
  if (total <= shown) return null;
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-800/60">
      <p className="text-xs text-gray-500 dark:text-gray-400">Showing {shown} of {total} {plural(total, noun)}</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => onShow(shown + PAGE_SIZE)} className={compactButtonClass}>Show {Math.min(PAGE_SIZE, total - shown)} more</button>
        <button type="button" onClick={() => onShow(total)} className={compactButtonClass}>Show all</button>
      </div>
    </footer>
  );
}

function EmptyRows({ title, description }: { title: string; description: string }): ReactNode {
  return <div className="border-t border-gray-100 px-4 py-12 text-center dark:border-gray-800/60"><p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p></div>;
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div role="alert" className="border-t border-gray-100 p-8 text-center dark:border-gray-800/60"><CircleAlert size={24} aria-hidden="true" className="mx-auto text-red-500" /><p className="mt-2 text-sm font-medium">Could not load this section</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{message}</p><button type="button" onClick={onRetry} className={compactButtonClass + " mt-4"}>Try again</button></div>;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
