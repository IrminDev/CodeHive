import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

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
  StudentExplorer,
  assignmentNeedsAttention,
  type AnalyticsTab,
  type AssignmentAnalyticsFilter,
  type AssignmentAnalyticsSort,
  type StudentAnalyticsFilter,
  type StudentAnalyticsSort,
} from "../components/TeacherAnalyticsExplorer";
import {
  AnalyticsGroupContext,
  AnalyticsOverview,
  groupLifecycle,
  type AnalyticsHealth,
} from "../components/TeacherAnalyticsOverview";
import { TeacherShell } from "../components/TeacherShell";
import {
  TeacherEmpty,
  TeacherError,
  TeacherLoading,
  TeacherPageHeader,
} from "../components/TeacherUI";
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
  const [assignmentSort, setAssignmentSort] = useState<AssignmentAnalyticsSort>("attention");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentFilter, setStudentFilter] = useState<StudentAnalyticsFilter>("all");
  const [studentSort, setStudentSort] = useState<StudentAnalyticsSort>("risk");

  const groupId = params.get("groupId") ?? "";
  const assignmentId = params.get("assignmentId") ?? "";
  const tab: AnalyticsTab = params.get("view") === "students" ? "students" : "assignments";

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
    setOverview(null);
    setAssignments([]);
    setStudents([]);
    setOverviewError(undefined);
    setAssignmentsError(undefined);
    setStudentsError(undefined);
    setDetail(null);

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
      if (!cancelled) setMetricsLoading(false);
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
    pendingGrades: assignments.reduce((total, item) => total + Math.max(0, item.submittedCount - item.draftGrades - item.returnedGrades), 0),
  }), [assignments, overview]);

  const visibleAssignments = useMemo(() => {
    const query = assignmentQuery.trim().toLowerCase();
    return assignments
      .filter((item) => !query || item.title.toLowerCase().includes(query))
      .filter((item) => {
        if (assignmentFilter === "attention") return assignmentNeedsAttention(item);
        if (assignmentFilter === "overdue") return item.overdue && item.missingCount > 0;
        if (assignmentFilter === "grading") return item.submittedCount > item.draftGrades + item.returnedGrades;
        return true;
      })
      .sort((left, right) => compareAssignments(left, right, assignmentSort));
  }, [assignments, assignmentFilter, assignmentQuery, assignmentSort]);

  const visibleStudents = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    return students
      .filter((student) => !query || student.fullName.toLowerCase().includes(query) || student.enrollmentNumber.toLowerCase().includes(query))
      .filter((student) => {
        if (studentFilter === "missing") return student.missingAssignmentIds.length > 0;
        if (studentFilter === "late") return student.lateCount > 0;
        if (studentFilter === "ungraded") return student.gradedAssignments < student.submittedCount;
        if (studentFilter === "complete") return student.completionRate === 100;
        return true;
      })
      .sort((left, right) => compareStudents(left, right, studentSort));
  }, [studentFilter, studentQuery, studentSort, students]);

  function selectGroup(nextGroupId: string) {
    setAssignmentQuery("");
    setStudentQuery("");
    updateParams({ groupId: nextGroupId, assignmentId: undefined });
  }

  return (
    <TeacherShell
      active="analytics"
      breadcrumbs={[{ label: "Teacher", to: "/teacher" }, { label: "Analytics" }]}
      contentClassName="max-w-7xl"
    >
      <TeacherPageHeader
        eyebrow="Performance"
        title="Analytics"
        description="Spot delivery risk, grading work, and student progress across current and historical classes."
      />

      {groupsLoading ? (
        <TeacherLoading rows={6} />
      ) : groupsError ? (
        <TeacherError message={groupsError} onRetry={() => setGroupsRefreshVersion((value) => value + 1)} />
      ) : groups.length === 0 ? (
        <TeacherEmpty title="No owned groups" description="Create a group before reviewing analytics." />
      ) : (
        <>
          <AnalyticsGroupContext
            groups={groups}
            selected={selectedGroup}
            generatedAt={overview?.generatedAt}
            refreshing={metricsLoading}
            onSelect={selectGroup}
            onRefresh={() => setRefreshVersion((value) => value + 1)}
          />

          {metricsLoading && !overview && !assignments.length && !students.length ? (
            <TeacherLoading rows={6} />
          ) : (
            <div className="space-y-5">
              {overview ? (
                <AnalyticsOverview overview={overview} health={health} />
              ) : overviewError ? (
                <TeacherError message={overviewError} onRetry={() => setRefreshVersion((value) => value + 1)} />
              ) : null}

              <div>
                <AnalyticsTabs
                  value={tab}
                  assignments={assignments.length}
                  students={students.length}
                  onChange={(value) => updateParams({ view: value })}
                />
                {tab === "assignments" ? (
                  <AssignmentExplorer
                    assignments={visibleAssignments}
                    query={assignmentQuery}
                    filter={assignmentFilter}
                    sort={assignmentSort}
                    error={assignmentsError}
                    onQuery={setAssignmentQuery}
                    onFilter={setAssignmentFilter}
                    onSort={setAssignmentSort}
                    onOpen={(id) => updateParams({ assignmentId: id }, false)}
                    onRetry={() => setRefreshVersion((value) => value + 1)}
                  />
                ) : (
                  <StudentExplorer
                    students={visibleStudents}
                    query={studentQuery}
                    filter={studentFilter}
                    sort={studentSort}
                    groupId={groupId}
                    assignmentTitles={assignmentTitles}
                    error={studentsError}
                    onQuery={setStudentQuery}
                    onFilter={setStudentFilter}
                    onSort={setStudentSort}
                    onRetry={() => setRefreshVersion((value) => value + 1)}
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}

      {assignmentId && (
        <AssignmentAnalyticsDrawer
          assignment={selectedAssignment}
          detail={detail}
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

function compareAssignments(left: AssignmentMetrics, right: AssignmentMetrics, sort: AssignmentAnalyticsSort): number {
  if (sort === "title") return left.title.localeCompare(right.title);
  if (sort === "completion") return nullableDescending(left.submissionRate, right.submissionRate);
  if (sort === "missing") return right.missingCount - left.missingCount || left.title.localeCompare(right.title);
  return Number(assignmentNeedsAttention(right)) - Number(assignmentNeedsAttention(left))
    || Number(right.overdue) - Number(left.overdue)
    || right.missingCount - left.missingCount
    || left.title.localeCompare(right.title);
}

function compareStudents(left: StudentMetrics, right: StudentMetrics, sort: StudentAnalyticsSort): number {
  if (sort === "name") return left.fullName.localeCompare(right.fullName);
  if (sort === "completion") return nullableDescending(left.completionRate, right.completionRate);
  if (sort === "score") return nullableDescending(left.averageScore, right.averageScore);
  const leftRisk = left.missingAssignmentIds.length * 3 + left.lateCount + Math.max(0, left.submittedCount - left.gradedAssignments);
  const rightRisk = right.missingAssignmentIds.length * 3 + right.lateCount + Math.max(0, right.submittedCount - right.gradedAssignments);
  return rightRisk - leftRisk || left.fullName.localeCompare(right.fullName);
}

function nullableDescending(left: number | null, right: number | null): number {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return right - left;
}

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}
