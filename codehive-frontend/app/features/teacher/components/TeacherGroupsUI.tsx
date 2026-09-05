import type { ReactNode } from "react";
import {
  Archive,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Search,
  Users,
} from "lucide-react";
import { Link } from "react-router";
import { Dropdown } from "~/shared/components/ui/Dropdown";

import { inputClass, panelClass, StatusPill } from "./TeacherUI";
import type { TeacherGroup } from "../types/group.types";

export type GroupTab = "active" | "archived";
export type GroupSort = "updated" | "name" | "students" | "assignments";
export type GroupCardData = TeacherGroup & {
  students: number | null;
  assignments: number | null;
  metricsAvailable: boolean;
};

const LIFECYCLE_UI: Record<
  GroupTab,
  {
    icon: ReactNode;
    label: string;
    description: string;
    selected: string;
    accent: string;
    iconStyle: string;
    tone: "success" | "warning" | "error";
  }
> = {
  active: {
    icon: <Users size={17} />,
    label: "Active",
    description: "Available to students",
    selected:
      "border-azure/40 bg-azure/5 dark:border-yellow/40 dark:bg-yellow/5",
    accent: "bg-azure dark:bg-yellow",
    iconStyle: "bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow",
    tone: "success",
  },
  archived: {
    icon: <Archive size={17} />,
    label: "Archived",
    description: "Read-only history",
    selected: "border-orange-500/40 bg-orange-500/5",
    accent: "bg-orange-500",
    iconStyle: "bg-orange-500/10 text-orange-500",
    tone: "warning",
  },
};

export function lifecycle(group: TeacherGroup): GroupTab {
  return group.archived ? "archived" : "active";
}

export function LifecycleSummary({
  selected,
  counts,
  onSelect,
}: {
  selected: GroupTab;
  counts: Record<GroupTab, number>;
  onSelect: (tab: GroupTab) => void;
}) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5"
      role="tablist"
      aria-label="Group lifecycle"
    >
      {(Object.keys(LIFECYCLE_UI) as GroupTab[]).map((tab) => {
        const ui = LIFECYCLE_UI[tab];
        const active = selected === tab;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(tab)}
            className={`${panelClass} relative overflow-hidden p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow ${active ? ui.selected : "hover:border-gray-300 dark:hover:border-gray-700"}`}
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${ui.accent}`} />
            <span className="flex items-center gap-3">
              <span
                className={`w-9 h-9 rounded-xl grid place-items-center ${ui.iconStyle}`}
              >
                {ui.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{ui.label}</span>
                <span className="block text-[10px] text-gray-500 dark:text-gray-400">
                  {ui.description}
                </span>
              </span>
              <strong className="text-2xl font-bold font-mono">
                {counts[tab]}
              </strong>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function GroupToolbar({
  query,
  sort,
  onQuery,
  onSort,
}: {
  query: string;
  sort: GroupSort;
  onQuery: (query: string) => void;
  onSort: (sort: GroupSort) => void;
}) {
  return (
    <section
      className={`${panelClass} p-4 mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]`}
    >
      <label className="grid gap-1 text-xs text-gray-500 dark:text-gray-400">
        Search groups
        <span className="relative">
          <Search size={14} className="absolute left-3 top-3 text-gray-400" />
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search name or description…"
            className={`${inputClass} py-2.5 pl-9 text-sm`}
          />
        </span>
      </label>
      <label className="grid gap-1 text-xs text-gray-500 dark:text-gray-400">
        Sort by
        <Dropdown value={sort} onChange={(value) => onSort(value as GroupSort)} options={[{ value: "updated", label: "Recently updated" }, { value: "name", label: "Name A–Z" }, { value: "students", label: "Most students" }, { value: "assignments", label: "Most assignments" }]} />
      </label>
    </section>
  );
}

export function TeacherGroupCard({ group }: { group: GroupCardData }) {
  const status = lifecycle(group);
  const ui = LIFECYCLE_UI[status];
  return (
    <Link
      to={`/teacher/groups/${group.id}`}
      className={`${panelClass} relative overflow-hidden group transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-azure/5 focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${ui.accent}`} />
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div
            className={`w-11 h-11 rounded-xl grid place-items-center font-bold text-sm ${ui.iconStyle}`}
          >
            {initials(group.name)}
          </div>
          <StatusPill label={status} tone={ui.tone} />
        </div>
        <h2 className="mt-4 text-lg font-semibold line-clamp-1 group-hover:text-azure dark:group-hover:text-yellow transition-colors">
          {group.name}
        </h2>
        <p className="mt-1 min-h-10 text-sm leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">
          {group.description || "No description provided."}
        </p>
        <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-gray-400 dark:text-gray-500">
          <CalendarDays size={11} /> Updated {formatDate(group.updatedAt)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px bg-gray-200 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-800/60">
        <GroupMetric
          icon={<Users size={14} />}
          label="Students"
          value={group.students}
        />
        <GroupMetric
          icon={<ClipboardList size={14} />}
          label="Assignments"
          value={group.assignments}
        />
      </div>
      <div className="px-5 py-3 flex items-center justify-between bg-gray-50 dark:bg-dark-card text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-azure dark:group-hover:text-yellow transition-colors">
        View group <ArrowRight size={14} />
      </div>
    </Link>
  );
}

export function GroupCardSkeletons() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className={`${panelClass} h-72 bg-gray-100 dark:bg-dark-surface`}
        />
      ))}
    </div>
  );
}

export function GroupsEmptyState({
  tab,
  searching,
  onClear,
}: {
  tab: GroupTab;
  searching: boolean;
  onClear: () => void;
}) {
  const ui = LIFECYCLE_UI[tab];
  const descriptions: Record<GroupTab, string> = {
    active: "Create a group to organize students and assignments.",
    archived: "Archived groups remain available as read-only history.",
  };
  return (
    <div className={`${panelClass} py-14 px-6 text-center`}>
      <div
        className={`mx-auto w-11 h-11 rounded-xl grid place-items-center ${ui.iconStyle}`}
      >
        {ui.icon}
      </div>
      <h2 className="mt-3 font-semibold">
        {searching ? "No matching groups" : `No ${tab} groups`}
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {searching ? "Try another name or description." : descriptions[tab]}
      </p>
      {searching ? (
        <button onClick={onClear} className="btn-outline mt-5">
          Clear search
        </button>
      ) : tab === "active" ? (
        <Link
          to="/teacher/groups/create"
          className="btn-primary inline-flex mt-5"
        >
          Create group
        </Link>
      ) : null}
    </div>
  );
}

function GroupMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number | null;
}) {
  return (
    <div className="bg-gray-50 dark:bg-dark-card px-5 py-3.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-semibold text-gray-400 dark:text-gray-500">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-bold font-mono text-gray-800 dark:text-gray-100">
        {value ?? "—"}
      </p>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+|·/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
