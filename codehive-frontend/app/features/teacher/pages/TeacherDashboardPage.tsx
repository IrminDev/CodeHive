import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { BookOpen, Clock, GraduationCap, Plus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { sileo } from "sileo";

import { useAuth } from "~/core/providers/AuthProvider";
import { DashboardLayout } from "~/shared/components/DashboardLayout";
import { getTeacherAssignments } from "../api/assignment.api";
import { listTeacherGroups } from "../api/group.api";
import { getGroupMetricsOverview } from "../api/metrics.api";
import { TEACHER_NAV, TEACHER_SIDEBAR_ITEMS } from "../config/dashboard.config";
import type { TeacherAssignment } from "../types/assignment.types";
import type { TeacherGroup } from "../types/group.types";
import type { GroupMetricsOverview } from "../types/metrics.types";

function StatCard({ label, value, detail, icon: Icon }: {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-5">
      <div className="flex justify-between text-gray-500"><span className="text-xs uppercase tracking-widest">{label}</span><Icon size={17} /></div>
      <p className="text-3xl font-bold mt-3">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{detail}</p>
    </div>
  );
}

export function TeacherDashboardPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<TeacherGroup[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [metrics, setMetrics] = useState<GroupMetricsOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void listTeacherGroups(false)
      .then(async (items) => {
        const active = items.filter((group) => group.isActive && !group.archived);
        const [assignmentResults, metricResults] = await Promise.all([
          Promise.allSettled(active.map((group) => getTeacherAssignments(group.id))),
          Promise.allSettled(active.map((group) => getGroupMetricsOverview(group.id))),
        ]);
        if (cancelled) return;
        setGroups(active);
        setAssignments(
          assignmentResults.flatMap((result) => result.status === "fulfilled" ? result.value : [])
            .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)),
        );
        setMetrics(metricResults.flatMap((result) => result.status === "fulfilled" ? [result.value] : []));
      })
      .catch((error) => {
        if (!cancelled) sileo.error({ title: error instanceof Error ? error.message : "Failed to load dashboard." });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const students = metrics.reduce((sum, item) => sum + item.enrollment.active, 0);
    const submitted = metrics.reduce((sum, item) => sum + item.gradingProgress.submitted, 0);
    const graded = metrics.reduce((sum, item) => sum + item.gradingProgress.graded, 0);
    return { students, pendingReviews: Math.max(0, submitted - graded) };
  }, [metrics]);
  const firstName = user?.name?.split(" ")[0] ?? "Teacher";

  return (
    <DashboardLayout logoLinkTo="/teacher" navLinks={TEACHER_NAV} sidebarItems={TEACHER_SIDEBAR_ITEMS}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold text-azure dark:text-yellow">Teacher console</p>
          <h1 className="text-3xl font-bold mt-2">Welcome back, {firstName}.</h1>
          <p className="text-gray-500 mt-1">Live data from owned groups and assignments.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/teacher/groups/create" className="btn-outline inline-flex items-center gap-2"><Plus size={15} /> Group</Link>
          <Link to="/teacher/create-assignment" className="btn-primary inline-flex items-center gap-2"><Plus size={15} /> Assignment</Link>
        </div>
      </div>

      {loading ? <div className="py-20 text-center text-gray-500">Loading dashboard…</div> : <>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard label="Assignments" value={assignments.length} detail={`${assignments.filter((item) => item.validationStatus === "READY").length} ready`} icon={BookOpen} />
          <StatCard label="Active groups" value={groups.length} detail="Owned and writable" icon={Users} />
          <StatCard label="Students" value={stats.students} detail="Active enrollments" icon={GraduationCap} />
          <StatCard label="Pending reviews" value={stats.pendingReviews} detail="Submitted without grade" icon={Clock} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
          <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 overflow-hidden">
            <header className="p-5 border-b border-gray-200 dark:border-gray-700/40 flex justify-between"><h2 className="font-semibold">Recent assignments</h2><Link to="/teacher/assignments" className="text-sm text-azure">View all</Link></header>
            {assignments.length === 0 ? <p className="p-8 text-center text-gray-500">No assignments.</p> : assignments.slice(0, 6).map((assignment) => (
              <div key={assignment.id} className="p-5 border-b last:border-0 border-gray-100 dark:border-gray-700/30 flex items-center gap-4">
                <div className="flex-1 min-w-0"><p className="font-medium truncate">{assignment.title}</p><p className="text-xs text-gray-500 mt-1">{assignment.allowedLanguages.join(", ")} · {assignment.validationStatus}</p></div>
                <span className="text-xs text-gray-500">{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No due date"}</span>
                <Link to={`/teacher/grades?groupId=${assignment.groupId}&assignmentId=${assignment.id}`} className="btn-outline">Review</Link>
              </div>
            ))}
          </section>

          <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 overflow-hidden">
            <header className="p-5 border-b border-gray-200 dark:border-gray-700/40 flex justify-between"><h2 className="font-semibold">My groups</h2><Link to="/teacher/groups" className="text-sm text-azure">View all</Link></header>
            {groups.length === 0 ? <p className="p-8 text-center text-gray-500">No active groups.</p> : groups.map((group) => {
              const overview = metrics.find((item) => item.groupId === group.id);
              return <Link key={group.id} to={`/teacher/groups/${group.id}`} className="block p-5 border-b last:border-0 border-gray-100 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-dark-surface/40"><p className="font-medium">{group.name}</p><p className="text-xs text-gray-500 mt-1">{overview?.enrollment.active ?? 0} students · {overview?.assignments.total ?? 0} assignments</p></Link>;
            })}
          </section>
        </div>
      </>}
    </DashboardLayout>
  );
}
