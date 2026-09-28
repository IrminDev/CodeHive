import { useCallback, useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";
import { Link } from "react-router";

import { getTeacherDashboard } from "../api/dashboard.api";
import {
  DashboardSummary,
  GradingQueue,
  RecentSubmissionActivity,
  UpcomingTimeline,
  ValidationQueue,
} from "../components/TeacherDashboardUI";
import { TeacherShell } from "../components/TeacherShell";
import { TeacherError, TeacherLoading, TeacherPageHeader } from "../components/TeacherUI";
import type { TeacherDashboardData } from "../types/dashboard.types";

export function TeacherDashboardPage() {
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getTeacherDashboard());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load teacher dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <TeacherShell active="dashboard" breadcrumbs={[{ label: "Teacher" }, { label: "Dashboard" }]} contentClassName="max-w-7xl">
      <TeacherPageHeader
        eyebrow="Action center"
        title="Teacher dashboard"
        description="Resolve validation issues, grade submitted work, and keep upcoming assignment dates visible."
        actions={
          <>
            <Link to="/teacher/groups/create" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-azure/30 hover:text-azure dark:border-gray-700 dark:text-gray-400 dark:hover:border-yellow/30 dark:hover:text-yellow"><Users size={14} /> New group</Link>
            <Link to="/teacher/create-assignment" className="btn-primary inline-flex items-center gap-1.5"><Plus size={14} /> New assignment</Link>
          </>
        }
      />

      {loading ? <TeacherLoading rows={5} /> : error || !data ? <TeacherError message={error ?? "Dashboard unavailable."} onRetry={() => void load()} /> : (
        <div className="space-y-6">
          <DashboardSummary summary={data.summary} />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
            <div className="space-y-6">
              <ValidationQueue items={data.validationItems} />
              <GradingQueue items={data.gradingItems} />
            </div>
            <div className="space-y-6">
              <UpcomingTimeline items={data.upcomingDeadlines} />
              <RecentSubmissionActivity items={data.recentSubmissions} />
            </div>
          </div>
        </div>
      )}
    </TeacherShell>
  );
}
