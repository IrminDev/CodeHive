import { useEffect, useState } from "react";
import { Link } from "react-router";

import { useAuth } from "~/core/providers/AuthProvider";
import { DashboardLayout } from "~/shared/components/DashboardLayout";
import { StatCard } from "~/shared/components/StatCard";
import { TEACHER_NAV, TEACHER_SIDEBAR_ITEMS } from "../config/dashboard.config";
import { MOCK_ASSIGNMENTS, TEACHER_STATS_CONFIG } from "../data/teacher-dashboard.data";

const LANGUAGE_LABELS: Record<string, string> = {
  PYTHON: "Python",
  JAVA: "Java",
  CPP: "C++",
  C: "C",
};

export function TeacherDashboardPage() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <DashboardLayout
      logoLinkTo="/teacher"
      navLinks={TEACHER_NAV}
      sidebarItems={TEACHER_SIDEBAR_ITEMS}
    >
      {/* Welcome header */}
      <div
        id="overview"
        className={`mb-8 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          Welcome back,{" "}
          <span className="gradient-text">{user?.name?.split(" ")[0] || "Teacher"}</span>!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your assignments and track student progress from here.
        </p>
      </div>

      {/* Stats grid */}
      <div
        id="stats"
        className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 transition-all duration-700 delay-100 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {TEACHER_STATS_CONFIG.map((stat, idx) => (
          <StatCard key={idx} accent={stat.gradient} {...stat} />
        ))}
      </div>

      {/* TEMPORARY: Create Assignment CTA — will be removed in the final version */}
      <div
        id="assignments"
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-imperial via-french to-azure p-8 mb-8 transition-all duration-700 delay-200 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-yellow/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-sm font-medium text-white mb-3">
              <span className="w-2 h-2 rounded-full bg-yellow animate-pulse" />
              New Assignment
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Ready to create a challenge?</h2>
            <p className="text-white/70">
              Upload a reference solution, add test cases, and let CodeHive handle the grading.
            </p>
          </div>
          <Link
            to="/teacher/create-assignment"
            className="btn-secondary inline-flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Assignment
          </Link>
        </div>
      </div>

      {/* Recent assignments */}
      <div
        id="recent-assignments"
        className={`transition-all duration-700 delay-300 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Assignments</h2>
          <Link
            to="/teacher/assignments"
            className="text-sm font-medium text-azure dark:text-yellow hover:underline transition-colors"
          >
            View all
          </Link>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-gray-100 dark:border-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <span>Title</span>
            <span>Language</span>
            <span>Submissions</span>
            <span>Due Date</span>
            <span>Status</span>
          </div>

          {MOCK_ASSIGNMENTS.map((a, index) => (
            <div
              key={a.id}
              className={`grid sm:grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors ${
                index < MOCK_ASSIGNMENTS.length - 1 ? "border-b border-gray-100 dark:border-gray-700/30" : ""
              }`}
            >
              <span className="font-medium text-gray-900 dark:text-white text-sm">{a.title}</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-azure/10 dark:bg-azure/20 text-azure dark:text-azure-light font-medium w-fit">
                {LANGUAGE_LABELS[a.language] ?? a.language}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 text-right">
                {a.submissions} <span className="hidden sm:inline">submitted</span>
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{a.dueDate}</span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium w-fit ${
                  a.status === "ACTIVE"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-yellow/10 text-yellow dark:text-gold"
                }`}
              >
                {a.status === "ACTIVE" ? "Active" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
