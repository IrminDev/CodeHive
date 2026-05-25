import { useEffect, useState } from "react";
import { Link } from "react-router";

import { useAuth } from "~/core/providers/AuthProvider";
import { DashboardLayout } from "~/shared/components/DashboardLayout";
import { getGroups } from "../api/groups.api";
import { GroupCard } from "../components/GroupCard";
import { listAssignments } from "../api/assignment.api";
import type { Group } from "../types/group.types";
import type { Assignment } from "../types/assignment.types";
import { STUDENT_NAV, STUDENT_SIDEBAR_ITEMS, STUDENT_STATS_ICONS } from "../config/dashboard.config";

const LANGUAGE_LABELS: Record<string, string> = {
  PYTHON: "Python",
  JAVA: "Java",
  CPP: "C++",
  C: "C",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function StudentDashboardPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [visibleCards, setVisibleCards] = useState<number[]>([]);

  useEffect(() => {
    setIsVisible(true);
    getGroups()
      .then(setGroups)
      .finally(() => setLoadingGroups(false));
    listAssignments(0, 8)
      .then((page) => setAssignments(page.content))
      .catch(() => setAssignments([]))
      .finally(() => setLoadingAssignments(false));
  }, []);

  useEffect(() => {
    if (!loadingAssignments) {
      assignments.forEach((_, i) => {
        setTimeout(() => setVisibleCards((prev) => [...prev, i]), i * 80);
      });
    }
  }, [loadingAssignments, assignments]);

  const totalPending = groups.reduce((acc, g) => acc + g.pendingPractices, 0);

  return (
    <DashboardLayout
      logoLinkTo="/dashboard"
      navLinks={STUDENT_NAV}
      sidebarItems={STUDENT_SIDEBAR_ITEMS}
    >
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 -left-32 w-96 h-96 rounded-full blur-3xl bg-azure/10 dark:bg-azure/5 animate-float" />
        <div className="absolute bottom-20 -right-32 w-96 h-96 rounded-full blur-3xl bg-yellow/10 dark:bg-yellow/5 animate-float" style={{ animationDelay: "3s" }} />
      </div>

      {/* Welcome hero */}
      <div
        id="overview"
        className={`mb-10 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-azure/10 dark:bg-yellow/10 border border-azure/20 dark:border-yellow/20 mb-4">
          <span className="w-2 h-2 rounded-full bg-azure dark:bg-yellow animate-pulse" />
          <span className="text-sm font-medium text-azure dark:text-yellow">Student Portal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back,{" "}
          <span className="gradient-text">{user?.name?.split(" ")[0] || "Student"}</span>!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {totalPending > 0
            ? `You have ${totalPending} pending ${totalPending === 1 ? "practice" : "practices"} across your groups.`
            : "You're all caught up. Keep it up!"}
        </p>
      </div>

      {/* Stats */}
      <div
        className={`grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 transition-all duration-700 delay-100 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <StatCard
          label="Pending"
          value={totalPending}
          icon={STUDENT_STATS_ICONS.pending}
          accent="from-azure to-french"
        />
        <StatCard
          label="Groups"
          value={groups.length}
          icon={STUDENT_STATS_ICONS.groups}
          accent="from-french to-imperial"
        />
        <StatCard
          label="In Progress"
          value={groups.reduce((a, g) => a + g.inProgress, 0)}
          icon={STUDENT_STATS_ICONS.inProgress}
          accent="from-azure to-french"
        />
        <StatCard
          label="Assignments"
          value={assignments.length}
          icon={STUDENT_STATS_ICONS.assignments}
          accent="from-yellow to-gold"
        />
      </div>

      {/* My Groups */}
      <section
        id="groups"
        className={`mb-12 transition-all duration-700 delay-200 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Groups</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-azure/10 dark:bg-yellow/10 text-azure dark:text-yellow border border-azure/20 dark:border-yellow/20">
            {groups.length}
          </span>
        </div>

        {loadingGroups ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[0, 1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-56 rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-dark-card animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </section>

      {/* Available Assignments */}
      <section
        id="assignments"
        className={`transition-all duration-700 delay-300 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Available Assignments</h2>
          {!loadingAssignments && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-azure/10 dark:bg-yellow/10 text-azure dark:text-yellow border border-azure/20 dark:border-yellow/20">
              {assignments.length}
            </span>
          )}
        </div>

        {loadingAssignments ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((n) => (
              <div
                key={n}
                className="h-44 rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-dark-card animate-pulse"
              />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-dark-card p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-azure to-french text-white mb-4">
              {STUDENT_STATS_ICONS.assignments}
            </div>
            <p className="text-gray-900 dark:text-white font-semibold mb-1">No assignments yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your teacher will publish assignments here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {assignments.map((assignment, i) => (
              <div
                key={assignment.id}
                className={`transition-all duration-500 ${
                  visibleCards.includes(i) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <AssignmentCard assignment={assignment} />
              </div>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-gray-200 dark:border-gray-700/50 hover:border-azure/50 dark:hover:border-yellow/50 transition-all duration-300 hover:shadow-lg hover:shadow-azure/5 dark:hover:shadow-yellow/5 hover:-translate-y-0.5">
      <div
        className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${accent} text-white mb-3`}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();

  return (
    <Link
      to={`/assignment/${assignment.id}`}
      className="block bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50 hover:border-azure/50 dark:hover:border-yellow/50 transition-all duration-500 hover:shadow-xl hover:shadow-azure/5 dark:hover:shadow-yellow/5 hover:-translate-y-1 relative overflow-hidden group"
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-azure to-french opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Active badge */}
      {assignment.isActive && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-azure/10 dark:bg-yellow/10 border border-azure/20 dark:border-yellow/20 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-azure dark:bg-yellow animate-pulse" />
          <span className="text-xs font-medium text-azure dark:text-yellow">Active</span>
        </div>
      )}

      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-azure dark:group-hover:text-yellow transition-colors">
        {assignment.title}
      </h3>

      {assignment.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{assignment.description}</p>
      )}

      {/* Languages */}
      {assignment.allowedLanguages?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {assignment.allowedLanguages.map((lang) => (
            <span
              key={lang}
              className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-dark-surface text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50"
            >
              {LANGUAGE_LABELS[lang] ?? lang}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-700/50">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {assignment.timeLimitMs ? `${assignment.timeLimitMs}ms` : "—"}
        </span>
        {assignment.dueDate && (
          <span className={isOverdue ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}>
            Due {formatDate(assignment.dueDate)}
          </span>
        )}
      </div>
    </Link>
  );
}

