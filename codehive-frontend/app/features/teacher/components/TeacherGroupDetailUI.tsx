import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Archive,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Copy,
  Edit3,
  GraduationCap,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import { Link } from "react-router";

import type { TeacherAssignment } from "../types/assignment.types";
import type { GroupEnrollment, TeacherGroup } from "../types/group.types";
import type { GroupMetricsOverview } from "../types/metrics.types";
import {
  compactButtonClass,
  inputClass,
  panelClass,
  StatusPill,
} from "./TeacherUI";

type Lifecycle = "active" | "archived" | "deleted";

const lifecycleStyle: Record<
  Lifecycle,
  {
    accent: string;
    icon: string;
    tone: "success" | "warning" | "error";
    note: string;
  }
> = {
  active: {
    accent: "bg-azure dark:bg-yellow",
    icon: "bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow",
    tone: "success",
    note: "Students can join this group and access published assignments.",
  },
  archived: {
    accent: "bg-orange-500",
    icon: "bg-orange-500/10 text-orange-500",
    tone: "warning",
    note: "This group is read-only. History remains available to you.",
  },
  deleted: {
    accent: "bg-red-500",
    icon: "bg-red-500/10 text-red-500",
    tone: "error",
    note: "This deleted group is visible as historical data and can be restored.",
  },
};

