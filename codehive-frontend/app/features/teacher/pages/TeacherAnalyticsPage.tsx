import { useEffect, useState } from "react";
import { sileo } from "sileo";

import { DashboardLayout } from "~/shared/components/DashboardLayout";
import { listTeacherGroups } from "../api/group.api";
import {
  getAssignmentMetrics,
  getGroupMetricsOverview,
  listAssignmentMetrics,
  listStudentMetrics,
} from "../api/metrics.api";
import { TEACHER_NAV, TEACHER_SIDEBAR_ITEMS } from "../config/dashboard.config";
import type { TeacherGroup } from "../types/group.types";
import type {
  AssignmentMetrics,
  AssignmentMetricsDetail,
  GroupMetricsOverview,
  StudentMetrics,
} from "../types/metrics.types";

function percentage(value: number | null): string {
  return value == null ? "—" : `${value.toFixed(2)}%`;
}

export function TeacherAnalyticsPage() {
  const [groups, setGroups] = useState<TeacherGroup[]>([]);
  const [groupId, setGroupId] = useState("");
  const [overview, setOverview] = useState<GroupMetricsOverview | null>(null);
  const [assignments, setAssignments] = useState<AssignmentMetrics[]>([]);
  const [students, setStudents] = useState<StudentMetrics[]>([]);
  const [detail, setDetail] = useState<AssignmentMetricsDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void listTeacherGroups(false)
      .then((items) => {
        if (cancelled) return;
        const active = items.filter((group) => group.isActive);
        setGroups(active);
        setGroupId(active[0]?.id ?? "");
        if (!active.length) setLoading(false);
      })
      .catch((error) => {
        if (!cancelled) sileo.error({ title: error instanceof Error ? error.message : "Failed to load groups." });
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    setLoading(true);
    setDetail(null);
    void Promise.all([
      getGroupMetricsOverview(groupId),
      listAssignmentMetrics(groupId),
      listStudentMetrics(groupId),
    ])
      .then(([overviewResult, assignmentResult, studentResult]) => {
        if (cancelled) return;
        setOverview(overviewResult);
        setAssignments(assignmentResult);
        setStudents(studentResult);
      })
      .catch((error) => {
        if (!cancelled) sileo.error({ title: error instanceof Error ? error.message : "Failed to load analytics." });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [groupId]);

  async function showAssignment(assignmentId: string) {
    try {
      setDetail(await getAssignmentMetrics(assignmentId));
    } catch (error) {
      sileo.error({ title: error instanceof Error ? error.message : "Failed to load assignment metrics." });
    }
  }

  return (
    <DashboardLayout logoLinkTo="/teacher" navLinks={TEACHER_NAV} sidebarItems={TEACHER_SIDEBAR_ITEMS}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
        <div><p className="text-xs uppercase tracking-widest font-semibold text-azure dark:text-yellow">Performance</p><h1 className="text-3xl font-bold mt-2">Analytics</h1><p className="text-gray-500 mt-1">Submission, punctuality, grading, and student metrics.</p></div>
        <select value={groupId} onChange={(event) => setGroupId(event.target.value)} className="px-4 py-3 rounded-xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700"><option value="">No group</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select>
      </div>

      {loading ? <div className="py-20 text-center text-gray-500">Loading analytics…</div> : !overview ? <div className="py-20 text-center text-gray-500">Select owned group.</div> : <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[["Active students", overview.enrollment.active], ["Published assignments", overview.assignments.published], ["Submission rate", percentage(overview.overallSubmissionRate)], ["Average score", percentage(overview.overallAverageScore)]].map(([label, value]) => <div key={label as string} className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 p-5"><p className="text-xs uppercase tracking-widest text-gray-500">{label}</p><p className="text-2xl font-bold mt-2">{value}</p></div>)}
        </div>

        <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 overflow-hidden">
          <header className="p-5 border-b border-gray-200 dark:border-gray-700/40"><h2 className="font-semibold">Assignment metrics</h2></header>
          {assignments.length === 0 ? <p className="p-8 text-center text-gray-500">No assignments.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-gray-500 bg-gray-50 dark:bg-dark-surface"><tr><th className="p-4">Assignment</th><th className="p-4">Submitted</th><th className="p-4">Rate</th><th className="p-4">On time</th><th className="p-4">Average</th><th className="p-4">Missing</th></tr></thead><tbody>{assignments.map((item) => <tr key={item.assignmentId} onClick={() => void showAssignment(item.assignmentId)} className="border-t border-gray-100 dark:border-gray-700/30 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-surface/40"><td className="p-4 font-medium">{item.title}</td><td className="p-4">{item.submittedCount}/{item.activeStudents}</td><td className="p-4">{percentage(item.submissionRate)}</td><td className="p-4">{percentage(item.onTimeRate)}</td><td className="p-4">{percentage(item.averageScore)}</td><td className="p-4">{item.missingCount}</td></tr>)}</tbody></table></div>}
        </section>

        {detail && <section className="bg-white dark:bg-dark-card rounded-2xl border border-azure/30 p-5"><div className="flex justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-gray-500">Selected assignment</p><h2 className="font-semibold text-lg mt-1">{detail.title}</h2></div><button onClick={() => setDetail(null)} className="text-sm text-gray-500">Close</button></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-sm"><div><p className="text-gray-500">Attempts</p><strong>{detail.averageAttempts ?? "—"}</strong></div><div><p className="text-gray-500">Late</p><strong>{detail.lateCount}</strong></div><div><p className="text-gray-500">Draft grades</p><strong>{detail.draftGrades}</strong></div><div><p className="text-gray-500">Returned grades</p><strong>{detail.returnedGrades}</strong></div></div></section>}

        <section className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/40 overflow-hidden">
          <header className="p-5 border-b border-gray-200 dark:border-gray-700/40"><h2 className="font-semibold">Student metrics</h2></header>
          {students.length === 0 ? <p className="p-8 text-center text-gray-500">No active students.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-gray-500 bg-gray-50 dark:bg-dark-surface"><tr><th className="p-4">Student</th><th className="p-4">Enrollment</th><th className="p-4">Completion</th><th className="p-4">Average</th><th className="p-4">Late</th><th className="p-4">Attempts</th></tr></thead><tbody>{students.map((item) => <tr key={item.studentId} className="border-t border-gray-100 dark:border-gray-700/30"><td className="p-4 font-medium">{item.fullName}</td><td className="p-4 font-mono">{item.enrollmentNumber}</td><td className="p-4">{percentage(item.completionRate)}</td><td className="p-4">{percentage(item.averageScore)}</td><td className="p-4">{item.lateCount}</td><td className="p-4">{item.totalAttempts}</td></tr>)}</tbody></table></div>}
        </section>
      </div>}
    </DashboardLayout>
  );
}
