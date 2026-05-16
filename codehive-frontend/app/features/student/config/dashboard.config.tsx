import { BookOpen, ClipboardList, Home, Users, Code2 } from "lucide-react";

import type { DashboardNavLink, DashboardSidebarItem } from "~/shared/components/DashboardLayout";

export const STUDENT_NAV: DashboardNavLink[] = [
  { label: "Overview", to: "/dashboard" },
  { label: "Pending Tasks", to: "/dashboard/pending" },
  { label: "Archived Classes", to: "/dashboard/archived-classes" },
];

export const STUDENT_SIDEBAR_ITEMS: DashboardSidebarItem[] = [
  { icon: <Home size={22} />, label: "Overview", to: "/dashboard", exact: true },
  { icon: <ClipboardList size={22} />, label: "Pending Tasks", to: "/dashboard/pending" },
  { icon: <Users size={22} />, label: "Archived Classes", to: "/dashboard/archived-classes" },
];

export const STUDENT_STATS_ICONS = {
  pending: <ClipboardList size={20} />,
  groups: <Users size={20} />,
  inProgress: <Code2 size={20} />,
  assignments: <BookOpen size={20} />,
} as const;