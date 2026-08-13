import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Archive, ChevronRight, ClipboardList, Plus, Trash2, Users } from "lucide-react";
import { sileo } from "sileo";

import { DashboardLayout } from "~/shared/components/DashboardLayout";
import { listTeacherGroups } from "../api/group.api";
import { getGroupMetricsOverview } from "../api/metrics.api";
import { TEACHER_NAV, TEACHER_SIDEBAR_ITEMS } from "../config/dashboard.config";
import type { TeacherGroup } from "../types/group.types";

type GroupTab = "active" | "archived" | "deleted";
type GroupCardData = TeacherGroup & { students: number; assignments: number };

function lifecycle(group: TeacherGroup): GroupTab {
  if (!group.isActive) return "deleted";
  return group.archived ? "archived" : "active";
}

function initials(name: string): string {
  const words = name.split(/\s+|·/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function GroupStatus({ status }: { status: GroupTab }) {
  const styles: Record<GroupTab, string> = {
    active: "text-emerald-600 dark:text-emerald-400",
    archived: "text-amber-600 dark:text-yellow",
    deleted: "text-red-600 dark:text-red-400",
  };
  return <span className={`text-xs font-semibold capitalize ${styles[status]}`}>{status}</span>;
}

export function TeacherGroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupCardData[]>([]);
  const [tab, setTab] = useState<GroupTab>("active");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void listTeacherGroups(true)
      .then(async (items) => {
        const metrics = await Promise.allSettled(
          items.map((group) =>
            group.isActive ? getGroupMetricsOverview(group.id) : Promise.resolve(null),
          ),
        );
        if (cancelled) return;
        setGroups(items.map((group, index) => {
          const result = metrics[index];
          const overview = result.status === "fulfilled" ? result.value : null;
          return {
            ...group,
            students: overview?.enrollment.active ?? 0,
            assignments: overview?.assignments.total ?? 0,
          };
        }));
      })
      .catch((error) => {
        if (!cancelled) {
          sileo.error({ title: error instanceof Error ? error.message : "Failed to load groups." });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const counts = useMemo(() => ({
    active: groups.filter((group) => lifecycle(group) === "active").length,
    archived: groups.filter((group) => lifecycle(group) === "archived").length,
    deleted: groups.filter((group) => lifecycle(group) === "deleted").length,
  }), [groups]);
  const filtered = groups.filter((group) => lifecycle(group) === tab);

  return (
    <DashboardLayout logoLinkTo="/teacher" navLinks={TEACHER_NAV} sidebarItems={TEACHER_SIDEBAR_ITEMS}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold tracking-widest text-azure dark:text-yellow uppercase">Group management</p>
          <h1 className="text-3xl font-bold mt-2">My groups</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {groups.length} owned group{groups.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link to="/teacher/groups/create" className="btn-primary inline-flex items-center gap-2">
          <Plus size={16} /> Create group
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {(["active", "archived", "deleted"] as GroupTab[]).map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
              tab === value
                ? "bg-azure text-white dark:bg-yellow dark:text-imperial"
                : "bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400"
            }`}
          >
            {value} <span className="ml-1 opacity-70">{counts[value]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-500">Loading groups…</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40">
          {tab === "archived" ? <Archive className="mx-auto mb-3 text-gray-400" /> :
            tab === "deleted" ? <Trash2 className="mx-auto mb-3 text-gray-400" /> :
              <Users className="mx-auto mb-3 text-gray-400" />}
          <p className="text-gray-500">No {tab} groups.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((group) => (
            <button
              key={group.id}
              onClick={() => navigate(`/teacher/groups/${group.id}`)}
              className="text-left bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-5 hover:border-azure/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="w-11 h-11 rounded-xl bg-azure text-white flex items-center justify-center font-bold">
                  {initials(group.name)}
                </div>
                <GroupStatus status={lifecycle(group)} />
              </div>
              <h2 className="font-semibold text-lg mt-4 line-clamp-1">{group.name}</h2>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2 min-h-10">
                {group.description || "No description"}
              </p>
              <div className="flex items-center gap-4 mt-5 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1.5"><Users size={14} /> {group.students}</span>
                <span className="inline-flex items-center gap-1.5"><ClipboardList size={14} /> {group.assignments}</span>
                <ChevronRight size={16} className="ml-auto" />
              </div>
            </button>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
