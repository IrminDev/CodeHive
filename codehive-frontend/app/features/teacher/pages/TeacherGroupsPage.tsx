import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleAlert, Plus } from "lucide-react";
import { Link } from "react-router";

import { listTeacherGroups } from "../api/group.api";
import { getGroupMetricsOverview } from "../api/metrics.api";
import {
  GroupCardSkeletons,
  GroupsEmptyState,
  GroupToolbar,
  LifecycleSummary,
  lifecycle,
  TeacherGroupCard,
  type GroupCardData,
  type GroupSort,
  type GroupTab,
} from "../components/TeacherGroupsUI";
import { TeacherShell } from "../components/TeacherShell";
import { TeacherError, TeacherPageHeader } from "../components/TeacherUI";

const TABS: GroupTab[] = ["active", "archived"];

export function TeacherGroupsPage() {
  const [groups, setGroups] = useState<GroupCardData[]>([]);
  const [tab, setTab] = useState<GroupTab>("active");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<GroupSort>("updated");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = (await listTeacherGroups()).filter((group) => group.isActive);
      const metricResults = await Promise.allSettled(
        items.map((group) => getGroupMetricsOverview(group.id)),
      );
      setGroups(
        items.map((group, index) => {
          const result = metricResults[index];
          const overview = result.status === "fulfilled" ? result.value : null;
          return {
            ...group,
            students: overview?.enrollment.active ?? null,
            assignments: overview?.assignments.total ?? null,
            metricsAvailable: overview != null,
          };
        }),
      );
    } catch (cause) {
      setGroups([]);
      setError(
        cause instanceof Error ? cause.message : "Could not load groups.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () =>
      TABS.reduce<Record<GroupTab, number>>(
        (result, value) => ({
          ...result,
          [value]: groups.filter((group) => lifecycle(group) === value).length,
        }),
        { active: 0, archived: 0 },
      ),
    [groups],
  );

  const visibleGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return groups
      .filter((group) => lifecycle(group) === tab)
      .filter(
        (group) =>
          !normalizedQuery ||
          group.name.toLowerCase().includes(normalizedQuery) ||
          group.description?.toLowerCase().includes(normalizedQuery),
      )
      .sort((left, right) => compareGroups(left, right, sort));
  }, [groups, query, sort, tab]);

  const unavailableMetrics = groups.filter(
    (group) => !group.metricsAvailable,
  ).length;

  function selectTab(nextTab: GroupTab) {
    if (query.trim()) {
      const hasMatch = groups.some(
        (group) => lifecycle(group) === nextTab && matchesQuery(group, query),
      );
      if (!hasMatch) setQuery("");
    }
    setTab(nextTab);
  }

  return (
    <TeacherShell
      active="groups"
      breadcrumbs={[{ label: "Teacher", to: "/teacher" }, { label: "Groups" }]}
    >
      <TeacherPageHeader
        eyebrow="Group management"
        title="My groups"
        description={`${groups.length} owned group${groups.length === 1 ? "" : "s"}. Organize rosters, assignments, and historical classes.`}
        actions={
          <Link
            to="/teacher/groups/create"
            className="btn-primary inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Create group
          </Link>
        }
      />

      {error && !loading ? (
        <TeacherError message={error} onRetry={() => void load()} />
      ) : (
        <>
          <LifecycleSummary
            selected={tab}
            counts={counts}
            onSelect={selectTab}
          />
          <GroupToolbar
            query={query}
            sort={sort}
            onQuery={setQuery}
            onSort={setSort}
          />

          {unavailableMetrics > 0 && !loading && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-xs text-orange-600 dark:text-orange-400">
              <CircleAlert size={15} className="mt-0.5 flex-shrink-0" />
              <p>
                Metrics unavailable for {unavailableMetrics} group
                {unavailableMetrics === 1 ? "" : "s"}. Group details remain
                accessible.
              </p>
            </div>
          )}

          {loading ? (
            <GroupCardSkeletons />
          ) : visibleGroups.length === 0 ? (
            <GroupsEmptyState
              tab={tab}
              searching={Boolean(query.trim())}
              onClear={() => setQuery("")}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleGroups.map((group) => (
                <TeacherGroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </>
      )}
    </TeacherShell>
  );
}

function matchesQuery(group: GroupCardData, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  return (
    group.name.toLowerCase().includes(normalized) ||
    Boolean(group.description?.toLowerCase().includes(normalized))
  );
}

function compareGroups(
  left: GroupCardData,
  right: GroupCardData,
  sort: GroupSort,
): number {
  if (sort === "name")
    return left.name.localeCompare(right.name, undefined, {
      sensitivity: "base",
    });
  if (sort === "students")
    return (
      compareNullableMetric(left.students, right.students) ||
      newestFirst(left.updatedAt, right.updatedAt)
    );
  if (sort === "assignments")
    return (
      compareNullableMetric(left.assignments, right.assignments) ||
      newestFirst(left.updatedAt, right.updatedAt)
    );
  return newestFirst(left.updatedAt, right.updatedAt);
}

function compareNullableMetric(
  left: number | null,
  right: number | null,
): number {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return right - left;
}

function newestFirst(left: string, right: string): number {
  return Date.parse(right) - Date.parse(left);
}
