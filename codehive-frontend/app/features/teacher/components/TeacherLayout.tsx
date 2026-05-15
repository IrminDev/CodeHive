import React, { useState } from "react";
import { Link } from "react-router";
import { Home, BookOpen, Users, BarChart2, X } from "lucide-react";
import { AppHeader } from "~/shared/components/AppHeader";

interface TeacherLayoutProps {
  children: React.ReactNode;
}

const TEACHER_NAV = [
  { label: "Dashboard", to: "/teacher" },
  { label: "Assignments", to: "/teacher/assignments" },
  { label: "Groups", to: "/teacher/groups" },
];

export const TeacherLayout: React.FC<TeacherLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white flex flex-col font-sans transition-colors duration-200">
      <AppHeader
        navLinks={TEACHER_NAV}
        logoLinkTo="/teacher"
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
          className={`fixed sm:static inset-y-0 left-0 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-gray-800 flex flex-col z-50 transform transition-all duration-300
            ${isSidebarOpen ? "w-64 translate-x-0" : "-translate-x-full sm:translate-x-0 sm:w-20 lg:w-64"}`}
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

          <nav className="p-4 flex flex-col gap-1 flex-1">
            <SidebarItem icon={<Home size={22} />} label="Dashboard" to="/teacher" />
            <SidebarItem icon={<BookOpen size={22} />} label="Assignments" to="/teacher/assignments" />
            <SidebarItem icon={<Users size={22} />} label="Groups" to="/teacher/groups" />
            <SidebarItem icon={<BarChart2 size={22} />} label="Analytics" to="/teacher/analytics" />
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
}: {
  icon: React.ReactNode;
  label: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors group text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card hover:text-gray-900 dark:hover:text-white"
    >
      <span className="group-hover:text-azure dark:group-hover:text-yellow transition-colors">
        {icon}
      </span>
      <span className="font-medium sm:hidden lg:block">{label}</span>
    </Link>
  );
}
