import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArchiveRestore,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Copy,
  Eye,
  FileCode2,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "react-router";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/shared/components/ui/Select";
import { Dropdown } from "~/shared/components/ui/Dropdown";
import type {
  AssignmentManagementStatus,
  AssignmentValidationStatus,
  TeacherAssignment,
} from "../types/assignment.types";
import type { TeacherGroup } from "../types/group.types";
import {
  compactButtonClass,
  inputClass,
  panelClass,
  StatusPill,
  TeacherLoading,
} from "./TeacherUI";

export type AssignmentLifecycle = "active" | "deleted";

export function assignmentGroupLifecycle(group: TeacherGroup): "active" | "archived" | "deleted" {
  if (!group.isActive) return "deleted";
  return group.archived ? "archived" : "active";
}

export function AssignmentContextBar({
  groups,
  selected,
  lifecycle,
  query,
  validationStatus,
  loading,
  onGroupChange,
  onLifecycleChange,
  onQueryChange,
  onValidationChange,
  onClear,
  onRefresh,
}: {
  groups: TeacherGroup[];
  selected?: TeacherGroup;
  lifecycle: AssignmentLifecycle;
  query: string;
  validationStatus: "" | AssignmentValidationStatus;
  loading: boolean;
  onGroupChange: (groupId: string) => void;
  onLifecycleChange: (lifecycle: AssignmentLifecycle) => void;
  onQueryChange: (query: string) => void;
  onValidationChange: (status: "" | AssignmentValidationStatus) => void;
  onClear: () => void;
  onRefresh: () => void;
}) {
  const grouped = useMemo(
    () => ({
      active: groups.filter((group) => assignmentGroupLifecycle(group) === "active"),
      archived: groups.filter((group) => assignmentGroupLifecycle(group) === "archived"),
      deleted: groups.filter((group) => assignmentGroupLifecycle(group) === "deleted"),
    }),
    [groups],
  );
  const hasFilters = Boolean(query.trim() || validationStatus || lifecycle === "deleted");

  return (
    <section className={`${panelClass} mb-5 overflow-hidden`}>
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-azure/10 text-azure dark:bg-yellow/10 dark:text-yellow">
            <FileCode2 size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Assignment context</p>
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{selected?.name ?? "Choose an owned group"}</p>
            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{selected?.description || "Assignments are organized by group."}</p>
          </div>
        </div>

        <Select value={selected?.id} onValueChange={onGroupChange}>
          <SelectTrigger aria-label="Select assignment group" className="h-auto min-h-14 rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-left dark:border-gray-700 dark:bg-dark-card focus:ring-azure dark:focus:ring-yellow">
            <SelectValue placeholder="Select group" />
          </SelectTrigger>
          <SelectContent className="z-50 max-h-80 rounded-xl border-gray-200 bg-white text-gray-900 shadow-xl dark:border-gray-700 dark:bg-dark-card dark:text-gray-100">
            {(["active", "archived", "deleted"] as const).map((state) =>
              grouped[state].length ? (
                <SelectGroup key={state}>
                  <SelectLabel className="px-3 py-2 text-[10px] uppercase tracking-widest text-gray-400">{state}</SelectLabel>
                  {grouped[state].map((group) => (
                    <SelectItem key={group.id} value={group.id} className="rounded-lg py-2 pl-8 pr-3 focus:bg-gray-100 dark:focus:bg-dark-surface">
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${state === "active" ? "bg-green-500" : state === "archived" ? "bg-yellow" : "bg-red-500"}`} />
                        <span className="truncate font-medium">{group.name}</span>
                        <span className="text-[10px] capitalize text-gray-400">{state}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ) : null,
            )}
          </SelectContent>
        </Select>

        <button type="button" onClick={onRefresh} disabled={loading || !selected} className={compactButtonClass}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="border-t border-gray-100 bg-gray-50 p-3 dark:border-gray-800/60 dark:bg-dark-card sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[auto_minmax(220px,1fr)_190px_auto] lg:items-end">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Lifecycle</p>
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-dark-surface">
              {(["active", "deleted"] as AssignmentLifecycle[]).map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => onLifecycleChange(item)}
                  aria-pressed={lifecycle === item}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize transition-colors ${lifecycle === item ? "bg-azure text-white shadow-sm dark:bg-yellow dark:text-imperial" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Search
            <span className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search assignment title…" className={`${inputClass} py-2.5 pl-9 text-sm normal-case tracking-normal`} />
            </span>
          </label>

          <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Validation
            <Dropdown value={validationStatus} onChange={(value) => onValidationChange(value as "" | AssignmentValidationStatus)} options={[{ value: "", label: "All statuses" }, { value: "READY", label: "Ready" }, { value: "PROCESSING", label: "Processing" }, { value: "FAILED", label: "Failed" }]} />
          </label>

          <button type="button" onClick={onClear} disabled={!hasFilters} className={compactButtonClass}>Clear filters</button>
        </div>
      </div>
    </section>
  );
}

export function AssignmentList({
  assignments,
  deleted,
  canRestore,
  loading,
  page,
  pageSize,
  totalElements,
  totalPages,
  onPage,
  onStatus,
  onDelete,
  onRestore,
}: {
  assignments: TeacherAssignment[];
  deleted: boolean;
  canRestore: boolean;
  loading: boolean;
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  onPage: (page: number) => void;
  onStatus: (assignment: TeacherAssignment) => void;
  onDelete: (assignment: TeacherAssignment) => void;
  onRestore: (assignment: TeacherAssignment) => void;
}) {
  const first = totalElements ? page * pageSize + 1 : 0;
  const last = Math.min((page + 1) * pageSize, totalElements);

  return (
    <section className={`${panelClass} relative overflow-hidden`} aria-busy={loading}>
      {loading && (
        <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-azure/10 dark:bg-yellow/10">
          <div className="h-full w-1/3 animate-pulse bg-azure dark:bg-yellow" />
        </div>
      )}
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5 dark:border-gray-800/60">
        <div>
          <h2 className="text-sm font-semibold">{deleted ? "Deleted assignments" : "Assignment library"}</h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{deleted ? "Restore assignments when their group permits it." : "Validation, schedule, and management controls."}</p>
        </div>
        <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-500 dark:bg-dark-card dark:text-gray-400">{totalElements}</span>
      </header>

      <div className={`divide-y divide-gray-100 transition-opacity dark:divide-gray-800/60 ${loading ? "opacity-60" : "opacity-100"}`}>
        {assignments.map((assignment) => (
          <AssignmentRow
            key={assignment.id}
            assignment={assignment}
            deleted={deleted}
            canRestore={canRestore}
            onStatus={() => onStatus(assignment)}
            onDelete={() => onDelete(assignment)}
            onRestore={() => onRestore(assignment)}
          />
        ))}
      </div>

      <footer className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 px-5 py-3 dark:border-gray-800/60 dark:bg-dark-card sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">Showing <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{first}–{last}</span> of <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{totalElements}</span></p>
        <div className="flex items-center gap-2">
          <button type="button" className={compactButtonClass} disabled={page === 0 || loading} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft size={14} /><span className="hidden sm:inline">Previous</span></button>
          <span className="px-2 py-2 text-xs font-mono text-gray-500">{page + 1} / {Math.max(totalPages, 1)}</span>
          <button type="button" className={compactButtonClass} disabled={page + 1 >= totalPages || loading} onClick={() => onPage(page + 1)} aria-label="Next page"><span className="hidden sm:inline">Next</span><ChevronRight size={14} /></button>
        </div>
      </footer>
    </section>
  );
}

function AssignmentRow({ assignment, deleted, canRestore, onStatus, onDelete, onRestore }: { assignment: TeacherAssignment; deleted: boolean; canRestore: boolean; onStatus: () => void; onDelete: () => void; onRestore: () => void }) {
  const tone = assignment.validationStatus === "READY" ? "success" : assignment.validationStatus === "FAILED" ? "error" : "warning";
  const rail = deleted ? "bg-gray-400" : assignment.validationStatus === "READY" ? "bg-green-500" : assignment.validationStatus === "FAILED" ? "bg-red-500" : "bg-yellow";
  const schedule = assignmentSchedule(assignment, deleted);

  return (
    <article className="group relative px-5 py-4 transition-colors hover:bg-gray-50/80 dark:hover:bg-dark-card/40">
      <span className={`absolute inset-y-3 left-0 w-1 rounded-r-full ${rail}`} aria-hidden="true" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">{assignment.title}</h3>
            <button type="button" onClick={onStatus} className="rounded-full focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow" aria-label={`View ${assignment.title} validation status`}>
              <StatusPill label={deleted ? "deleted" : assignment.validationStatus} tone={deleted ? "neutral" : tone} />
            </button>
            <StatusPill label={schedule.label} tone={schedule.tone} />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-mono text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1"><CalendarClock size={11} /> {schedule.detail}</span>
            <span>{assignment.maxPoints} pts</span>
            <span>{assignment.allowedLanguages.join(" · ") || "No languages"}</span>
          </div>
          {assignment.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {assignment.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-dark-card dark:text-gray-400">{tag}</span>)}
              {assignment.tags.length > 3 && <span className="px-1 py-0.5 text-[10px] text-gray-400">+{assignment.tags.length - 3}</span>}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {deleted ? (
            <button type="button" disabled={!canRestore} title={canRestore ? "Restore assignment" : "Restore or unarchive group first"} onClick={onRestore} className="inline-flex items-center gap-1.5 rounded-lg bg-azure px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-french disabled:cursor-not-allowed disabled:opacity-50 dark:bg-yellow dark:text-imperial">
              <ArchiveRestore size={14} /> Restore
            </button>
          ) : (
            <>
              {assignment.validationStatus === "READY" ? (
                <Link to={`/teacher/assignments/${assignment.id}/preview`} className="inline-flex items-center gap-1.5 rounded-lg bg-azure/10 px-3 py-2 text-xs font-semibold text-azure transition-colors hover:bg-azure hover:text-white dark:bg-yellow/10 dark:text-yellow dark:hover:bg-yellow dark:hover:text-imperial"><Eye size={14} /> Preview</Link>
              ) : (
                <button type="button" onClick={onStatus} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${assignment.validationStatus === "FAILED" ? "border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500/10" : "border-yellow/30 bg-yellow/5 text-yellow-700 hover:bg-yellow/10 dark:text-yellow"}`}>
                  {assignment.validationStatus === "FAILED" ? <AlertTriangle size={14} /> : <LoaderCircle size={14} className="animate-spin" />}
                  {assignment.validationStatus === "FAILED" ? "Review error" : "View progress"}
                </button>
              )}
              <Link to={`/teacher/assignments/${assignment.id}/edit`} className={compactButtonClass}><Pencil size={14} /> Edit</Link>
              <AssignmentMenu assignment={assignment} onStatus={onStatus} onDelete={onDelete} />
            </>
          )}
        </div>
      </div>
      {deleted && !canRestore && <p className="mt-3 text-xs text-orange-500">Restore or unarchive this assignment’s group before restoring assignment.</p>}
    </article>
  );
}

function AssignmentMenu({ assignment, onStatus, onDelete }: { assignment: TeacherAssignment; onStatus: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button ref={triggerRef} type="button" onClick={() => setOpen((value) => !value)} className={compactButtonClass} aria-haspopup="menu" aria-expanded={open} aria-label={`More actions for ${assignment.title}`}><MoreHorizontal size={14} /></button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-gray-200 bg-white p-1 shadow-xl dark:border-gray-700 dark:bg-dark-card">
          <MenuButton icon={<ClipboardCheck size={14} />} label="Validation status" onClick={() => { setOpen(false); onStatus(); }} />
          <MenuLink to={`/teacher/assignments/${assignment.id}/revalidate`} icon={<RefreshCw size={14} />} label="Update tests/code" />
          <MenuLink to={`/teacher/assignments/${assignment.id}/clone`} icon={<Copy size={14} />} label="Clone assignment" />
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onDelete(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-500 hover:bg-red-500/10"><Trash2 size={14} /> Delete assignment</button>
        </div>
      )}
    </div>
  );
}

function MenuLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return <Link role="menuitem" to={to} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-surface">{icon}{label}</Link>;
}

function MenuButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <button type="button" role="menuitem" onClick={onClick} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-surface">{icon}{label}</button>;
}

export function AssignmentStatusDrawer({ assignment, status, loading, onClose }: { assignment: TeacherAssignment | null; status: AssignmentManagementStatus | null; loading: boolean; onClose: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-dark-bg/50 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="assignment-status-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-dark-card">
        <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-gray-800/60 dark:bg-dark-card/95">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-azure dark:text-yellow">Assignment management</p>
              <h2 ref={headingRef} tabIndex={-1} id="assignment-status-title" className="mt-1 truncate text-xl font-semibold outline-none">{assignment?.title ?? "Assignment status"}</h2>
              {status && <div className="mt-2"><StatusPill label={status.validationStatus} tone={status.validationStatus === "READY" ? "success" : status.validationStatus === "FAILED" ? "error" : "warning"} /></div>}
            </div>
            <button type="button" onClick={onClose} className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface" aria-label="Close assignment status"><X size={17} /></button>
          </div>
          {assignment && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={`/teacher/assignments/${assignment.id}/preview`} className={compactButtonClass}><Eye size={13} /> Preview</Link>
              <Link to={`/teacher/assignments/${assignment.id}/edit`} className={compactButtonClass}><Pencil size={13} /> Edit metadata</Link>
              <Link to={`/teacher/assignments/${assignment.id}/revalidate`} className="inline-flex items-center gap-1.5 rounded-lg bg-azure px-3 py-2 text-xs font-semibold text-white hover:bg-french dark:bg-yellow dark:text-imperial"><RefreshCw size={13} /> Update tests/code</Link>
            </div>
          )}
        </header>

        <div className="space-y-5 p-5">
          {loading || !status ? <TeacherLoading rows={3} /> : (
            <>
              <section className={`${panelClass} overflow-hidden`}>
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800/60">
                  <span className="text-sm font-medium">Current validation</span>
                  <StatusPill label={status.validationStatus} tone={status.validationStatus === "READY" ? "success" : status.validationStatus === "FAILED" ? "error" : "warning"} />
                </div>
                {status.validationFailureMessage ? (
                  <div className="border-l-4 border-red-500 bg-red-500/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-500"><AlertTriangle size={15} /> Validation output</div>
                    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-red-500/20 bg-white p-3 font-mono text-xs leading-relaxed text-red-600 dark:bg-dark-surface dark:text-red-400">{status.validationFailureMessage}</pre>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 text-sm text-gray-500 dark:text-gray-400"><CheckCircle2 size={17} className="text-green-500" /> No validation failure output.</div>
                )}
              </section>

              {status.reevaluation && <ReevaluationProgress reevaluation={status.reevaluation} />}

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <div><h3 className="text-sm font-semibold">Update history</h3><p className="mt-0.5 text-xs text-gray-500">Newest staged changes first.</p></div>
                  <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-500 dark:bg-dark-surface">{status.updates.length}</span>
                </div>
                {status.updates.length === 0 ? <div className={`${panelClass} p-5 text-sm text-gray-500`}>No staged updates.</div> : (
                  <div className="relative space-y-3 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-gray-200 dark:before:bg-gray-700">
                    {status.updates.map((update) => (
                      <article key={update.id} className={`${panelClass} relative ml-8 p-4`}>
                        <span className={`absolute -left-[25px] top-5 h-3 w-3 rounded-full border-2 border-white dark:border-dark-card ${update.status === "APPLIED" ? "bg-green-500" : update.status === "REJECTED" ? "bg-red-500" : "bg-yellow"}`} />
                        <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold">{update.kind.replaceAll("_", " ")}</span><StatusPill label={update.status} tone={update.status === "APPLIED" ? "success" : update.status === "REJECTED" ? "error" : "warning"} /></div>
                        {update.failureMessage && <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-red-500/5 p-3 font-mono text-[10px] text-red-500">{update.failureMessage}</pre>}
                        <p className="mt-3 text-[10px] font-mono text-gray-500">{formatDateTime(update.createdAt)}</p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function ReevaluationProgress({ reevaluation }: { reevaluation: NonNullable<AssignmentManagementStatus["reevaluation"]> }) {
  const progress = reevaluation.total ? Math.min(100, Math.round((reevaluation.completed / reevaluation.total) * 100)) : 0;
  const tone = reevaluation.failed ? "error" : reevaluation.status === "COMPLETED" ? "success" : "warning";
  return (
    <section className={`${panelClass} p-4`}>
      <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">Submission reevaluation</h3><p className="mt-1 text-xs text-gray-500">{reevaluation.completed} of {reevaluation.total} completed · {reevaluation.failed} failed</p></div><StatusPill label={reevaluation.status} tone={tone} /></div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-surface"><div className={`h-full rounded-full transition-[width] ${reevaluation.failed ? "bg-red-500" : reevaluation.status === "COMPLETED" ? "bg-green-500" : "bg-yellow"}`} style={{ width: `${progress}%` }} /></div>
      <p className="mt-2 text-right text-[10px] font-mono text-gray-500">{progress}%</p>
    </section>
  );
}

function assignmentSchedule(assignment: TeacherAssignment, deleted: boolean): { label: string; detail: string; tone: "success" | "warning" | "error" | "info" | "neutral" } {
  if (deleted) return { label: "Deleted", detail: `Deleted assignment · updated ${formatDate(assignment.updatedAt)}`, tone: "neutral" };
  const now = Date.now();
  if (assignment.launchDate && Date.parse(assignment.launchDate) > now) return { label: "Scheduled", detail: `Opens ${formatDateTime(assignment.launchDate)}`, tone: "info" };
  if (assignment.closeDate && Date.parse(assignment.closeDate) <= now) return { label: "Closed", detail: `Closed ${formatDateTime(assignment.closeDate)}`, tone: "neutral" };
  if (assignment.dueDate && Date.parse(assignment.dueDate) < now) return { label: "Overdue", detail: `Due ${formatDateTime(assignment.dueDate)}`, tone: "error" };
  if (assignment.dueDate) return { label: "Open", detail: `Due ${formatDateTime(assignment.dueDate)}`, tone: "success" };
  return { label: "Open", detail: "No due date", tone: "success" };
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
