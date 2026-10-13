import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router";

import { listTeacherGroups } from "../api/group.api";
import {
  getAssignmentMetrics,
  getGroupMetricsOverview,
  listAssignmentMetrics,
  listStudentMetrics,
} from "../api/metrics.api";
import {
  AssignmentAnalyticsDrawer,
} from "../components/TeacherAnalyticsDrawer";
import {
  AnalyticsTabs,
  AssignmentExplorer,
  PRIORITY_SORT,
  StudentExplorer,
  assignmentNeedsAttention,
  sortAssignments,
  sortStudents,
  ungradedCount,
  type AnalyticsTab,
  type AssignmentAnalyticsFilter,
  type AssignmentSortKey,
  type SortState,
  type StudentAnalyticsFilter,
  type StudentSortKey,
} from "../components/TeacherAnalyticsExplorer";
import { AttentionSection, StrugglePanel } from "../components/TeacherAnalyticsAttention";
import {
  AnalyticsContextLine,
  AnalyticsGroupControls,
  AnalyticsOverview,
  VerdictBreakdown,
  groupLifecycle,
  type AnalyticsHealth,
} from "../components/TeacherAnalyticsOverview";
import { TeacherStudentAnalyticsDrawer } from "../components/TeacherStudentAnalyticsDrawer";
import { TeacherShell } from "../components/TeacherShell";
import {
  TeacherEmpty,
  TeacherError,
  TeacherLoading,
  TeacherPageHeader,
} from "../components/TeacherUI";
import { TeacherGroupAiUsage, useTeacherAiUsage } from "../components/TeacherAiUsage";
import type { TeacherGroup } from "../types/group.types";
import type {
  AssignmentMetrics,
  AssignmentMetricsDetail,
  GroupMetricsOverview,
  StudentMetrics,
} from "../types/metrics.types";

