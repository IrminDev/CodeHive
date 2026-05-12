import { useEffect, useState } from "react";
import { Link } from "react-router";
import { TeacherLayout } from "../components/TeacherLayout";
import { useAuth } from "~/core/providers/AuthProvider";

// TODO: Replace mock data with real API calls
const MOCK_STATS = {
  totalAssignments: 12,
  activeGroups: 4,
  totalStudents: 87,
  pendingReviews: 5,
};

const MOCK_ASSIGNMENTS = [
  { id: "1", title: "Binary Search Implementation", language: "PYTHON", status: "ACTIVE", submissions: 42, dueDate: "Jun 1, 2026" },
  { id: "2", title: "Sorting Algorithms", language: "JAVA", status: "ACTIVE", submissions: 28, dueDate: "May 25, 2026" },
  { id: "3", title: "Graph Traversal", language: "CPP", status: "PENDING", submissions: 0, dueDate: "Jun 15, 2026" },
  { id: "4", title: "Dynamic Programming Basics", language: "PYTHON", status: "ACTIVE", submissions: 17, dueDate: "May 30, 2026" },
];

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
    <TeacherLayout>
      {/* Welcome header */}
      <div
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
        className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 transition-all duration-700 delay-100 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <StatCard
          label="Total Assignments"
          value={MOCK_STATS.totalAssignments}
          gradient="from-azure to-french"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          label="Active Groups"
          value={MOCK_STATS.activeGroups}
          gradient="from-french to-imperial"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total Students"
          value={MOCK_STATS.totalStudents}
          gradient="from-yellow to-gold"
          textDark
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
            </svg>
          }
        />
        <StatCard
          label="Pending Reviews"
          value={MOCK_STATS.pendingReviews}
          gradient="from-gold to-yellow"
          textDark
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* TEMPORARY: Create Assignment CTA — will be removed in the final version */}
      <div
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
    </TeacherLayout>
  );
}

function StatCard({
  label,
  value,
  gradient,
  icon,
  textDark = false,
}: {
  label: string;
  value: number;
  gradient: string;
  icon: React.ReactNode;
  textDark?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-gray-200 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div
        className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} ${
          textDark ? "text-imperial" : "text-white"
        } mb-3`}
      >
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}
