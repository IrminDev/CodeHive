import { BarChart2, BookOpen, ClipboardList, GraduationCap, Home, Users } from "lucide-react";

import type { DashboardNavLink, DashboardSidebarItem } from "~/shared/components/DashboardLayout";

export const TEACHER_NAV: DashboardNavLink[] = [
  { label: "Overview", to: "/teacher" },
  { label: "Assignments", to: "/teacher/assignments" },
  { label: "Groups", to: "/teacher/groups" },
  { label: "Grades", to: "/teacher/grades" },
  { label: "Analytics", to: "/teacher/analytics" },
];

export const TEACHER_SIDEBAR_ITEMS: DashboardSidebarItem[] = [
  { icon: <Home size={22} />, label: "Overview", to: "/teacher", exact: true },
  { icon: <BookOpen size={22} />, label: "Assignments", to: "/teacher/assignments" },
  { icon: <Users size={22} />, label: "Groups", to: "/teacher/groups" },
  { icon: <GraduationCap size={22} />, label: "Grades", to: "/teacher/grades" },
  { icon: <BarChart2 size={22} />, label: "Analytics", to: "/teacher/analytics" },
];

export const TEACHER_CREATE_NAV: DashboardNavLink[] = [
  { label: "Dashboard", to: "/teacher" },
  { label: "Create Assignment", to: "/teacher/create-assignment" },
];

export const TEACHER_CREATE_SIDEBAR_ITEMS: DashboardSidebarItem[] = [
  { icon: <Home size={22} />, label: "Dashboard", to: "/teacher", exact: true },
  { icon: <ClipboardList size={22} />, label: "Create Assignment", to: "/teacher/create-assignment", exact: true },
];
