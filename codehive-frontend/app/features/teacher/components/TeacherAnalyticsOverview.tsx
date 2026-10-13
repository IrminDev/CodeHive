import {
  Archive,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/shared/components/ui/Select";
import type { TeacherGroup } from "../types/group.types";
import type { AssignmentMetrics, ExecutionStatus, GroupMetricsOverview } from "../types/metrics.types";
import { compactButtonClass, panelClass, StatusPill } from "./TeacherUI";

export type GroupLifecycle = "active" | "archived" | "deleted";

export interface AnalyticsHealth {
  overdueAssignments: number;
  missingSubmissions: number;
  processingAssignments: number;
  failedAssignments: number;
  pendingGrades: number;
}

export const VERDICT_ORDER: ExecutionStatus[] = ["AC", "WA", "TLE", "MLE", "RTE", "CE", "OLE", "PENDING"];
export const VERDICT_LABEL: Record<ExecutionStatus, string> = {
  AC: "Accepted",
  WA: "Wrong answer",
  TLE: "Time limit exceeded",
  MLE: "Memory limit exceeded",
  RTE: "Runtime error",
  CE: "Compilation error",
  OLE: "Output limit exceeded",
  PENDING: "Being evaluated",
};

export function groupLifecycle(group: TeacherGroup): GroupLifecycle {
  if (!group.isActive) return "deleted";
  return group.archived ? "archived" : "active";
}

/** Group picker and refresh: the one control row that scopes everything below it. */
export function AnalyticsGroupControls({
  groups,
  selected,
  refreshing,
  onSelect,
  onRefresh,
}: {
  groups: TeacherGroup[];
  selected?: TeacherGroup;
  refreshing: boolean;
  onSelect: (groupId: string) => void;
  onRefresh: () => void;
}) {
  const grouped = {
    active: groups.filter((group) => groupLifecycle(group) === "active"),
    archived: groups.filter((group) => groupLifecycle(group) === "archived"),
    deleted: groups.filter((group) => groupLifecycle(group) === "deleted"),
  };

  return (
    <>
      <Select value={selected?.id} onValueChange={onSelect}>
        <SelectTrigger
          aria-label="Select analytics group"
          className="h-10 w-full min-w-56 rounded-lg border-gray-300 bg-white px-3 text-left text-sm dark:border-gray-700 dark:bg-dark-surface focus:ring-azure dark:focus:ring-yellow sm:w-72"
        >
          <SelectValue placeholder="Select a group" />
        </SelectTrigger>
        <SelectContent className="z-50 max-h-80 rounded-xl border-gray-200 bg-white text-gray-900 shadow-xl dark:border-gray-700 dark:bg-dark-card dark:text-gray-100">
          {(["active", "archived", "deleted"] as GroupLifecycle[]).map((lifecycle) =>
            grouped[lifecycle].length ? (
              <SelectGroup key={lifecycle}>
                <SelectLabel className="px-3 py-2 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {lifecycle}
                </SelectLabel>
                {grouped[lifecycle].map((group) => (
                  <SelectItem
                    key={group.id}
                    value={group.id}
                    className="rounded-lg py-2 pl-8 pr-3 focus:bg-gray-100 dark:focus:bg-dark-surface"
                  >
                    <span className="inline-flex items-center gap-2">
                      <LifecycleIcon lifecycle={lifecycle} />
                      <span className="font-medium">{group.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            ) : null,
          )}
        </SelectContent>
      </Select>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing || !selected}
        className={`${compactButtonClass} h-10`}
      >
        <RefreshCw size={13} aria-hidden="true" className={refreshing ? "motion-safe:animate-spin" : ""} />
        Refresh
      </button>
    </>
  );
}

/** Denominators and freshness for the selected group, kept out of the KPI row. */
export function AnalyticsContextLine({ selected, overview }: { selected?: TeacherGroup; overview: GroupMetricsOverview | null }) {
  if (!selected) return null;
  const lifecycle = groupLifecycle(selected);
  const departed = overview ? overview.enrollment.left + overview.enrollment.removed : 0;
  return (
    <p className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
      <StatusPill label={lifecycle} tone={lifecycle === "active" ? "success" : lifecycle === "archived" ? "warning" : "error"} />
      {overview && (
        <>
          <span><strong className="font-semibold text-gray-900 dark:text-gray-100">{overview.enrollment.active}</strong> active {plural(overview.enrollment.active, "student")}</span>
          <span><strong className="font-semibold text-gray-900 dark:text-gray-100">{overview.assignments.published}</strong> published {plural(overview.assignments.published, "assignment")}</span>
          {departed > 0 && <span>{overview.enrollment.left} left · {overview.enrollment.removed} removed</span>}
        </>
      )}
      {lifecycle !== "active" && <span>Historical group, read-only.</span>}
      <span className="sm:ml-auto">{overview ? `Updated ${formatDateTime(overview.generatedAt)}` : "Metrics not generated yet"}</span>
    </p>
  );
}

/** The four numbers that summarize the group. Everything else is one level down. */
export function AnalyticsOverview({
  overview,
  health,
  totals,
}: {
  overview: GroupMetricsOverview;
  health: AnalyticsHealth;
  /** Summed from the per-assignment metrics so the counts match the table below. */
  totals: { expected: number; submitted: number; late: number };
}) {
  const grading = overview.gradingProgress;
  const returnedRate = ratio(grading.returned, grading.submitted);
  const drafts = Math.max(0, grading.graded - grading.returned);

  return (
    <section aria-label="Group summary" className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 dark:border-gray-800/60 dark:bg-gray-800/60 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        label="Submission rate"
        value={overview.overallSubmissionRate}
        detail={totals.expected > 0
          ? `${totals.submitted} of ${totals.expected} expected · ${health.missingSubmissions} missing`
          : "No published work yet"}
      />
      <Kpi
        label="On-time rate"
        value={overview.overallOnTimeRate}
        detail={totals.submitted > 0 ? `${totals.late} late ${plural(totals.late, "submission")}` : "No submissions yet"}
      />
      <Kpi
        label="Average score"
        value={overview.overallAverageScore}
        detail={grading.graded > 0 ? `Across ${grading.graded} graded ${plural(grading.graded, "submission")}` : "No grades yet"}
      />
      <Kpi
        label="Grades returned"
        value={returnedRate}
        detail={grading.submitted > 0
          ? `${grading.returned} returned · ${drafts} ${plural(drafts, "draft")} · ${health.pendingGrades} to grade`
          : "Nothing to grade yet"}
      />
    </section>
  );
}

function Kpi({ label, value, detail }: { label: string; value: number | null; detail: string }) {
  return (
    <div className="bg-white p-5 dark:bg-dark-surface">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{value == null ? "—" : formatPercentage(value)}</p>
      <Meter value={value} label={label} className="mt-3" />
      <p className="mt-2.5 text-xs text-gray-500 dark:text-gray-400">{detail}</p>
    </div>
  );
}

export function Meter({ value, label, className = "" }: { value: number | null; label: string; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value == null ? undefined : Math.round(clamp(value))}
      aria-valuetext={value == null ? "No data" : formatPercentage(value)}
      className={`h-1.5 overflow-hidden rounded-full bg-azure/15 dark:bg-yellow/15 ${className}`}
    >
      <div className="h-full rounded-full bg-azure dark:bg-yellow" style={{ width: `${clamp(value ?? 0)}%` }} />
    </div>
  );
}

/** Where current submissions stand across the whole group. */
export function VerdictBreakdown({ assignments }: { assignments: AssignmentMetrics[] }) {
  const distribution: Partial<Record<ExecutionStatus, number>> = {};
  for (const status of VERDICT_ORDER) {
    distribution[status] = assignments.reduce((sum, item) => sum + (item.verdictDistribution[status] ?? 0), 0);
  }

  return (
    <section aria-labelledby="analytics-verdicts" className={`${panelClass} p-5`}>
      <h2 id="analytics-verdicts" className="text-sm font-semibold text-gray-900 dark:text-white">Verdicts of current submissions</h2>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Latest verdict of each student’s current submission, across all assignments.</p>
      <div className="mt-4"><VerdictList distribution={distribution} /></div>
    </section>
  );
}

/**
 * One labelled bar per verdict, largest first. Accepted is the only colored bar,
 * so the split never depends on telling eight hues apart.
 */
export function VerdictList({ distribution }: { distribution: Partial<Record<ExecutionStatus, number>> }) {
  const rows = VERDICT_ORDER
    .map((status) => ({ status, count: distribution[status] ?? 0 }))
    .filter((row) => row.count > 0)
    .sort((left, right) => right.count - left.count);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return <p className="text-sm text-gray-500 dark:text-gray-400">No verdicts yet.</p>;

  return (
    <ul className="space-y-2.5">
      {rows.map((row) => {
        const share = row.count / total * 100;
        return (
          <li key={row.status} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 text-xs sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto]" title={`${VERDICT_LABEL[row.status]}: ${row.count} of ${total}`}>
            <span className="truncate text-gray-700 dark:text-gray-300">{VERDICT_LABEL[row.status]}</span>
            <span aria-hidden="true" className="order-last col-span-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-card sm:order-none sm:col-span-1">
              <span className={`block h-full rounded-full ${row.status === "AC" ? "bg-green-500" : "bg-gray-400 dark:bg-gray-500"}`} style={{ width: `${share}%` }} />
            </span>
            <span className="text-right tabular-nums text-gray-500 dark:text-gray-400"><strong className="font-semibold text-gray-900 dark:text-gray-100">{row.count}</strong> · {share.toFixed(0)}%</span>
          </li>
        );
      })}
    </ul>
  );
}

function LifecycleIcon({ lifecycle }: { lifecycle: GroupLifecycle }) {
  const styles = {
    active: "bg-green-500/10 text-green-600 dark:text-green-400",
    archived: "bg-orange-500/10 text-orange-500",
    deleted: "bg-red-500/10 text-red-500",
  };
  const icons = { active: <Users size={12} />, archived: <Archive size={12} />, deleted: <Trash2 size={12} /> };
  return <span aria-hidden="true" className={`grid h-6 w-6 place-items-center rounded-md ${styles[lifecycle]}`}>{icons[lifecycle]}</span>;
}

/** One decimal at most, no trailing zero: 72.5%, 100%. */
export function formatPercentage(value: number | null): string {
  return value == null ? "No data" : `${Number(value.toFixed(1))}%`;
}

export function plural(count: number, noun: string): string {
  return count === 1 ? noun : `${noun}s`;
}

function ratio(value: number, total: number): number | null {
  return total === 0 ? null : (value / total) * 100;
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
