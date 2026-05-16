import { useEffect, useState } from "react";
import { Link } from "react-router";

import { useAuth } from "~/core/providers/AuthProvider";
import { DashboardLayout } from "~/shared/components/DashboardLayout";
import { StatCard } from "~/shared/components/StatCard";
import { getGroups } from "../api/groups.api";
import { GroupCard } from "../components/GroupCard";
import { AssignmentCard } from "../components/AssignmentCard";
import { listAssignments } from "../api/assignment.api";
import type { Group } from "../types/group.types";
import type { Assignment } from "../types/assignment.types";
import { STUDENT_NAV, STUDENT_SIDEBAR_ITEMS, STUDENT_STATS_ICONS } from "../config/dashboard.config";
import { getStudentStats } from "../data/student-dashboard.data";


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
        {getStudentStats(totalPending, groups.length, groups.reduce((a, g) => a + g.inProgress, 0), assignments.length).map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
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
