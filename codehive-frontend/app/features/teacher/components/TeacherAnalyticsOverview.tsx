import type { ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  GraduationCap,
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
import type { GroupMetricsOverview } from "../types/metrics.types";
import { compactButtonClass, panelClass, StatusPill } from "./TeacherUI";

export type GroupLifecycle = "active" | "archived" | "deleted";

export interface AnalyticsHealth {
  overdueAssignments: number;
  missingSubmissions: number;
  processingAssignments: number;
  failedAssignments: number;
  pendingGrades: number;
}

export function groupLifecycle(group: TeacherGroup): GroupLifecycle {
  if (!group.isActive) return "deleted";
  return group.archived ? "archived" : "active";
}

export function AnalyticsGroupContext({
  groups,
  selected,
  generatedAt,
  refreshing,
  onSelect,
  onRefresh,
}: {
  groups: TeacherGroup[];
  selected?: TeacherGroup;
  generatedAt?: string;
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
    <section className={`${panelClass} mb-5 overflow-hidden`}>
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow">
              <BarChart3 size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Reporting context
              </p>
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {selected?.description || "Choose an owned group to inspect performance."}
              </p>
            </div>
          </div>
        </div>

        <Select value={selected?.id} onValueChange={onSelect}>
          <SelectTrigger
            aria-label="Select analytics group"
            className="h-auto min-h-14 rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-left dark:border-gray-700 dark:bg-dark-card focus:ring-azure dark:focus:ring-yellow"
          >
            <SelectValue placeholder="Select a group" />
          </SelectTrigger>
          <SelectContent className="z-50 max-h-80 rounded-xl border-gray-200 bg-white text-gray-900 shadow-xl dark:border-gray-700 dark:bg-dark-card dark:text-gray-100">
            {(["active", "archived", "deleted"] as GroupLifecycle[]).map((lifecycle) =>
              grouped[lifecycle].length ? (
                <SelectGroup key={lifecycle}>
                  <SelectLabel className="px-3 py-2 text-[10px] uppercase tracking-widest text-gray-400">
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
                        <span className="text-[10px] capitalize text-gray-400">{lifecycle}</span>
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
          className={compactButtonClass}
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-5 py-2.5 text-[10px] text-gray-500 dark:border-gray-800/60 dark:bg-dark-card">
        <span className="inline-flex items-center gap-2">
          {selected && <StatusPill label={groupLifecycle(selected)} tone={lifecycleTone(groupLifecycle(selected))} />}
          Historical groups remain read-only.
        </span>
        <span className="font-mono">
          {generatedAt ? `Generated ${formatDateTime(generatedAt)}` : "Metrics not generated yet"}
        </span>
      </div>
    </section>
  );
}

export function AnalyticsOverview({
  overview,
  health,
}: {
  overview: GroupMetricsOverview;
  health: AnalyticsHealth;
}) {
  const grading = overview.gradingProgress;
  const gradedRate = ratio(grading.graded, grading.submitted);
  const returnedRate = ratio(grading.returned, grading.submitted);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active students"
          value={String(overview.enrollment.active)}
          detail={`${overview.enrollment.left} left · ${overview.enrollment.removed} removed`}
          icon={<Users size={17} />}
          tone="blue"
        />
        <KpiCard
          label="Published assignments"
          value={String(overview.assignments.published)}
          detail={`${overview.assignments.total} active assignments`}
          icon={<BookOpenCheck size={17} />}
          tone="gold"
        />
        <KpiCard
          label="Submission rate"
          value={formatPercentage(overview.overallSubmissionRate)}
          detail={metricContext(overview.overallSubmissionRate, "Current delivery coverage")}
          icon={<CheckCircle2 size={17} />}
          tone="green"
          progress={overview.overallSubmissionRate}
        />
        <KpiCard
          label="Average score"
          value={formatPercentage(overview.overallAverageScore)}
          detail={metricContext(overview.overallAverageScore, "Across graded work")}
          icon={<GraduationCap size={17} />}
          tone="purple"
          progress={overview.overallAverageScore}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProgressCard
          title="On-time delivery"
          description="Punctuality across current submissions"
          value={overview.overallOnTimeRate}
          icon={<Clock3 size={16} />}
        />
        <section className={`${panelClass} p-5`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Grading progress</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {grading.returned} returned from {grading.submitted} submissions
              </p>
            </div>
            <span className="text-xl font-bold font-mono">{formatPercentage(returnedRate)}</span>
          </div>
          <div className="mt-5 space-y-3">
            <ProgressLine label="Graded" value={gradedRate} count={grading.graded} color="bg-azure dark:bg-yellow" />
            <ProgressLine label="Returned" value={returnedRate} count={grading.returned} color="bg-green-500" />
          </div>
        </section>
      </div>

      <HealthStrip health={health} />
    </div>
  );
}

function HealthStrip({ health }: { health: AnalyticsHealth }) {
  const items = [
    { label: "Overdue assignments", value: health.overdueAssignments, tone: "text-red-500 bg-red-500/10", icon: <AlertTriangle size={13} /> },
    { label: "Missing submissions", value: health.missingSubmissions, tone: "text-orange-500 bg-orange-500/10", icon: <Users size={13} /> },
    { label: "Pending grading", value: health.pendingGrades, tone: "text-azure dark:text-yellow bg-azure/10 dark:bg-yellow/10", icon: <GraduationCap size={13} /> },
    { label: "Processing", value: health.processingAssignments, tone: "text-yellow-700 dark:text-yellow bg-yellow/10", icon: <RefreshCw size={13} /> },
    { label: "Validation failed", value: health.failedAssignments, tone: "text-red-500 bg-red-500/10", icon: <AlertTriangle size={13} /> },
  ];

  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800/60">
        <h2 className="text-sm font-semibold">Attention summary</h2>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 dark:divide-gray-800/60 sm:grid-cols-3 xl:grid-cols-5 xl:divide-y-0">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3 p-4">
            <span className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg ${item.tone}`}>{item.icon}</span>
            <div className="min-w-0">
              <p className="text-lg font-bold font-mono">{item.value}</p>
              <p className="truncate text-[10px] text-gray-500 dark:text-gray-400">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function KpiCard({ label, value, detail, icon, tone, progress }: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone: "blue" | "gold" | "green" | "purple";
  progress?: number | null;
}) {
  const colors = {
    blue: "bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow",
    gold: "bg-yellow/15 text-yellow-700 dark:text-yellow",
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  };
  return (
    <section className={`${panelClass} relative overflow-hidden p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${colors[tone]}`}>{icon}</span>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{detail}</p>
      {progress != null && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-card">
          <div className="h-full rounded-full bg-azure dark:bg-yellow" style={{ width: `${clamp(progress)}%` }} />
        </div>
      )}
    </section>
  );
}

function ProgressCard({ title, description, value, icon }: { title: string; description: string; value: number | null; icon: ReactNode }) {
  return (
    <section className={`${panelClass} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500/10 text-orange-500">{icon}</span>
          <div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p></div>
        </div>
        <strong className="text-xl font-bold font-mono">{formatPercentage(value)}</strong>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-card">
        <div className="h-full rounded-full bg-orange-500" style={{ width: `${clamp(value ?? 0)}%` }} />
      </div>
    </section>
  );
}

function ProgressLine({ label, value, count, color }: { label: string; value: number | null; count: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] text-gray-500"><span>{label}</span><span className="font-mono">{count} · {formatPercentage(value)}</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-card"><div className={`h-full rounded-full ${color}`} style={{ width: `${clamp(value ?? 0)}%` }} /></div>
    </div>
  );
}

function LifecycleIcon({ lifecycle }: { lifecycle: GroupLifecycle }) {
  const styles = {
    active: "bg-green-500/10 text-green-500",
    archived: "bg-orange-500/10 text-orange-500",
    deleted: "bg-red-500/10 text-red-500",
  };
  const icons = { active: <Users size={12} />, archived: <Archive size={12} />, deleted: <Trash2 size={12} /> };
  return <span className={`grid h-6 w-6 place-items-center rounded-md ${styles[lifecycle]}`}>{icons[lifecycle]}</span>;
}

function lifecycleTone(value: GroupLifecycle): "success" | "warning" | "error" {
  return value === "active" ? "success" : value === "archived" ? "warning" : "error";
}

export function formatPercentage(value: number | null): string {
  return value == null ? "No data" : `${value.toFixed(2)}%`;
}

function metricContext(value: number | null, context: string): string {
  return value == null ? "No data yet" : context;
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
