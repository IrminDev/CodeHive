import React, { useState } from "react";
import { Link } from "react-router";
import { Home, ClipboardList, Archive, X } from "lucide-react";
import { AppHeader } from "~/shared/components/AppHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const STUDENT_NAV = [
  { label: "My Groups", to: "/dashboard" },
  { label: "Courses", to: "/courses" },
  { label: "Grades", to: "/grades" },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white flex flex-col font-sans transition-colors duration-200">
      <AppHeader
        navLinks={STUDENT_NAV}
        logoLinkTo="/dashboard"
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex flex-1 relative">
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 sm:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
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
            <SidebarItem icon={<Home size={22} />} label="Inicio" to="/dashboard" active />
            <SidebarItem icon={<ClipboardList size={22} />} label="Tareas pendientes" to="/tasks" />
            <SidebarItem icon={<Archive size={22} />} label="Clases archivadas" to="/archived" />
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

function SidebarItem({
  icon,
  label,
  to,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  to: string;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors group ${
        active
          ? "bg-azure/10 dark:bg-yellow/10 text-azure dark:text-yellow"
          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      <div className={active ? "text-azure dark:text-yellow" : "group-hover:text-azure dark:group-hover:text-yellow transition-colors"}>
        {icon}
      </div>
      <span className={`font-medium sm:hidden lg:block ${active ? "text-gray-900 dark:text-white" : ""}`}>
        {label}
      </span>
    </Link>
  );
}