function lifecycle(group: TeacherGroup): Lifecycle {
  if (!group.isActive) return "deleted";
  return group.archived ? "archived" : "active";
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

function formatDate(value?: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function GroupHero({
  group,
  busy,
  onCopyCode,
  onEdit,
  onRotateCode,
  onArchiveToggle,
  onDelete,
  onRestore,
}: {
  group: TeacherGroup;
  busy: boolean;
  onCopyCode: () => void;
  onEdit: () => void;
  onRotateCode: () => void;
  onArchiveToggle: () => void;
  onDelete: () => void;
  onRestore: () => void;
}) {
  const status = lifecycle(group);
  const style = lifecycleStyle[status];

  return (
    <section className={`${panelClass} relative overflow-hidden`}>
      <span className={`absolute inset-x-0 top-0 h-1 ${style.accent}`} />
      <div className="p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className={`w-12 h-12 rounded-xl grid place-items-center flex-shrink-0 text-sm font-bold ${style.icon}`}
            >
              {initials(group.name)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words">
                  {group.name}
                </h1>
                <StatusPill label={status} tone={style.tone} />
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {group.description || "No group description provided."}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-gray-400 dark:text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays size={11} /> Created {formatDate(group.createdAt)}
                </span>
                <span>Updated {formatDate(group.updatedAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end flex-shrink-0">
            {status === "active" ? (
              <Link
                to={`/teacher/create-assignment?groupId=${group.id}`}
                className="btn-primary inline-flex items-center gap-1.5"
              >
                <Plus size={14} /> Create assignment
              </Link>
            ) : status === "archived" ? (
              <button
                disabled={busy}
                onClick={onArchiveToggle}
                className="btn-primary inline-flex items-center gap-1.5"
              >
                <RefreshCw size={14} /> Unarchive group
              </button>
            ) : (
              <button
                disabled={busy}
                onClick={onRestore}
                className="btn-primary inline-flex items-center gap-1.5"
              >
                <RotateCcw size={14} /> Restore group
              </button>
            )}

            {status !== "deleted" && (
              <details className="relative">
                <summary
                  className={`${compactButtonClass} list-none cursor-pointer h-full`}
                  aria-label="More group actions"
                >
                  <MoreHorizontal size={15} /> More
                </summary>
                <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card shadow-xl p-1">
                  {status === "active" && (
                    <>
                      <MenuAction icon={<Edit3 size={14} />} label="Edit details" onClick={onEdit} />
                      <MenuAction icon={<RotateCcw size={14} />} label="Rotate join code" onClick={onRotateCode} />
                      <MenuAction icon={<Archive size={14} />} label="Archive group" onClick={onArchiveToggle} />
                    </>
                  )}
                  <MenuAction
                    icon={<Trash2 size={14} />}
                    label="Delete group"
                    onClick={onDelete}
                    danger
                  />
                </div>
              </details>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className={`rounded-xl border px-4 py-3 text-xs ${
            status === "active"
              ? "border-azure/20 bg-azure/5 text-azure dark:border-yellow/20 dark:bg-yellow/5 dark:text-yellow"
              : status === "archived"
                ? "border-orange-500/20 bg-orange-500/5 text-orange-600 dark:text-orange-400"
                : "border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400"
          }`}>
            {style.note}
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-dark-card px-4 py-3 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 dark:text-gray-500">
                Join code
              </p>
              <strong className="block mt-0.5 truncate font-mono text-lg tracking-widest text-azure dark:text-yellow">
                {group.joinCode || "Unavailable"}
              </strong>
            </div>
            {group.joinCode && (
              <button
                onClick={onCopyCode}
                className="w-9 h-9 grid place-items-center rounded-lg text-gray-400 hover:text-azure dark:hover:text-yellow hover:bg-white dark:hover:bg-dark-surface transition-colors"
                aria-label="Copy join code"
                title="Copy join code"
              >
                <Copy size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function GroupMetrics({
  metrics,
  studentCount,
  assignmentCount,
}: {
  metrics: GroupMetricsOverview | null;
  studentCount: number | null;
  assignmentCount: number | null;
}) {
  const grading = metrics?.gradingProgress;
  const items = [
    {
      icon: <Users size={15} />,
      label: "Active students",
      value: metrics?.enrollment.active ?? studentCount,
    },
    {
      icon: <ClipboardList size={15} />,
      label: "Assignments",
      value: metrics?.assignments.total ?? assignmentCount,
    },
    {
      icon: <CheckCircle2 size={15} />,
      label: "Submission rate",
      value: percent(metrics?.overallSubmissionRate),
    },
    {
      icon: <GraduationCap size={15} />,
      label: "Average score",
      value: percent(metrics?.overallAverageScore),
    },
    {
      icon: <ClipboardCheck size={15} />,
      label: "Grading progress",
      value: grading ? `${grading.graded} / ${grading.submitted}` : "—",
    },
  ];

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3" aria-label="Group overview">
      {items.map((item) => (
        <div key={item.label} className={`${panelClass} p-4`}>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-semibold text-gray-400 dark:text-gray-500">
            {item.icon}
            {item.label}
          </div>
          <p className="mt-2 text-xl font-bold font-mono text-gray-800 dark:text-gray-100">
            {item.value ?? "—"}
          </p>
        </div>
      ))}
    </section>
  );
}

export function RosterPanel({
  group,
  students,
  busy,
  onRemove,
}: {
  group: TeacherGroup;
  students: GroupEnrollment[];
  busy: boolean;
  onRemove: (enrollment: GroupEnrollment) => void;
}) {
  const [query, setQuery] = useState("");
  const visibleStudents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return students;
    return students.filter(
      ({ student }) =>
        student.fullName.toLowerCase().includes(normalized) ||
        student.enrollmentNumber.toLowerCase().includes(normalized),
    );
  }, [query, students]);
  const writable = group.isActive && !group.archived;

  return (
    <section className={`${panelClass} overflow-hidden`}>
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Student roster</h2>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {students.length} active enrollment{students.length === 1 ? "" : "s"}
            </p>
          </div>
          <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-dark-card text-xs font-mono text-gray-500">
            {visibleStudents.length}
          </span>
        </div>
        {students.length > 4 && (
          <label className="relative block mt-3">
            <Search size={14} className="absolute left-3 top-3 text-gray-400" />
            <span className="sr-only">Search students</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or enrollment number…"
              className={`${inputClass} py-2.5 pl-9 text-sm`}
            />
          </label>
        )}
      </header>

      {visibleStudents.length === 0 ? (
        <PanelEmpty
          icon={<Users size={24} />}
          title={query ? "No matching students" : "No active students"}
          description={query ? "Try another name or enrollment number." : "Share join code to grow this roster."}
        />
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
          {visibleStudents.map((enrollment) => (
            <div key={enrollment.id} className="px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-azure/10 dark:bg-yellow/10 text-azure dark:text-yellow grid place-items-center text-[10px] font-bold flex-shrink-0">
                {initials(enrollment.student.fullName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{enrollment.student.fullName}</p>
                <p className="mt-0.5 text-[10px] font-mono text-gray-400 dark:text-gray-500 truncate">
                  {enrollment.student.enrollmentNumber} · Joined {formatDate(enrollment.joinedAt)}
                </p>
              </div>
              {writable && (
                <details className="relative flex-shrink-0">
                  <summary
                    className="w-9 h-9 grid place-items-center rounded-lg list-none cursor-pointer text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-card"
                    aria-label={`Actions for ${enrollment.student.fullName}`}
                  >
                    <MoreHorizontal size={15} />
                  </summary>
                  <div className="absolute right-0 z-10 mt-1 w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card shadow-xl p-1">
                    <button
                      disabled={busy}
                      onClick={(event) => {
                        event.currentTarget.closest("details")?.removeAttribute("open");
                        onRemove(enrollment);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <UserMinus size={14} /> Remove student
                    </button>
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function AssignmentsPanel({
  group,
  assignments,
}: {
  group: TeacherGroup;
  assignments: TeacherAssignment[];
}) {
  const writable = group.isActive && !group.archived;
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/60 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Assignments</h2>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            Validation, deadlines, and grading access.
          </p>
        </div>
        {writable ? (
          <Link
            to={`/teacher/create-assignment?groupId=${group.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-azure text-white hover:bg-french transition-colors"
          >
            <Plus size={13} /> New
          </Link>
        ) : (
          <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-dark-card text-xs font-mono text-gray-500">
            {assignments.length}
          </span>
        )}
      </header>

      {assignments.length === 0 ? (
        <PanelEmpty
          icon={<BookOpen size={24} />}
          title="No assignments"
          description={writable ? "Create first assignment for this group." : "No assignment history is available."}
        />
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
          {assignments.map((assignment) => (
            <article key={assignment.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-medium truncate">{assignment.title}</h3>
                    <StatusPill
                      label={assignment.isActive ? assignment.validationStatus : "deleted"}
                      tone={
                        !assignment.isActive
                          ? "error"
                          : assignment.validationStatus === "READY"
                            ? "success"
                            : assignment.validationStatus === "FAILED"
                              ? "error"
                              : "warning"
                      }
                    />
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono text-gray-400 dark:text-gray-500">
                    <span>{assignment.maxPoints} pts</span>
                    <span>{assignment.allowedLanguages.join(" · ")}</span>
                    <span>{assignment.dueDate ? `Due ${formatDate(assignment.dueDate)}` : "No due date"}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={`/teacher/assignments/${assignment.id}/preview`}
                  className={compactButtonClass}
                >
                  <BookOpen size={13} /> Preview
                </Link>
                <Link
                  to={`/teacher/grades?groupId=${group.id}&assignmentId=${assignment.id}`}
                  className={compactButtonClass}
                >
                  <GraduationCap size={13} /> Grade
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
      <footer className="px-5 py-3 border-t border-gray-100 dark:border-gray-800/60 bg-gray-50 dark:bg-dark-card">
        <Link
          to="/teacher/assignments"
          className="text-xs font-medium text-gray-500 hover:text-azure dark:hover:text-yellow transition-colors"
        >
          Open assignment management →
        </Link>
      </footer>
    </section>
  );
}

export function EditGroupDialog({
  open,
  name,
  description,
  busy,
  onNameChange,
  onDescriptionChange,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  name: string;
  description: string;
  busy: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-dark-bg/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="edit-group-title">
      <form onSubmit={onSubmit} className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-dark-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-azure dark:text-yellow">Group settings</p>
            <h2 id="edit-group-title" className="mt-1 text-lg font-semibold">Edit group details</h2>
          </div>
          <button type="button" onClick={onCancel} disabled={busy} className="w-8 h-8 grid place-items-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface" aria-label="Close">
            <X size={17} />
          </button>
        </div>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
            <input required maxLength={120} autoFocus value={name} onChange={(event) => onNameChange(event.target.value)} className={inputClass} />
            <span className="text-[10px] font-normal text-gray-400 text-right">{name.length} / 120</span>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
            <textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} rows={4} className={inputClass} />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={busy} className={compactButtonClass}>Cancel</button>
          <button disabled={busy || !name.trim()} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-azure text-white hover:bg-french disabled:opacity-50">
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function MenuAction({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={(event) => {
        event.currentTarget.closest("details")?.removeAttribute("open");
        onClick();
      }}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${danger ? "text-red-500 hover:bg-red-500/10" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function PanelEmpty({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto w-11 h-11 rounded-xl bg-gray-100 dark:bg-dark-card text-gray-400 dark:text-gray-600 grid place-items-center">
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

function percent(value?: number | null): string {
  return value == null ? "—" : `${value}%`;
}
