import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { sileo } from "sileo";

import {
  deleteAssignment,
  getAssignmentManagementStatus,
  getTeacherAssignment,
  getTeacherAssignmentPage,
  restoreAssignment,
} from "../api/assignment.api";
import { listTeacherGroups } from "../api/group.api";
import {
  AssignmentContextBar,
  AssignmentList,
  AssignmentStatusDrawer,
  assignmentGroupLifecycle,
  type AssignmentLifecycle,
} from "../components/TeacherAssignmentsUI";
import { TeacherShell } from "../components/TeacherShell";
import {
  ConfirmDialog,
  TeacherEmpty,
  TeacherError,
  TeacherLoading,
  TeacherPageHeader,
} from "../components/TeacherUI";
import type {
  AssignmentManagementStatus,
  AssignmentPage,
  AssignmentValidationStatus,
  TeacherAssignment,
} from "../types/assignment.types";
import type { TeacherGroup } from "../types/group.types";

const PAGE_SIZE = 20;
const VALIDATION_REFRESH_INTERVAL_MS = 5_000;

export function TeacherAssignmentsPage() {
  const [params, setParams] = useSearchParams();
  const [groups, setGroups] = useState<TeacherGroup[]>([]);
  const [result, setResult] = useState<AssignmentPage | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [queryInput, setQueryInput] = useState(params.get("query") ?? "");
  const [action, setAction] = useState<{ kind: "delete" | "restore"; assignment: TeacherAssignment } | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<AssignmentManagementStatus | null>(null);
  const [statusAssignment, setStatusAssignment] = useState<TeacherAssignment | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const loadedContext = useRef("");

  const groupId = params.get("groupId") ?? "";
  const lifecycle: AssignmentLifecycle = params.get("lifecycle") === "deleted" ? "deleted" : "active";
  const rawValidation = params.get("validationStatus");
  const validationStatus: "" | AssignmentValidationStatus = isValidationStatus(rawValidation) ? rawValidation : "";
  const query = params.get("query") ?? "";
  const page = parsePage(params.get("page"));
  const statusId = params.get("statusId") ?? "";
  const selectedGroup = groups.find((group) => group.id === groupId);

  function updateParams(changes: Record<string, string | undefined>, replace = true) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(changes).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      return next;
    }, { replace });
  }

  const loadGroups = useCallback(async () => {
    setGroupsLoading(true);
    setGroupsError(null);
    try {
      const items = await listTeacherGroups(true);
      setGroups(items);
      setParams((current) => {
        const currentId = current.get("groupId");
        if (currentId && items.some((group) => group.id === currentId)) return current;
        const preferred = [...items].sort(compareGroupPriority)[0];
        const next = new URLSearchParams(current);
        if (preferred) next.set("groupId", preferred.id);
        else next.delete("groupId");
        next.delete("page");
        next.delete("statusId");
        return next;
      }, { replace: true });
    } catch (cause) {
      setGroups([]);
      setGroupsError(errorMessage(cause, "Could not load groups."));
    } finally {
      setGroupsLoading(false);
    }
  }, [setParams]);

  useEffect(() => { void loadGroups(); }, [loadGroups]);

  const loadAssignments = useCallback(async () => {
    if (!groupId) {
      setResult(null);
      return;
    }
    const context = `${groupId}:${lifecycle}`;
    if (loadedContext.current !== context) {
      loadedContext.current = context;
      setResult(null);
    }
    setListLoading(true);
    setListError(null);
    try {
      const next = await getTeacherAssignmentPage(groupId, page, PAGE_SIZE, {
        query: query.trim() || undefined,
        validationStatus: validationStatus || undefined,
        deletedOnly: lifecycle === "deleted",
      });
      setResult(next);
      if (page > 0 && page >= next.totalPages) {
        updateParams({ page: next.totalPages > 0 ? String(next.totalPages) : undefined });
      }
    } catch (cause) {
      setListError(errorMessage(cause, "Could not load assignments."));
    } finally {
      setListLoading(false);
    }
  }, [groupId, lifecycle, page, query, refreshVersion, validationStatus]);

  useEffect(() => { void loadAssignments(); }, [loadAssignments]);

  useEffect(() => {
    if (!shouldPollAssignmentValidation(result?.content ?? [])) return;
    const timer = window.setTimeout(() => setRefreshVersion((value) => value + 1), VALIDATION_REFRESH_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [result]);

  useEffect(() => { setQueryInput(query); }, [query]);

  useEffect(() => {
    if (queryInput === query) return;
    const timer = window.setTimeout(() => {
      updateParams({ query: queryInput.trim() || undefined, page: undefined });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, queryInput]);

  useEffect(() => {
    if (!statusId) {
      setStatus(null);
      setStatusAssignment(null);
      setStatusLoading(false);
      return;
    }
    let cancelled = false;
    setStatusLoading(true);
    setStatus(null);
    const visible = result?.content.find((assignment) => assignment.id === statusId);
    if (visible) setStatusAssignment(visible);
    void Promise.allSettled([
      getAssignmentManagementStatus(statusId),
      visible ? Promise.resolve(visible) : getTeacherAssignment(statusId),
    ]).then(([statusResult, assignmentResult]) => {
      if (cancelled) return;
      if (statusResult.status === "rejected") {
        sileo.error({ title: errorMessage(statusResult.reason, "Could not load assignment status.") });
        updateParams({ statusId: undefined });
        return;
      }
      setStatus(statusResult.value);
      if (assignmentResult.status === "fulfilled") setStatusAssignment(assignmentResult.value);
    }).finally(() => {
      if (!cancelled) setStatusLoading(false);
    });
    return () => { cancelled = true; };
  }, [statusId]);

  async function runAction() {
    if (!action) return;
    setBusy(true);
    try {
      if (action.kind === "delete") await deleteAssignment(action.assignment.id);
      else await restoreAssignment(action.assignment.id);
      sileo.success({ title: action.kind === "delete" ? "Assignment deleted." : "Assignment restored." });
      setAction(null);
      await loadAssignments();
    } catch (cause) {
      sileo.error({ title: errorMessage(cause, "Action failed.") });
    } finally {
      setBusy(false);
    }
  }

  function selectGroup(nextGroupId: string) {
    updateParams({ groupId: nextGroupId, page: undefined, statusId: undefined }, false);
  }

  function selectLifecycle(nextLifecycle: AssignmentLifecycle) {
    updateParams({ lifecycle: nextLifecycle === "deleted" ? "deleted" : undefined, page: undefined, statusId: undefined }, false);
  }

  function selectValidation(nextStatus: "" | AssignmentValidationStatus) {
    updateParams({ validationStatus: nextStatus || undefined, page: undefined, statusId: undefined }, false);
  }

  function clearFilters() {
    setQueryInput("");
    updateParams({ lifecycle: undefined, validationStatus: undefined, query: undefined, page: undefined, statusId: undefined }, false);
  }

  const assignments = result?.content ?? [];
  const canRestore = Boolean(selectedGroup?.isActive && !selectedGroup.archived);
  const createLink = selectedGroup?.isActive && !selectedGroup.archived
    ? `/teacher/create-assignment?groupId=${encodeURIComponent(selectedGroup.id)}`
    : "/teacher/create-assignment";

  return (
    <TeacherShell active="assignments" breadcrumbs={[{ label: "Teacher", to: "/teacher" }, { label: "Assignments" }]} contentClassName="max-w-7xl">
      <TeacherPageHeader eyebrow="Assignment management" title="Assignments" description="Create, validate, publish, review, clone, and restore programming work." actions={<Link to={createLink} className="btn-primary inline-flex items-center gap-1.5"><Plus size={14} /> Create assignment</Link>} />

      {groupsError && !groupsLoading ? <TeacherError message={groupsError} onRetry={() => void loadGroups()} /> : groupsLoading && groups.length === 0 ? <TeacherLoading rows={5} /> : groups.length === 0 ? (
        <TeacherEmpty title="Create a group first" description="Assignments must belong to an owned group." action={<Link to="/teacher/groups/create" className="btn-primary">Create group</Link>} />
      ) : (
        <>
          <AssignmentContextBar groups={groups} selected={selectedGroup} lifecycle={lifecycle} query={queryInput} validationStatus={validationStatus} loading={listLoading} onGroupChange={selectGroup} onLifecycleChange={selectLifecycle} onQueryChange={setQueryInput} onValidationChange={selectValidation} onClear={clearFilters} onRefresh={() => setRefreshVersion((value) => value + 1)} />

          {listError && !result ? <TeacherError message={listError} onRetry={() => setRefreshVersion((value) => value + 1)} /> : listLoading && !result ? <TeacherLoading rows={5} /> : assignments.length === 0 ? (
            <TeacherEmpty
              title={lifecycle === "deleted" ? "No deleted assignments" : query || validationStatus ? "No matching assignments" : "No assignments yet"}
              description={query || validationStatus ? "Change or clear filters to broaden results." : lifecycle === "deleted" ? "Deleted assignments for this group appear here." : "Create first assignment for selected group."}
              action={query || validationStatus ? <button type="button" onClick={clearFilters} className="btn-outline">Clear filters</button> : lifecycle === "active" ? <Link to={createLink} className="btn-primary">Create assignment</Link> : undefined}
            />
          ) : (
            <>
              {listError && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500">{listError} <button type="button" onClick={() => setRefreshVersion((value) => value + 1)} className="ml-2 font-semibold underline">Retry</button></div>}
              <AssignmentList assignments={assignments} deleted={lifecycle === "deleted"} canRestore={canRestore} loading={listLoading} page={page} pageSize={PAGE_SIZE} totalElements={result?.totalElements ?? 0} totalPages={result?.totalPages ?? 0} onPage={(nextPage) => updateParams({ page: nextPage > 0 ? String(nextPage + 1) : undefined }, false)} onStatus={(assignment) => { setStatusAssignment(assignment); updateParams({ statusId: assignment.id }, false); }} onDelete={(assignment) => setAction({ kind: "delete", assignment })} onRestore={(assignment) => setAction({ kind: "restore", assignment })} />
            </>
          )}
        </>
      )}

      {statusId && <AssignmentStatusDrawer assignment={statusAssignment} status={status} loading={statusLoading} onClose={() => updateParams({ statusId: undefined }, false)} />}
      <ConfirmDialog open={Boolean(action)} title={action?.kind === "delete" ? `Delete ${action.assignment.title}?` : `Restore ${action?.assignment.title}?`} description={action?.kind === "delete" ? "Students lose access, but submissions and grading history remain stored." : "Assignment returns to its group with existing validation and scheduling state."} confirmLabel={busy ? "Working…" : action?.kind === "delete" ? "Delete assignment" : "Restore assignment"} danger={action?.kind === "delete"} busy={busy} onCancel={() => setAction(null)} onConfirm={() => void runAction()} />
    </TeacherShell>
  );
}

function isValidationStatus(value: string | null): value is AssignmentValidationStatus {
  return value === "READY" || value === "PROCESSING" || value === "FAILED";
}

function parsePage(value: string | null): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed - 1 : 0;
}

function compareGroupPriority(left: TeacherGroup, right: TeacherGroup): number {
  const priority = { active: 0, archived: 1, deleted: 2 } as const;
  return priority[assignmentGroupLifecycle(left)] - priority[assignmentGroupLifecycle(right)] || Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
}

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}

export function shouldPollAssignmentValidation(assignments: readonly Pick<TeacherAssignment, "validationStatus">[]): boolean {
  return assignments.some((assignment) => assignment.validationStatus === "PROCESSING");
}