export function TeacherAnalyticsPage() {
  const [params, setParams] = useSearchParams();
  const [groups, setGroups] = useState<TeacherGroup[]>([]);
  const [overview, setOverview] = useState<GroupMetricsOverview | null>(null);
  const [assignments, setAssignments] = useState<AssignmentMetrics[]>([]);
  const [students, setStudents] = useState<StudentMetrics[]>([]);
  const [detail, setDetail] = useState<AssignmentMetricsDetail | null>(null);

  const [groupsLoading, setGroupsLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [groupsError, setGroupsError] = useState<string>();
  const [overviewError, setOverviewError] = useState<string>();
  const [assignmentsError, setAssignmentsError] = useState<string>();
  const [studentsError, setStudentsError] = useState<string>();
  const [detailError, setDetailError] = useState<string>();
  const [groupsRefreshVersion, setGroupsRefreshVersion] = useState(0);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [detailRefreshVersion, setDetailRefreshVersion] = useState(0);

  const [assignmentQuery, setAssignmentQuery] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentAnalyticsFilter>("all");
  const [assignmentSort, setAssignmentSort] = useState<SortState<AssignmentSortKey>>(PRIORITY_SORT);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentFilter, setStudentFilter] = useState<StudentAnalyticsFilter>("all");
  const [studentSort, setStudentSort] = useState<SortState<StudentSortKey>>(PRIORITY_SORT);
  const explorer = useRef<HTMLDivElement>(null);
  const loadedGroup = useRef("");
  const { hash } = useLocation();

  const groupId = params.get("groupId") ?? "";
  const assignmentId = params.get("assignmentId") ?? "";
  const studentId = params.get("studentId") ?? "";
  const aiUsage = useTeacherAiUsage(groupId, refreshVersion);

  useEffect(() => {
    if (!params.has("section")) return;
    setParams(current => { const next = new URLSearchParams(current); next.delete("section"); return next; }, { replace: true });
  }, [params, setParams]);
  // Older links point at the AI section by anchor; it now lives in its own tab.
  useEffect(() => {
    if (hash !== "#ai-usage" || params.get("view") === "ai") return;
    setParams(current => { const next = new URLSearchParams(current); next.set("view", "ai"); return next; }, { replace: true });
  }, [hash, params, setParams]);
  const view = params.get("view");
  const tab: AnalyticsTab = view === "students" || view === "ai" ? view : "assignments";

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

  useEffect(() => {
    let cancelled = false;
    setGroupsLoading(true);
    setGroupsError(undefined);
    void listTeacherGroups(true)
      .then((items) => {
        if (cancelled) return;
        setGroups(items);
        setParams((current) => {
          const existing = current.get("groupId");
          if (existing && items.some((group) => group.id === existing)) return current;
          const preferred = [...items].sort(compareGroupPriority)[0];
          const next = new URLSearchParams(current);
          if (preferred) next.set("groupId", preferred.id);
          else next.delete("groupId");
          next.delete("assignmentId");
          next.delete("studentId");
          return next;
        }, { replace: true });
      })
      .catch((cause) => {
        if (!cancelled) setGroupsError(errorMessage(cause, "Could not load owned groups."));
      })
      .finally(() => {
        if (!cancelled) setGroupsLoading(false);
      });
    return () => { cancelled = true; };
  }, [groupsRefreshVersion, setParams]);

  useEffect(() => {
    if (!groupId) {
      setOverview(null);
      setAssignments([]);
      setStudents([]);
      return;
    }
    let cancelled = false;
    setMetricsLoading(true);
    // A refresh of the same group keeps the previous numbers on screen until new ones arrive.
    if (loadedGroup.current !== groupId) {
      setOverview(null);
      setAssignments([]);
      setStudents([]);
      setDetail(null);
    }
    setOverviewError(undefined);
    setAssignmentsError(undefined);
    setStudentsError(undefined);

    void Promise.allSettled([
      getGroupMetricsOverview(groupId),
      listAssignmentMetrics(groupId),
      listStudentMetrics(groupId),
    ]).then(([overviewResult, assignmentResult, studentResult]) => {
      if (cancelled) return;
      if (overviewResult.status === "fulfilled") setOverview(overviewResult.value);
      else {
        setOverview(null);
        setOverviewError(errorMessage(overviewResult.reason, "Could not load group overview."));
      }
      if (assignmentResult.status === "fulfilled") setAssignments(assignmentResult.value);
      else {
        setAssignments([]);
        setAssignmentsError(errorMessage(assignmentResult.reason, "Could not load assignment metrics."));
      }
      if (studentResult.status === "fulfilled") setStudents(studentResult.value);
      else {
        setStudents([]);
        setStudentsError(errorMessage(studentResult.reason, "Could not load student metrics."));
      }
    }).finally(() => {
      if (cancelled) return;
      loadedGroup.current = groupId;
      setMetricsLoading(false);
    });
    return () => { cancelled = true; };
  }, [groupId, refreshVersion]);

  useEffect(() => {
    if (!assignmentId) {
      setDetail(null);
      setDetailError(undefined);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(undefined);
    void getAssignmentMetrics(assignmentId)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .catch((cause) => {
        if (!cancelled) {
          setDetail(null);
          setDetailError(errorMessage(cause, "Could not load assignment detail."));
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => { cancelled = true; };
  }, [assignmentId, detailRefreshVersion]);

  const selectedGroup = groups.find((group) => group.id === groupId);
  const selectedStudent = students.find(student => student.studentId === studentId);
  const selectedAssignment = assignments.find((item) => item.assignmentId === assignmentId);
  const assignmentTitles = useMemo(
    () => new Map(assignments.map((item) => [item.assignmentId, item.title])),
    [assignments],
  );

  const health = useMemo<AnalyticsHealth>(() => ({
    overdueAssignments: assignments.filter((item) => item.overdue && item.missingCount > 0).length,
    missingSubmissions: assignments.reduce((total, item) => total + item.missingCount, 0),
    processingAssignments: overview?.assignments.processing ?? assignments.filter((item) => item.validationStatus === "PROCESSING").length,
    failedAssignments: overview?.assignments.failed ?? assignments.filter((item) => item.validationStatus === "FAILED").length,
    pendingGrades: assignments.reduce((total, item) => total + ungradedCount(item), 0),
  }), [assignments, overview]);

  const totals = useMemo(() => ({
    expected: assignments.reduce((total, item) => total + item.submittedCount + item.missingCount, 0),
    submitted: assignments.reduce((total, item) => total + item.submittedCount, 0),
    late: assignments.reduce((total, item) => total + item.lateCount, 0),
  }), [assignments]);

  const visibleAssignments = useMemo(() => {
    const query = assignmentQuery.trim().toLowerCase();
    return sortAssignments(assignments
      .filter((item) => !query || item.title.toLowerCase().includes(query))
      .filter((item) => {
        if (assignmentFilter === "attention") return assignmentNeedsAttention(item);
        if (assignmentFilter === "overdue") return item.overdue && item.missingCount > 0;
        if (assignmentFilter === "grading") return ungradedCount(item) > 0;
        return true;
      }), assignmentSort);
  }, [assignments, assignmentFilter, assignmentQuery, assignmentSort]);

  const visibleStudents = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    return sortStudents(students
      .filter((student) => !query || student.fullName.toLowerCase().includes(query) || student.enrollmentNumber.toLowerCase().includes(query))
      .filter((student) => {
        if (studentFilter === "missing") return student.missingAssignmentIds.length > 0;
        if (studentFilter === "late") return student.lateCount > 0;
        if (studentFilter === "ungraded") return student.gradedAssignments < student.submittedCount;
        if (studentFilter === "complete") return student.completionRate === 100;
        return true;
      }), studentSort);
  }, [studentFilter, studentQuery, studentSort, students]);

  function selectGroup(nextGroupId: string) {
    setAssignmentQuery("");
    setStudentQuery("");
    setAssignmentFilter("all");
    setStudentFilter("all");
    updateParams({ groupId: nextGroupId, assignmentId: undefined, studentId: undefined });
  }

  function scrollToExplorer() {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => explorer.current?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" }));
  }

  function showAssignments(filter: AssignmentAnalyticsFilter) {
    setAssignmentQuery("");
    setAssignmentFilter(filter);
    setAssignmentSort(PRIORITY_SORT);
    updateParams({ view: undefined });
    scrollToExplorer();
  }

  function showStudents(filter: StudentAnalyticsFilter) {
    setStudentQuery("");
    setStudentFilter(filter);
    setStudentSort(PRIORITY_SORT);
    updateParams({ view: "students" });
    scrollToExplorer();
  }

  const hasData = Boolean(overview || assignments.length || students.length);

  return (
    <TeacherShell
      active="analytics"
      breadcrumbs={[{ label: "Teacher", to: "/teacher" }, { label: "Analytics" }]}
      contentClassName="max-w-7xl"
    >
      <TeacherPageHeader
        eyebrow="Performance"
        title="Analytics"
        description="Delivery, grading, and AI usage for one class at a time."
        actions={groups.length > 0 ? (
          <AnalyticsGroupControls
            groups={groups}
            selected={selectedGroup}
            refreshing={metricsLoading}
            onSelect={selectGroup}
            onRefresh={() => setRefreshVersion((value) => value + 1)}
          />
        ) : undefined}
      />

      {groupsLoading ? (
        <TeacherLoading rows={6} />
      ) : groupsError ? (
        <TeacherError message={groupsError} onRetry={() => setGroupsRefreshVersion((value) => value + 1)} />
      ) : groups.length === 0 ? (
        <TeacherEmpty title="No owned groups" description="Create a group before reviewing analytics." />
      ) : (
        <>
          <AnalyticsContextLine selected={selectedGroup} overview={overview} />

          {metricsLoading && !hasData ? (
            <TeacherLoading rows={6} />
          ) : (
            <div aria-busy={metricsLoading} className={`space-y-5 transition-opacity ${metricsLoading ? "opacity-60" : ""}`}>
              {overview ? (
                <AnalyticsOverview overview={overview} health={health} totals={totals} />
              ) : overviewError ? (
                <TeacherError message={overviewError} onRetry={() => setRefreshVersion((value) => value + 1)} />
              ) : null}

              <AttentionSection
                assignments={assignments}
                students={students}
                groupId={groupId}
                onOpenAssignment={(id) => updateParams({ assignmentId: id, studentId: undefined }, false)}
                onOpenStudent={(id) => updateParams({ studentId: id, assignmentId: undefined }, false)}
                onShowAssignments={showAssignments}
                onShowStudents={showStudents}
              />

              <div className="grid gap-5 lg:grid-cols-2">
                <StrugglePanel
                  assignments={assignments}
                  onOpenAssignment={(id) => updateParams({ assignmentId: id, studentId: undefined }, false)}
                />
                <VerdictBreakdown assignments={assignments} />
              </div>

              <div ref={explorer} className="scroll-mt-4 space-y-4">
                <AnalyticsTabs
                  value={tab}
                  assignments={assignments.length}
                  students={students.length}
                  onChange={(value) => updateParams({ view: value === "assignments" ? undefined : value })}
                />
                {tab === "assignments" ? (
                  <AssignmentExplorer
                    assignments={visibleAssignments}
                    total={assignments.length}
                    query={assignmentQuery}
                    filter={assignmentFilter}
                    sort={assignmentSort}
                    error={assignmentsError}
                    onQuery={setAssignmentQuery}
                    onFilter={setAssignmentFilter}
                    onSort={setAssignmentSort}
                    onOpen={(id) => updateParams({ assignmentId: id, studentId: undefined }, false)}
                    onRetry={() => setRefreshVersion((value) => value + 1)}
                  />
                ) : tab === "students" ? (
                  <StudentExplorer
                    students={visibleStudents}
                    total={students.length}
                    onOpen={(id) => updateParams({ studentId: id, assignmentId: undefined }, false)}
                    query={studentQuery}
                    filter={studentFilter}
                    sort={studentSort}
                    error={studentsError}
                    onQuery={setStudentQuery}
                    onFilter={setStudentFilter}
                    onSort={setStudentSort}
                    onRetry={() => setRefreshVersion((value) => value + 1)}
                  />
                ) : (
                  <TeacherGroupAiUsage
                    usage={aiUsage}
                    onOpenAssignment={(id) => updateParams({ assignmentId: id, studentId: undefined }, false)}
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}

      {selectedStudent && (
        <TeacherStudentAnalyticsDrawer
          key={`${groupId}:${studentId}`}
          student={selectedStudent}
          groupId={groupId}
          assignmentTitles={assignmentTitles}
          refreshVersion={refreshVersion}
          onClose={() => updateParams({ studentId: undefined })}
        />
      )}

      {assignmentId && !studentId && (
        <AssignmentAnalyticsDrawer
          assignment={selectedAssignment}
          aiUsage={aiUsage.assignments?.get(assignmentId)}
          aiUsageLoading={!aiUsage.assignments && !aiUsage.assignmentsError}
          aiUsageUnavailable={Boolean(aiUsage.assignmentsError)}
          onRetryAiUsage={aiUsage.refresh}
          onOpenStudent={(id) => updateParams({ studentId: id, assignmentId: undefined }, false)}
          detail={detail?.assignmentId === assignmentId ? detail : null}
          groupId={groupId}
          loading={detailLoading}
          error={detailError}
          onClose={() => updateParams({ assignmentId: undefined })}
          onRetry={() => setDetailRefreshVersion((value) => value + 1)}
        />
      )}
    </TeacherShell>
  );
}

function compareGroupPriority(left: TeacherGroup, right: TeacherGroup): number {
  const priority = { active: 0, archived: 1, deleted: 2 };
  const lifecycleDifference = priority[groupLifecycle(left)] - priority[groupLifecycle(right)];
  return lifecycleDifference || Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
}

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}
