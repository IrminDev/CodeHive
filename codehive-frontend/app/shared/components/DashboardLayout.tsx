import React, { useState } from "react";
import { Link, useLocation } from "react-router";
import { X } from "lucide-react";

import { AppHeader } from "./AppHeader";
import { TeacherShell, type TeacherNavigation } from "~/features/teacher/components/TeacherShell";

export interface DashboardNavLink {
  label: string;
  to: string;
}

export interface DashboardSidebarItem {
  icon: React.ReactNode;
  label: string;
  to: string;
  exact?: boolean;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navLinks: DashboardNavLink[];
  sidebarItems: DashboardSidebarItem[];
  logoLinkTo: string;
}

export function DashboardLayout({ children, navLinks, sidebarItems, logoLinkTo }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const currentLocation = `${location.pathname}${location.hash}`;

  if (logoLinkTo === "/teacher") {
    const active: TeacherNavigation = location.pathname.startsWith("/teacher/assignments") || location.pathname === "/teacher/create-assignment"
      ? "assignments"
      : location.pathname.startsWith("/teacher/groups")
        ? "groups"
        : location.pathname.startsWith("/teacher/grades")
          ? "grades"
          : location.pathname.startsWith("/teacher/analytics")
            ? "analytics"
            : location.pathname.startsWith("/teacher/notifications")
              ? "notifications"
              : "dashboard";
    const label = active === "dashboard" ? "Dashboard" : active.charAt(0).toUpperCase() + active.slice(1);
    return <TeacherShell active={active} breadcrumbs={[{ label: "Teacher", to: "/teacher" }, { label }]}>{children}</TeacherShell>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white flex flex-col font-sans transition-colors duration-200">
      <AppHeader
        navLinks={navLinks}
        logoLinkTo={logoLinkTo}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex flex-1 relative">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 sm:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed sm:static inset-y-0 left-0 w-64 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-gray-800 transform transition-all duration-300 z-50 flex flex-col
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0 sm:w-20 lg:w-64"}`}
        >
          <div className="p-4 flex items-center justify-between sm:hidden border-b border-gray-200 dark:border-gray-800">
            <span className="font-semibold gradient-text">CodeHive</span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-md"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="p-4 flex flex-col gap-2 flex-1">
            {sidebarItems.map((item) => (
              <SidebarItem key={item.to} item={item} currentLocation={currentLocation} />
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({
  item,
  currentLocation,
}: {
  item: DashboardSidebarItem;
  currentLocation: string;
}) {
  const active = item.exact
    ? currentLocation === item.to
    : currentLocation === item.to || currentLocation.startsWith(`${item.to}/`);

  return (
    <Link
      to={item.to}
      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors group ${
        active
          ? "bg-azure/10 dark:bg-yellow/10 text-azure dark:text-yellow"
          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      <div
        className={active ? "text-azure dark:text-yellow" : "group-hover:text-azure dark:group-hover:text-yellow transition-colors"}
      >
        {item.icon}
      </div>
      <span className={`font-medium sm:hidden lg:block ${active ? "text-gray-900 dark:text-white" : ""}`}>
        {item.label}
      </span>
    </Link>
  );
}
